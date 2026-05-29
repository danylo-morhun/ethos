'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db, accounts, workspaces, eq } from '@ethos/db';

export async function createAccount(
  workspaceId: string,
  name: string,
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE',
  parentId?: string,
  budget?: number,
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
      currency: workspace.baseCurrency,
      parentId: parentId ?? null,
      budget: budget != null ? String(budget) : null,
    })
    .returning();

  revalidatePath('/dashboard');
  return account;
}
