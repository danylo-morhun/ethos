'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@ethos/ui';
import type { AccountBalance } from '@/features/midas/actions/balances';
import { formatCurrency } from '@/features/midas/lib/format';

interface Props {
  balances: AccountBalance[];
  currency: string;
  periodLabel: string;
}

export function SummaryCards({ balances, currency, periodLabel }: Props) {
  const sum = (type: string) =>
    balances.filter((b) => b.type === type).reduce((acc, b) => acc + Number(b.balance), 0);

  const assets = sum('ASSET');
  const liabilities = Math.abs(sum('LIABILITY'));
  const income = sum('INCOME');
  const expenses = Math.abs(sum('EXPENSE'));

  const netWorth = assets - liabilities;
  const cashflow = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl lg:text-3xl font-bold tracking-tight ${netWorth >= 0 ? 'text-foreground' : 'text-destructive'}`}>
            {netWorth < 0 ? '−' : ''}{formatCurrency(Math.abs(netWorth), currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(assets, currency)} assets − {formatCurrency(liabilities, currency)} liabilities
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {periodLabel === 'All time' ? 'All-time P&L' : `${periodLabel} Cashflow`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl lg:text-3xl font-bold tracking-tight ${cashflow >= 0 ? 'text-foreground' : 'text-destructive'}`}>
            {cashflow < 0 ? '−' : ''}{formatCurrency(Math.abs(cashflow), currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(income, currency)} income − {formatCurrency(expenses, currency)} expenses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {savingsRate === null ? (
            <p className="text-2xl lg:text-3xl font-bold tracking-tight text-muted-foreground">—</p>
          ) : (
            <p className={`text-2xl lg:text-3xl font-bold tracking-tight ${savingsRate >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {savingsRate < 0 ? '−' : ''}{Math.abs(savingsRate).toFixed(1)}%
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {savingsRate === null ? 'No income recorded' : `of income saved this period`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
