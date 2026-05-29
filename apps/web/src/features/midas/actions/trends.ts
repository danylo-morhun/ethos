'use server';

import { db, accounts, transactionEntries, transactions, eq, and, sql, gte, inArray } from '@ethos/db';

export type MonthlyTrend = {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
};

export async function getMonthlyTrends(
  workspaceId: string,
  months = 6,
): Promise<MonthlyTrend[]> {
  const cutoff = new Date();
  cutoff.setDate(1);
  cutoff.setMonth(cutoff.getMonth() - (months - 1));
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const rows = await db
    .select({
      month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
      type: accounts.type,
      total: sql<string>`coalesce(sum(${transactionEntries.baseAmount}), 0)`,
    })
    .from(accounts)
    .innerJoin(transactionEntries, eq(transactionEntries.accountId, accounts.id))
    .innerJoin(transactions, eq(transactions.id, transactionEntries.transactionId))
    .where(
      and(
        eq(accounts.workspaceId, workspaceId),
        inArray(accounts.type, ['INCOME', 'EXPENSE']),
        gte(transactions.date, cutoffDate),
      ),
    )
    .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`, accounts.type)
    .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`);

  const byMonth = new Map<string, MonthlyTrend>();

  for (const row of rows) {
    if (!byMonth.has(row.month)) {
      byMonth.set(row.month, { month: row.month, income: 0, expenses: 0 });
    }
    const entry = byMonth.get(row.month)!;
    if (row.type === 'INCOME') entry.income = Math.abs(Number(row.total));
    if (row.type === 'EXPENSE') entry.expenses = Math.abs(Number(row.total));
  }

  return Array.from(byMonth.values());
}
