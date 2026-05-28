'use server';

import { revalidatePath } from 'next/cache';
import { db, accounts, eq } from '@ethos/db';

export async function updateAccount(
  accountId: string,
  data: {
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
    parentId?: string | null;
    budget?: number | null;
  },
) {
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
