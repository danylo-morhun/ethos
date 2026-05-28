'use server';

import { db, accounts, transactionEntries, transactions, eq, and, sql } from '@ethos/db';

export type AccountBalance = {
  accountId: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
  currency: string;
  balance: string;
};

export async function getBalances(
  workspaceId: string,
  from: string,
  to: string,
): Promise<AccountBalance[]> {
  // ASSET/LIABILITY: historical balance up to `to` (balance sheet)
  // INCOME/EXPENSE: entries strictly within [from, to] (cash flow)
  const rows = await db
    .select({
      accountId: accounts.id,
      name: accounts.name,
      type: accounts.type,
      currency: accounts.currency,
      balance: sql<string>`coalesce(sum(
        case
          when ${accounts.type} in ('ASSET', 'LIABILITY')
               and (${transactions.date} is null or ${transactions.date} <= ${to})
            then ${transactionEntries.baseAmount}
          when ${accounts.type} in ('INCOME', 'EXPENSE')
               and ${transactions.date} >= ${from}
               and ${transactions.date} <= ${to}
            then ${transactionEntries.baseAmount}
          else null
        end
      ), 0)`,
    })
    .from(accounts)
    .leftJoin(transactionEntries, eq(transactionEntries.accountId, accounts.id))
    .leftJoin(transactions, and(eq(transactions.id, transactionEntries.transactionId)))
    .where(eq(accounts.workspaceId, workspaceId))
    .groupBy(accounts.id, accounts.name, accounts.type, accounts.currency);

  return rows;
}
