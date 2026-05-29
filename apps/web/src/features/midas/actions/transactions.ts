'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { getExchangeRate } from '@/features/midas/lib/exchange-rates';
import {
  db,
  transactions,
  transactionEntries,
  accounts,
  workspaces,
  eq,
  and,
  desc,
  gte,
  lte,
  inArray,
  ilike,
  count,
} from '@ethos/db';

export type RecentTransaction = {
  id: string;
  date: string;
  description: string | null;
  fromAccount: string;
  fromAccountId: string;
  fromAccountType: string;
  toAccount: string;
  toAccountId: string;
  toAccountType: string;
  amount: string;
  currency: string;
  baseAmount: string;
};


export async function createTransaction({
  workspaceId,
  fromAccountId,
  toAccountId,
  amount,
  currency,
  description,
  date,
}: {
  workspaceId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description: string | undefined;
  date: string;
}): Promise<{ error: string } | { success: true }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const [wsRows, fromRows, toRows] = await Promise.all([
      db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1),
      db.select().from(accounts).where(and(eq(accounts.id, fromAccountId), eq(accounts.workspaceId, workspaceId))).limit(1),
      db.select().from(accounts).where(and(eq(accounts.id, toAccountId), eq(accounts.workspaceId, workspaceId))).limit(1),
    ]);

    const workspace = wsRows[0];
    if (!workspace || !fromRows[0] || !toRows[0]) return { error: 'Account not found' };
    if (workspace.userId !== session.user.id) return { error: 'Forbidden' };

    const baseCurrency = workspace.baseCurrency;
    let baseAmount: number;
    if (currency === baseCurrency) {
      baseAmount = amount;
    } else {
      const rate = await getExchangeRate(currency, baseCurrency, date);
      baseAmount = amount * rate;
    }

    await db.transaction(async (tx) => {
      const [txn] = await tx
        .insert(transactions)
        .values({ workspaceId, date, description: description ?? null })
        .returning();

      await tx.insert(transactionEntries).values([
        {
          transactionId: txn.id,
          accountId: fromAccountId,
          amount: String(-amount),
          currency,
          baseAmount: (-baseAmount).toFixed(4),
        },
        {
          transactionId: txn.id,
          accountId: toAccountId,
          amount: String(amount),
          currency,
          baseAmount: baseAmount.toFixed(4),
        },
      ]);
    });

    revalidatePath('/midas');
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { error: msg };
  }
}

export async function deleteTransaction(
  transactionId: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [txn] = await db
    .select({ workspaceId: transactions.workspaceId })
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!txn) return { error: 'Transaction not found' };

  const [ws] = await db
    .select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, txn.workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) return { error: 'Forbidden' };

  await db.delete(transactions).where(eq(transactions.id, transactionId));
  revalidatePath('/midas');
  return { success: true };
}

export async function updateTransaction({
  transactionId,
  fromAccountId,
  toAccountId,
  amount,
  currency,
  description,
  date,
}: {
  transactionId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description: string | undefined;
  date: string;
}): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [txnRow] = await db
    .select({ workspaceId: transactions.workspaceId })
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!txnRow) return { error: 'Transaction not found' };

  const [wsRows, fromRows, toRows] = await Promise.all([
    db.select().from(workspaces).where(eq(workspaces.id, txnRow.workspaceId)).limit(1),
    db.select().from(accounts).where(and(eq(accounts.id, fromAccountId), eq(accounts.workspaceId, txnRow.workspaceId))).limit(1),
    db.select().from(accounts).where(and(eq(accounts.id, toAccountId), eq(accounts.workspaceId, txnRow.workspaceId))).limit(1),
  ]);

  const workspace = wsRows[0];
  if (!workspace || workspace.userId !== session.user.id) return { error: 'Forbidden' };
  if (!fromRows[0] || !toRows[0]) return { error: 'Account not found' };

  const baseCurrency = workspace.baseCurrency;
  let baseAmount: number;
  if (currency === baseCurrency) {
    baseAmount = amount;
  } else {
    const rate = await getExchangeRate(currency, baseCurrency, date);
    baseAmount = amount * rate;
  }

  await db.transaction(async (tx) => {
    await tx.update(transactions).set({ date, description: description ?? null }).where(eq(transactions.id, transactionId));
    await tx.delete(transactionEntries).where(eq(transactionEntries.transactionId, transactionId));
    await tx.insert(transactionEntries).values([
      {
        transactionId,
        accountId: fromAccountId,
        amount: String(-amount),
        currency,
        baseAmount: (-baseAmount).toFixed(4),
      },
      {
        transactionId,
        accountId: toAccountId,
        amount: String(amount),
        currency,
        baseAmount: baseAmount.toFixed(4),
      },
    ]);
  });

  revalidatePath('/midas');
  return { success: true };
}

const TRANSACTIONS_PAGE_SIZE = 10;

export async function getRecentTransactions(
  workspaceId: string,
  from: string | undefined,
  to: string | undefined,
  page = 0,
  accountId?: string,
  q?: string,
): Promise<{ rows: RecentTransaction[]; hasMore: boolean; total: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [ws] = await db
    .select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) throw new Error('Forbidden');

  const accountSubquery = accountId
    ? db.selectDistinct({ id: transactionEntries.transactionId })
        .from(transactionEntries)
        .where(eq(transactionEntries.accountId, accountId))
    : undefined;

  const whereClause = and(
    eq(transactions.workspaceId, workspaceId),
    from ? gte(transactions.date, from) : undefined,
    to ? lte(transactions.date, to) : undefined,
    q ? ilike(transactions.description, `%${q}%`) : undefined,
    accountSubquery ? inArray(transactions.id, accountSubquery) : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db.query.transactions.findMany({
      where: whereClause,
      orderBy: [desc(transactions.date), desc(transactions.createdAt)],
      limit: TRANSACTIONS_PAGE_SIZE + 1,
      offset: page * TRANSACTIONS_PAGE_SIZE,
      with: { entries: { with: { account: true } } },
    }),
    db.select({ total: count() }).from(transactions).where(whereClause),
  ]);

  const hasMore = rows.length > TRANSACTIONS_PAGE_SIZE;
  const page_rows = hasMore ? rows.slice(0, TRANSACTIONS_PAGE_SIZE) : rows;

  return {
    hasMore,
    total,
    rows: page_rows.map((txn) => {
      const fromEntry = txn.entries.find((e) => Number(e.baseAmount) < 0);
      const toEntry = txn.entries.find((e) => Number(e.baseAmount) > 0);
      return {
        id: txn.id,
        date: txn.date,
        description: txn.description,
        fromAccount: fromEntry?.account?.name ?? '—',
        fromAccountId: fromEntry?.accountId ?? '',
        fromAccountType: fromEntry?.account?.type ?? '',
        toAccount: toEntry?.account?.name ?? '—',
        toAccountId: toEntry?.accountId ?? '',
        toAccountType: toEntry?.account?.type ?? '',
        amount: toEntry?.amount ?? '0',
        currency: toEntry?.currency ?? '',
        baseAmount: toEntry?.baseAmount ?? '0',
      };
    }),
  };
}
