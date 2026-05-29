'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db, accounts, workspaces, transactionEntries, eq } from '@ethos/db';

export async function getAccounts(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [ws] = await db
    .select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) throw new Error('Forbidden');

  return db.select().from(accounts).where(eq(accounts.workspaceId, workspaceId));
}

export async function createAccount(
  workspaceId: string,
  name: string,
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE',
  parentId?: string,
  budget?: number,
  currency?: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [workspace] = await db
    .select({ baseCurrency: workspaces.baseCurrency, userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) throw new Error('Workspace not found');
  if (workspace.userId !== session.user.id) throw new Error('Forbidden');

  const [account] = await db
    .insert(accounts)
    .values({
      workspaceId,
      name,
      type,
      currency: currency ?? workspace.baseCurrency,
      parentId: parentId ?? null,
      budget: budget != null ? String(budget) : null,
    })
    .returning();

  revalidatePath('/midas');
  return account;
}

export async function updateAccount(
  accountId: string,
  data: {
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
    parentId?: string | null;
    budget?: number | null;
  },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [existing] = await db
    .select({ workspaceId: accounts.workspaceId })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!existing) throw new Error('Account not found');

  const [ws] = await db
    .select({ userId: workspaces.userId })
    .from(workspaces)
    .where(eq(workspaces.id, existing.workspaceId))
    .limit(1);

  if (!ws || ws.userId !== session.user.id) throw new Error('Forbidden');

  const [account] = await db
    .update(accounts)
    .set({
      name: data.name,
      type: data.type,
      parentId: data.parentId ?? null,
      budget: data.budget != null ? String(data.budget) : null,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId))
    .returning();

  revalidatePath('/midas');
  return account;
}

export async function deleteAccount(
  accountId: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [account] = await db
    .select({ workspaceId: accounts.workspaceId })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) return { error: 'Account not found' };

  const [ws] = await db
    .select({ userId: workspaces.userId })
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
  revalidatePath('/midas');
  return { success: true };
}
