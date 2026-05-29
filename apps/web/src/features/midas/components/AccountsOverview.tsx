'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalIcon, PencilEdit01Icon, Delete01Icon } from '@hugeicons/core-free-icons';
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
  Progress,
} from '@ethos/ui';
import type { AccountBalance } from '@/features/midas/actions/balances';
import { formatCurrency } from '@/features/midas/lib/format';
import { deleteAccount } from '@/features/midas/actions/accounts';
import { AddAccountModal } from '@/features/midas/components/AddAccountModal';
import { EditAccountModal } from '@/features/midas/components/EditAccountModal';
import { getAccounts } from '@/features/midas/actions/accounts';

function typeLabels(periodLabel: string): Record<string, string> {
  return {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    INCOME: `${periodLabel} Income`,
    EXPENSE: `${periodLabel} Expenses`,
  };
}

const TYPE_ORDER = ['ASSET', 'INCOME', 'EXPENSE', 'LIABILITY'];

type Account = Awaited<ReturnType<typeof getAccounts>>[number];

interface AccountRow extends AccountBalance {
  parentId: string | null;
}

interface Props {
  balances: AccountBalance[];
  currency: string;
  workspaceId: string;
  accounts: Account[];
  periodLabel: string;
}

function sortWithChildren(rows: AccountRow[]): AccountRow[] {
  const byId = new Map(rows.map((r) => [r.accountId, r]));
  const result: AccountRow[] = [];
  const visited = new Set<string>();

  function visit(row: AccountRow) {
    if (visited.has(row.accountId)) return;
    visited.add(row.accountId);
    result.push(row);
    rows.filter((r) => r.parentId === row.accountId).forEach(visit);
  }

  rows.filter((r) => !r.parentId || !byId.has(r.parentId)).forEach(visit);
  rows.forEach((r) => visit(r));

  return result;
}

export function AccountsOverview({ balances, currency, workspaceId, accounts, periodLabel }: Props) {
  const TYPE_LABELS = typeLabels(periodLabel);
  const router = useRouter();
  const [editTarget, setEditTarget] = React.useState<Account | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

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
          const displaySum = formatCurrency(Math.abs(sum), currency);

          return (
            <Card key={type} className="overflow-hidden h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {TYPE_LABELS[type]}
                </CardTitle>
                <p className="text-2xl lg:text-3xl font-bold tracking-tight break-words">{displaySum}</p>
              </CardHeader>
              <CardContent>
                {sorted.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No accounts</p>
                ) : (
                  <div className="mt-1 flex flex-col gap-3">
                    {sorted.map((b) => {
                      const isChild = !!b.parentId;
                      const acct = accountMap.get(b.accountId);
                      const budget = acct?.budget != null ? Number(acct.budget) : null;
                      const balance = Number(b.balance);
                      const showBudget = b.type === 'EXPENSE' && budget != null && budget > 0;
                      const pct = showBudget ? Math.min((balance / budget) * 100, 100) : null;
                      const overBudget = showBudget && balance > budget;

                      return (
                        <div
                          key={b.accountId}
                          className={`flex flex-col gap-1 w-full ${isChild ? 'pl-4' : ''}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex min-w-0 items-center gap-1">
                              {isChild && (
                                <span className="shrink-0 text-muted-foreground/50">↳</span>
                              )}
                              <span className="text-sm font-medium pr-2 truncate">{b.name}</span>
                            </span>

                            <div className="flex shrink-0 items-center gap-1">
                              <span
                                className={`text-sm whitespace-nowrap ${
                                  Number(b.balance) < 0 ? 'text-red-500' : 'text-muted-foreground'
                                }`}
                              >
                                {formatCurrency(Math.abs(Number(b.balance)), currency)}
                              </span>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground/60 hover:text-foreground"
                                  >
                                    <HugeiconsIcon icon={MoreHorizontalIcon} className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (acct) setEditTarget(acct);
                                    }}
                                  >
                                    <HugeiconsIcon icon={PencilEdit01Icon} className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500"
                                    disabled={deletingId === b.accountId}
                                    onClick={() => handleDelete(b.accountId, b.name)}
                                  >
                                    <HugeiconsIcon icon={Delete01Icon} className="mr-2 h-4 w-4" />
                                    {deletingId === b.accountId ? 'Deleting…' : 'Delete'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {showBudget && pct !== null && (
                            <div className="flex flex-col gap-1.5 mt-2">
                              <Progress
                                value={pct}
                                className="h-1.5"
                                indicatorClassName={overBudget ? 'bg-destructive' : undefined}
                              />
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(Math.abs(balance), currency)} / {formatCurrency(budget, currency)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
        />
      )}
    </section>
  );
}
