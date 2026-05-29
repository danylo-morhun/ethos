'use server';

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
