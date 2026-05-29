'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalIcon, Delete01Icon } from '@hugeicons/core-free-icons';
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
} from '@ethos/ui';
import { deleteTransaction } from '@/features/midas/actions/transactions';
import type { RecentTransaction } from '@/features/midas/actions/transactions';
import { formatCurrency } from '@/features/midas/lib/format';

interface Props {
  transactions: RecentTransaction[];
  currency: string;
  page: number;
  hasMore: boolean;
}

export function TransactionTable({ transactions, currency, page, hasMore }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function navigate(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 0) {
      params.delete('page');
    } else {
      params.set('page', String(newPage));
    }
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

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Recent Transactions</h2>
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
                  <TableCell className="text-muted-foreground">{txn.date}</TableCell>
                  <TableCell className="font-medium">{txn.description ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{txn.fromAccount}</TableCell>
                  <TableCell className="text-muted-foreground">{txn.toAccount}</TableCell>
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
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => navigate(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => navigate(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
