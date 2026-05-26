'use server';

import { revalidatePath } from 'next/cache';
import { db, accounts, workspaces, eq } from '@ethos/db';

export async function createAccount(
  workspaceId: string,
  name: string,
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE',
  parentId?: string,
) {
  const [workspace] = await db
    .select({ baseCurrency: workspaces.baseCurrency })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) throw new Error('Workspace not found');

  const [account] = await db
    .insert(accounts)
    .values({
      workspaceId,
      name,
      type,
      currency: workspace.baseCurrency,
      parentId: parentId ?? null,
    })
    .returning();

  revalidatePath('/dashboard');
  return account;
}
