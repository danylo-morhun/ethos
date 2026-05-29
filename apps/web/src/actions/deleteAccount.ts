'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db, accounts, workspaces, transactionEntries, eq } from '@ethos/db';

export async function deleteAccount(
  accountId: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [account] = await db.select({ workspaceId: accounts.workspaceId })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) return { error: 'Account not found' };

  const [ws] = await db.select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, account.workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) return { error: 'Forbidden' };

  const entries = await db
    .select({ id: transactionEntries.id })
    .from(transactionEntries)
    .where(eq(transactionEntries.accountId, accountId))
    .limit(1);

  if (entries.length > 0) {
    return { error: 'Cannot delete account with existing transactions' };
  }

  await db.delete(accounts).where(eq(accounts.id, accountId));

  revalidatePath('/dashboard');
  return { success: true };
}
