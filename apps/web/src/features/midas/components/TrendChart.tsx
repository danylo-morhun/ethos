'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@ethos/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@ethos/ui';
import type { MonthlyTrend } from '@/features/midas/actions/trends';

const chartConfig: ChartConfig = {
  income:   { label: 'Income',   color: 'var(--chart-2)' },
  expenses: { label: 'Expenses', color: 'var(--chart-1)' },
};

interface Props {
  data: MonthlyTrend[];
  currency: string;
}

export function TrendChart({ data, currency }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.month.slice(0, 7),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {formatted.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No data in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={formatted} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat('en', { notation: 'compact', currency, style: 'currency' }).format(v)
                }
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income"   fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
