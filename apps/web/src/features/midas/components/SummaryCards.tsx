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

  const cards = [
    {
      label: 'Net Worth',
      value: netWorth,
      sub: `${formatCurrency(assets, currency)} assets − ${formatCurrency(liabilities, currency)} liabilities`,
      positive: netWorth >= 0,
    },
    {
      label: periodLabel === 'All time' ? 'All-time P&L' : `${periodLabel} Cashflow`,
      value: cashflow,
      sub: `${formatCurrency(income, currency)} income − ${formatCurrency(expenses, currency)} expenses`,
      positive: cashflow >= 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl lg:text-3xl font-bold tracking-tight ${
                c.positive ? 'text-foreground' : 'text-destructive'
              }`}
            >
              {c.value < 0 ? '−' : ''}{formatCurrency(Math.abs(c.value), currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
