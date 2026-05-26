import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ethos/ui';
import type { RecentTransaction } from '@/actions/getRecentTransactions';

function fmt(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

interface Props {
  transactions: RecentTransaction[];
  currency: string;
}

export function TransactionTable({ transactions, currency }: Props) {
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
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
                      ? `${fmt(txn.amount, txn.currency)} (~${fmt(txn.baseAmount, currency)})`
                      : fmt(txn.baseAmount, currency)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
