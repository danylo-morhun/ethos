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
  from: string | undefined,
  to: string | undefined,
): Promise<AccountBalance[]> {
  // Build date clauses conditionally — passing null parameters causes Postgres
  // "could not determine data type of parameter $N" when there is no type context.
  // Omitting the clause entirely is both correct and avoids the ambiguity.
  const assetLiabDateClause = to
    ? sql`and (${transactions.date} is null or ${transactions.date} <= ${to})`
    : sql``;
  const incomeFromClause = from ? sql`and ${transactions.date} >= ${from}` : sql``;
  const incomeToClause   = to   ? sql`and ${transactions.date} <= ${to}`   : sql``;

  const rows = await db
    .select({
      accountId: accounts.id,
      name: accounts.name,
      type: accounts.type,
      currency: accounts.currency,
      balance: sql<string>`coalesce(sum(
        case
          when ${accounts.type} in ('ASSET', 'LIABILITY') ${assetLiabDateClause}
            then ${transactionEntries.baseAmount}
          when ${accounts.type} in ('INCOME', 'EXPENSE') ${incomeFromClause} ${incomeToClause}
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
