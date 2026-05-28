'use server';

import { db, transactions, eq, and, desc, gte, lte } from '@ethos/db';

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

export async function getRecentTransactions(
  workspaceId: string,
  from: string | undefined,
  to: string | undefined,
): Promise<RecentTransaction[]> {
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
