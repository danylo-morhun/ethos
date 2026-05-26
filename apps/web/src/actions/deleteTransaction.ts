'use server';

import { revalidatePath } from 'next/cache';
import { db, transactions, eq } from '@ethos/db';

export async function deleteTransaction(
  transactionId: string,
): Promise<{ error: string } | { success: true }> {
  // transaction_entries.transaction_id has onDelete: 'cascade' — entries deleted automatically
  await db.delete(transactions).where(eq(transactions.id, transactionId));

  revalidatePath('/dashboard');
  return { success: true };
}
