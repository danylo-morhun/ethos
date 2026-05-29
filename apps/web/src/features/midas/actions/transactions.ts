'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  db,
  transactions,
  transactionEntries,
  accounts,
  exchangeRates,
  workspaces,
  eq,
  and,
  desc,
  gte,
  lte,
} from '@ethos/db';

export type RecentTransaction = {
  id: string;
  date: string;
  description: string | null;
  fromAccount: string;
  toAccount: string;
  amount: string;
  currency: string;
  baseAmount: string;
};

async function getExchangeRate(fromCurrency: string, toCurrency: string, date: string): Promise<number> {
  const cached = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.date, date),
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency),
      ),
    )
    .limit(1);

  if (cached[0]) return Number(cached[0].rate);

  const res = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`);
  if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`);
  const data = (await res.json()) as { rates: Record<string, number> };
  const rate = data.rates[toCurrency];
  if (!rate) throw new Error(`No rate for ${fromCurrency}→${toCurrency}`);

  await db.insert(exchangeRates).values({ date, fromCurrency, toCurrency, rate: String(rate) }).onConflictDoNothing();
  return rate;
}

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
  description: string;
  date: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [wsRows, fromRows, toRows] = await Promise.all([
    db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1),
    db.select().from(accounts).where(eq(accounts.id, fromAccountId)).limit(1),
    db.select().from(accounts).where(eq(accounts.id, toAccountId)).limit(1),
  ]);

  const workspace = wsRows[0];
  const fromAccount = fromRows[0];
  const toAccount = toRows[0];

  if (!workspace || !fromAccount || !toAccount) throw new Error('Account not found');
  if (workspace.userId !== session.user.id) throw new Error('Forbidden');

  const baseCurrency = workspace.baseCurrency;
  const today = new Date().toISOString().slice(0, 10);

  let baseAmount: number;
  if (currency === baseCurrency) {
    baseAmount = amount;
  } else {
    const rate = await getExchangeRate(currency, baseCurrency, today);
    baseAmount = amount * rate;
  }

  const result = await db.transaction(async (tx) => {
    const [txn] = await tx
      .insert(transactions)
      .values({ workspaceId, date, description })
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

    return txn;
  });

  revalidatePath('/midas');
  return result;
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

export async function getRecentTransactions(
  workspaceId: string,
  from: string | undefined,
  to: string | undefined,
): Promise<RecentTransaction[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [ws] = await db
    .select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) throw new Error('Forbidden');

  const rows = await db.query.transactions.findMany({
    where: and(
      eq(transactions.workspaceId, workspaceId),
      from ? gte(transactions.date, from) : undefined,
      to ? lte(transactions.date, to) : undefined,
    ),
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
    limit: 10,
    with: {
      entries: {
        with: { account: true },
      },
    },
  });

  return rows.map((txn) => {
    const fromEntry = txn.entries.find((e) => Number(e.baseAmount) < 0);
    const toEntry = txn.entries.find((e) => Number(e.baseAmount) > 0);
    return {
      id: txn.id,
      date: txn.date,
      description: txn.description,
      fromAccount: fromEntry?.account?.name ?? '—',
      toAccount: toEntry?.account?.name ?? '—',
      amount: toEntry?.amount ?? '0',
      currency: toEntry?.currency ?? '',
      baseAmount: toEntry?.baseAmount ?? '0',
    };
  });
}
