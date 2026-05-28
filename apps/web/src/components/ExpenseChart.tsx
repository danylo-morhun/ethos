'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@ethos/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@ethos/ui';
import type { AccountBalance } from '@/actions/getBalances';
import { formatCurrency } from '@/lib/format';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

interface Props {
  balances: AccountBalance[];
  currency: string;
}

export function ExpenseChart({ balances, currency }: Props) {
  const expenses = balances.filter(
    (b) => b.type === 'EXPENSE' && parseFloat(b.balance) > 0,
  );

  const data = expenses.map((b, i) => ({
    name: b.name,
    value: parseFloat(b.balance),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: d.fill }]),
  );

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Expenses</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No expenses in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={2}
              >
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) - 6}
                          className="fill-foreground text-lg font-bold"
                        >
                          {formatCurrency(total, currency)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 14}
                          className="fill-muted-foreground text-xs"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
