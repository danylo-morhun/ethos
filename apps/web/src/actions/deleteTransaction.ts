'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db, transactions, workspaces, eq } from '@ethos/db';

export async function deleteTransaction(
  transactionId: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [txn] = await db.select({ workspaceId: transactions.workspaceId })
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!txn) return { error: 'Transaction not found' };

  const [ws] = await db.select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, txn.workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) return { error: 'Forbidden' };

  // transaction_entries.transaction_id has onDelete: 'cascade' — entries deleted automatically
  await db.delete(transactions).where(eq(transactions.id, transactionId));

  revalidatePath('/dashboard');
  return { success: true };
}
