'use server';

import { revalidatePath } from 'next/cache';
import { db, accounts, transactionEntries, eq } from '@ethos/db';

export async function deleteAccount(
  accountId: string,
): Promise<{ error: string } | { success: true }> {
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
