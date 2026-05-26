'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ethos/ui';
import type { AccountBalance } from '@/actions/getBalances';
import { deleteAccount } from '@/actions/deleteAccount';
import { AddAccountModal } from '@/components/AddAccountModal';
import { EditAccountModal } from '@/components/EditAccountModal';
import { getAccounts } from '@/actions/getAccounts';

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Assets',
  LIABILITY: 'Liabilities',
  INCOME: 'Income',
  EXPENSE: 'Expenses',
};

const TYPE_ORDER = ['ASSET', 'INCOME', 'EXPENSE', 'LIABILITY'];

function fmt(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(Number(amount)));
}

type Account = Awaited<ReturnType<typeof getAccounts>>[number];

interface AccountRow extends AccountBalance {
  parentId: string | null;
}

interface Props {
  balances: AccountBalance[];
  currency: string;
  workspaceId: string;
  accounts: Account[];
}

function sortWithChildren(rows: AccountRow[]): AccountRow[] {
  const byId = new Map(rows.map((r) => [r.accountId, r]));
  const result: AccountRow[] = [];
  const visited = new Set<string>();

  function visit(row: AccountRow) {
    if (visited.has(row.accountId)) return;
    visited.add(row.accountId);
    result.push(row);
    rows
      .filter((r) => r.parentId === row.accountId)
      .forEach(visit);
  }

  rows
    .filter((r) => !r.parentId || !byId.has(r.parentId))
    .forEach(visit);

  // catch any orphans
  rows.forEach((r) => visit(r));

  return result;
}

export function AccountsOverview({ balances, currency, workspaceId, accounts }: Props) {
  const router = useRouter();
  const [editTarget, setEditTarget] = React.useState<Account | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Merge parentId from accounts list into balance rows
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const rows: AccountRow[] = balances.map((b) => ({
    ...b,
    parentId: accountMap.get(b.accountId)?.parentId ?? null,
  }));

  const grouped = TYPE_ORDER.reduce<Record<string, AccountRow[]>>((acc, type) => {
    acc[type] = rows.filter((b) => b.type === type);
    return acc;
  }, {});

  const handleDelete = async (accountId: string, name: string) => {
    setDeletingId(accountId);
    try {
      const result = await deleteAccount(accountId);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success(`"${name}" deleted`);
        router.refresh();
      }
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Accounts</h2>
        <AddAccountModal workspaceId={workspaceId} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TYPE_ORDER.map((type) => {
          const group = grouped[type] ?? [];
          const sorted = sortWithChildren(group);
          const sum = group.reduce((acc, b) => acc + Number(b.balance), 0);
          const displaySum = fmt(String(Math.abs(sum)), currency);

          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {TYPE_LABELS[type]}
                </CardTitle>
                <p className="text-2xl font-bold">{displaySum}</p>
              </CardHeader>
              <CardContent>
                {sorted.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No accounts</p>
                ) : (
                  <ul className="space-y-1">
                    {sorted.map((b) => {
                      const isChild = !!b.parentId;
                      return (
                        <li
                          key={b.accountId}
                          className={`flex items-center justify-between text-sm ${isChild ? 'ml-4' : ''}`}
                        >
                          <span className="flex items-center gap-1 text-muted-foreground min-w-0">
                            {isChild && (
                              <span className="shrink-0 text-muted-foreground/50">↳</span>
                            )}
                            <span className="truncate">{b.name}</span>
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={
                                Number(b.balance) < 0
                                  ? 'font-medium text-red-500'
                                  : 'font-medium text-foreground'
                              }
                            >
                              {fmt(b.balance, currency)}
                            </span>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground/60 hover:text-foreground"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    const acct = accountMap.get(b.accountId);
                                    if (acct) setEditTarget(acct);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-500 focus:text-red-500"
                                  disabled={deletingId === b.accountId}
                                  onClick={() => handleDelete(b.accountId, b.name)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {deletingId === b.accountId ? 'Deleting…' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editTarget && (
        <EditAccountModal
          account={editTarget}
          workspaceId={workspaceId}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        />
      )}
    </section>
  );
}
