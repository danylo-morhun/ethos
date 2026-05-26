'use server';

import { db, workspaces, accounts, eq } from '@ethos/db';

export async function initializeWorkspace(userId: string) {
  const existing = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [workspace] = await db
    .insert(workspaces)
    .values({ userId, name: 'My Workspace', baseCurrency: 'PLN' })
    .returning();

  await db.insert(accounts).values([
    { workspaceId: workspace.id, name: 'Wallet', type: 'ASSET', currency: 'PLN' },
    { workspaceId: workspace.id, name: 'Salary', type: 'INCOME', currency: 'PLN' },
    { workspaceId: workspace.id, name: 'Groceries', type: 'EXPENSE', currency: 'PLN' },
  ]);

  return workspace;
}
