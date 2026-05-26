'use server';

import { db, transactions, eq, desc } from '@ethos/db';

export type RecentTransaction = {
  id: string;
  date: string;
  description: string | null;
  fromAccount: string;
  toAccount: string;
  amount: string;
};

export async function getRecentTransactions(workspaceId: string): Promise<RecentTransaction[]> {
  const rows = await db.query.transactions.findMany({
    where: eq(transactions.workspaceId, workspaceId),
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
      amount: toEntry?.baseAmount ?? '0',
    };
  });
}
