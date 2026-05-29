"use client";

import type { AccountBalance } from "@/features/midas/actions/balances";
import { formatCurrency } from "@/features/midas/lib/format";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ethos/ui";
import Link from "next/link";
import { Cell, Label, Pie, PieChart } from "recharts";

const COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

interface Props {
	balances: AccountBalance[];
	currency: string;
}

export function ExpenseBreakdown({ balances, currency }: Props) {
	const expenses = balances
		.filter((b) => b.type === "EXPENSE")
		.map((b, i) => ({
			accountId: b.accountId,
			name: b.name,
			value: Math.abs(Number(b.balance)),
			fill: COLORS[i % COLORS.length],
		}))
		.filter((b) => b.value > 0)
		.sort((a, b) => b.value - a.value);

	const total = expenses.reduce((sum, d) => sum + d.value, 0);

	if (expenses.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">No expenses in this period</p>
		);
	}

	const chartConfig: ChartConfig = Object.fromEntries(
		expenses.map((d) => [d.name, { label: d.name, color: d.fill }]),
	);

	return (
		/* outer: scroll on mobile, wrap on desktop */
		<div className="overflow-x-auto pb-1 md:overflow-visible">
			<div className="flex gap-3 min-w-max md:min-w-0 md:flex-wrap">

				{/* Pie card */}
				<Card className="w-44 shrink-0 flex flex-col">
					<CardHeader className="pb-1 pt-4 px-4">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Expenses
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-1 items-center justify-center px-4 pb-4">
						<ChartContainer config={chartConfig} className="h-[120px] w-[120px]">
							<PieChart>
								<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="name" />} />
								<Pie
									data={expenses}
									dataKey="value"
									nameKey="name"
									innerRadius={36}
									outerRadius={54}
									strokeWidth={2}
								>
									{expenses.map((entry) => (
										<Cell key={entry.accountId} fill={entry.fill} />
									))}
									<Label
										content={({ viewBox }) => {
											if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
											return (
												<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
													<tspan x={viewBox.cx} dy={-6} className="fill-foreground text-sm font-bold">
														{formatCurrency(total, currency)}
													</tspan>
													<tspan x={viewBox.cx} dy={16} className="fill-muted-foreground text-[10px]">
														total
													</tspan>
												</text>
											);
										}}
									/>
								</Pie>
							</PieChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Category cards */}
				{expenses.map((exp) => {
					const pct = total > 0 ? (exp.value / total) * 100 : 0;
					return (
						<Card key={exp.accountId} className="w-44 shrink-0 flex flex-col justify-between">
							<CardHeader className="pb-1 pt-4 px-4">
								<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
									<Link href={`/midas/accounts/${exp.accountId}`} className="hover:underline underline-offset-2">
										{exp.name}
									</Link>
								</CardTitle>
							</CardHeader>
							<CardContent className="px-4 pb-4 space-y-2">
								<div className="flex items-baseline justify-between gap-1">
									<span className="text-base font-bold leading-none">
										{formatCurrency(exp.value, currency)}
									</span>
									<span className="text-xs text-muted-foreground tabular-nums">
										{pct.toFixed(1)}%
									</span>
								</div>
								<div className="h-1.5 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full transition-all"
										style={{ width: `${pct}%`, backgroundColor: exp.fill }}
									/>
								</div>
							</CardContent>
						</Card>
					);
				})}

			</div>
		</div>
	);
}
