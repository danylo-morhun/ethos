'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db, accounts, workspaces, eq } from '@ethos/db';

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

  const [existing] = await db.select({ workspaceId: accounts.workspaceId })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!existing) throw new Error('Account not found');

  const [ws] = await db.select({ userId: workspaces.userId })
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

  revalidatePath('/dashboard');
  return account;
}
