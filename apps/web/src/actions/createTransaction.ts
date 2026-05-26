'use server';

import { revalidatePath } from 'next/cache';
import { db, transactions, transactionEntries, accounts, eq } from '@ethos/db';

interface CreateTransactionInput {
  workspaceId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: string;
}

export async function createTransaction({
  workspaceId,
  fromAccountId,
  toAccountId,
  amount,
  description,
  date,
}: CreateTransactionInput) {
  const [fromRows, toRows] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.id, fromAccountId)).limit(1),
    db.select().from(accounts).where(eq(accounts.id, toAccountId)).limit(1),
  ]);

  const fromAccount = fromRows[0];
  const toAccount = toRows[0];

  if (!fromAccount || !toAccount) throw new Error('Account not found');

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
        currency: fromAccount.currency,
        baseAmount: String(-amount),
      },
      {
        transactionId: txn.id,
        accountId: toAccountId,
        amount: String(amount),
        currency: toAccount.currency,
        baseAmount: String(amount),
      },
    ]);

    return txn;
  });

  revalidatePath('/dashboard');
  return result;
}
