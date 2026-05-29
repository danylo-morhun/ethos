'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalIcon, Delete01Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
} from '@ethos/ui';
import { deleteTransaction } from '@/features/midas/actions/transactions';
import type { RecentTransaction } from '@/features/midas/actions/transactions';
import { EditTransactionModal } from '@/features/midas/components/EditTransactionModal';
import { formatCurrency } from '@/features/midas/lib/format';
import { parseLocal } from '@/features/midas/lib/dates';

const thisYear = new Date().getFullYear();

function fmtDate(iso: string): string {
  const d = parseLocal(iso);
  return d.getFullYear() === thisYear ? format(d, 'MMM d') : format(d, 'MMM d, yyyy');
}

interface Props {
  transactions: RecentTransaction[];
  currency: string;
  workspaceId: string;
  page: number;
  hasMore: boolean;
  total: number;
  accountFilterId?: string;
  accountFilterName?: string;
  searchQuery?: string;
}

export function TransactionTable({ transactions, currency, workspaceId, page, hasMore, total, accountFilterId, accountFilterName, searchQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<RecentTransaction | null>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery ?? '');

  function navigate(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 0) params.delete('page');
    else params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  function filterByAccount(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('account', id);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAccountFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('account');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function submitSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set('q', value.trim()); else params.delete('q');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Transaction deleted.');
        router.refresh();
      }
      setPendingId(null);
    });
  }

  const totalPages = Math.ceil(total / 10);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Transactions</h2>
        {accountFilterId && accountFilterName && (
          <span className="flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium">
            {accountFilterName}
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={clearAccountFilter}
            >
              ×
            </button>
          </span>
        )}
        <div className="ml-auto">
          <Input
            placeholder="Search transactions…"
            className="h-8 w-52 text-sm"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(localQuery); }}
            onBlur={() => submitSearch(localQuery)}
          />
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No transactions yet. Add one above.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-muted-foreground">{fmtDate(txn.date)}</TableCell>
                  <TableCell className="font-medium">{txn.description ?? '—'}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className={`text-sm hover:underline ${accountFilterId === txn.fromAccountId ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                      onClick={() => filterByAccount(txn.fromAccountId)}
                    >
                      {txn.fromAccount}
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className={`text-sm hover:underline ${accountFilterId === txn.toAccountId ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                      onClick={() => filterByAccount(txn.toAccountId)}
                    >
                      {txn.toAccount}
                    </button>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {txn.currency && txn.currency !== currency
                      ? `${formatCurrency(Number(txn.amount), txn.currency)} (~${formatCurrency(Number(txn.baseAmount), currency)})`
                      : formatCurrency(Number(txn.baseAmount), currency)}
                  </TableCell>
                  <TableCell>
                    <AlertDialog
                      open={pendingId === txn.id}
                      onOpenChange={(open) => !open && setPendingId(null)}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditTarget(txn)}>
                            <HugeiconsIcon icon={PencilEdit01Icon} className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setPendingId(txn.id)}
                          >
                            <HugeiconsIcon icon={Delete01Icon} className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will recalculate your account balances. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending}
                            onClick={() => handleDelete(txn.id)}
                          >
                            {isPending ? 'Deleting…' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {(page > 0 || hasMore) && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => navigate(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1}{totalPages > 1 ? ` of ${totalPages}` : ''} · {total} transaction{total !== 1 ? 's' : ''}
          </span>
          <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => navigate(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {editTarget && (
        <EditTransactionModal
          transaction={editTarget}
          workspaceId={workspaceId}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        />
      )}
    </section>
  );
}
