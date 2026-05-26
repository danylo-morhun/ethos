'use server';

import { db, accounts, eq } from '@ethos/db';

export async function getAccounts(workspaceId: string) {
  return db.select().from(accounts).where(eq(accounts.workspaceId, workspaceId));
}
