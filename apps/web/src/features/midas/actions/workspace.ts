'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db, workspaces, accounts, eq } from '@ethos/db';

export async function getWorkspace(userId: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .limit(1);
  return workspace ?? null;
}

export async function initializeWorkspace(userId: string) {
  const [inserted] = await db
    .insert(workspaces)
    .values({ userId, name: 'My Workspace', baseCurrency: 'PLN' })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    await db.insert(accounts).values([
      { workspaceId: inserted.id, name: 'Wallet', type: 'ASSET', currency: 'PLN' },
      { workspaceId: inserted.id, name: 'Salary', type: 'INCOME', currency: 'PLN' },
      { workspaceId: inserted.id, name: 'Groceries', type: 'EXPENSE', currency: 'PLN' },
    ]);
    return inserted;
  }

  const [existing] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .limit(1);
  return existing;
}

export async function updateWorkspace(
  workspaceId: string,
  data: { name: string },
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!ws || ws.userId !== session.user.id) return { error: 'Forbidden' };

  const name = data.name.trim();
  if (!name) return { error: 'Name is required' };

  await db
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));

  revalidatePath('/midas');
  revalidatePath('/midas/settings');
  return { success: true };
}
