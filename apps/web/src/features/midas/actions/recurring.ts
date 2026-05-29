'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { getExchangeRate } from '@/features/midas/lib/exchange-rates';
import {
  db,
  recurringTransactions,
  transactions,
  transactionEntries,
  accounts,
  workspaces,
  eq,
  and,
  lte,
  isNull,
  or,
  gte,
} from '@ethos/db';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RecurringTransaction = {
  id: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: string;
  currency: string;
  description: string | null;
  frequency: Frequency;
  nextDate: string;
  endDate: string | null;
  isActive: boolean;
};

function advanceDate(dateStr: string, frequency: Frequency): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  switch (frequency) {
    case 'daily':   dt.setDate(dt.getDate() + 1); break;
    case 'weekly':  dt.setDate(dt.getDate() + 7); break;
    case 'monthly': dt.setMonth(dt.getMonth() + 1); break;
    case 'yearly':  dt.setFullYear(dt.getFullYear() + 1); break;
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export async function getRecurringTransactions(workspaceId: string): Promise<RecurringTransaction[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [ws] = await db
    .select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) throw new Error('Forbidden');

  const rows = await db.query.recurringTransactions.findMany({
    where: eq(recurringTransactions.workspaceId, workspaceId),
    with: {
      fromAccount: true,
      toAccount: true,
    },
    orderBy: (rt, { desc }) => [desc(rt.createdAt)],
  });

  return rows.map((r) => ({
    id: r.id,
    fromAccountId: r.fromAccountId,
    fromAccountName: r.fromAccount?.name ?? '—',
    toAccountId: r.toAccountId,
    toAccountName: r.toAccount?.name ?? '—',
    amount: r.amount,
    currency: r.currency,
    description: r.description,
    frequency: r.frequency as Frequency,
    nextDate: r.nextDate,
    endDate: r.endDate,
    isActive: r.isActive,
  }));
}

export async function createRecurringTransaction(data: {
  workspaceId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description?: string;
  frequency: Frequency;
  startDate: string;
  endDate?: string;
}): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [wsRows, fromRows, toRows] = await Promise.all([
    db.select().from(workspaces).where(eq(workspaces.id, data.workspaceId)).limit(1),
    db.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.id, data.fromAccountId), eq(accounts.workspaceId, data.workspaceId))).limit(1),
    db.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.id, data.toAccountId), eq(accounts.workspaceId, data.workspaceId))).limit(1),
  ]);

  const ws = wsRows[0];
  if (!ws || ws.userId !== session.user.id) return { error: 'Forbidden' };
  if (!fromRows[0] || !toRows[0]) return { error: 'Account not found' };

  await db.insert(recurringTransactions).values({
    workspaceId: data.workspaceId,
    fromAccountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    amount: String(data.amount),
    currency: data.currency,
    description: data.description ?? null,
    frequency: data.frequency,
    nextDate: data.startDate,
    endDate: data.endDate ?? null,
    isActive: true,
  });

  revalidatePath('/midas');
  return { success: true };
}

export async function toggleRecurring(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [rt] = await db.select().from(recurringTransactions).where(eq(recurringTransactions.id, id)).limit(1);
  if (!rt) return { error: 'Not found' };

  const [ws] = await db.select({ userId: workspaces.userId }).from(workspaces).where(eq(workspaces.id, rt.workspaceId)).limit(1);
  if (!ws || ws.userId !== session.user.id) return { error: 'Forbidden' };

  await db.update(recurringTransactions).set({ isActive: !rt.isActive, updatedAt: new Date() }).where(eq(recurringTransactions.id, id));
  revalidatePath('/midas');
  return { success: true };
}

export async function deleteRecurringTransaction(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [rt] = await db.select({ workspaceId: recurringTransactions.workspaceId }).from(recurringTransactions).where(eq(recurringTransactions.id, id)).limit(1);
  if (!rt) return { error: 'Not found' };

  const [ws] = await db.select({ userId: workspaces.userId }).from(workspaces).where(eq(workspaces.id, rt.workspaceId)).limit(1);
  if (!ws || ws.userId !== session.user.id) return { error: 'Forbidden' };

  await db.delete(recurringTransactions).where(eq(recurringTransactions.id, id));
  revalidatePath('/midas');
  return { success: true };
}

export async function generateDueRecurring(workspaceId: string): Promise<{ generated: number }> {
  const session = await auth();
  if (!session?.user?.id) return { generated: 0 };

  const [ws] = await db
    .select({ userId: workspaces.userId, baseCurrency: workspaces.baseCurrency })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) return { generated: 0 };

  const today = new Date().toISOString().slice(0, 10);

  const due = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.workspaceId, workspaceId),
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextDate, today),
        or(isNull(recurringTransactions.endDate), gte(recurringTransactions.endDate, recurringTransactions.nextDate)),
      ),
    );

  let generated = 0;

  for (const rt of due) {
    let currentDate = rt.nextDate;
    let iterations = 0;
    const MAX_ITERATIONS = 365;

    while (currentDate <= today && iterations < MAX_ITERATIONS) {
      if (rt.endDate && currentDate > rt.endDate) break;

      const amount = Number(rt.amount);
      let baseAmount: number;
      if (rt.currency === ws.baseCurrency) {
        baseAmount = amount;
      } else {
        try {
          const rate = await getExchangeRate(rt.currency, ws.baseCurrency, currentDate);
          baseAmount = amount * rate;
        } catch {
          break;
        }
      }

      await db.transaction(async (tx) => {
        const [txn] = await tx
          .insert(transactions)
          .values({ workspaceId, date: currentDate, description: rt.description })
          .returning();

        await tx.insert(transactionEntries).values([
          { transactionId: txn.id, accountId: rt.fromAccountId, amount: String(-amount), currency: rt.currency, baseAmount: (-baseAmount).toFixed(4) },
          { transactionId: txn.id, accountId: rt.toAccountId, amount: String(amount), currency: rt.currency, baseAmount: baseAmount.toFixed(4) },
        ]);
      });

      generated++;
      currentDate = advanceDate(currentDate, rt.frequency as Frequency);
      iterations++;
    }

    await db
      .update(recurringTransactions)
      .set({ nextDate: currentDate, updatedAt: new Date() })
      .where(eq(recurringTransactions.id, rt.id));
  }

  if (generated > 0) revalidatePath('/midas');
  return { generated };
}
