'use server';

import { db, accounts, transactionEntries, eq, sql } from '@ethos/db';

export type AccountBalance = {
  accountId: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
  currency: string;
  balance: string;
};

export async function getBalances(workspaceId: string): Promise<AccountBalance[]> {
  const rows = await db
    .select({
      accountId: accounts.id,
      name: accounts.name,
      type: accounts.type,
      currency: accounts.currency,
      balance: sql<string>`coalesce(sum(${transactionEntries.baseAmount}), 0)`,
    })
    .from(accounts)
    .leftJoin(transactionEntries, eq(transactionEntries.accountId, accounts.id))
    .where(eq(accounts.workspaceId, workspaceId))
    .groupBy(accounts.id, accounts.name, accounts.type, accounts.currency);

  return rows;
}
