"use client";

import type { AccountBalance } from "@/features/midas/actions/balances";
import { formatCurrency } from "@/features/midas/lib/format";
import {
	Card,
	CardContent,
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ethos/ui";
import Link from "next/link";
import { Cell, Label, Pie, PieChart } from "recharts";

// Distinct, perceptually separated colors that work in both light and dark
const COLORS = [
	"oklch(0.62 0.22 25)",   // red
	"oklch(0.72 0.17 55)",   // orange
	"oklch(0.62 0.16 285)",  // purple
	"oklch(0.68 0.15 195)",  // teal
	"oklch(0.78 0.15 85)",   // amber
	"oklch(0.65 0.18 330)",  // pink
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
			<p className="py-8 text-center text-sm text-muted-foreground">No expenses this period</p>
		);
	}

	const chartConfig: ChartConfig = Object.fromEntries(
		expenses.map((d) => [d.name, { label: d.name, color: d.fill }]),
	);

	return (
		<div className="overflow-x-auto pb-1 md:overflow-visible">
			<div className="flex gap-3 min-w-max md:min-w-0 md:flex-wrap">

				{/* Pie card — square */}
				<Card className="w-44 h-44 shrink-0 flex flex-col">
					<div className="px-4 pt-3">
						<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
							Expenses
						</p>
					</div>
					<div className="flex flex-1 items-center justify-center">
						<ChartContainer config={chartConfig} className="h-[110px] w-[110px]">
							<PieChart>
								<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="name" />} />
								<Pie
									data={expenses}
									dataKey="value"
									nameKey="name"
									innerRadius={32}
									outerRadius={50}
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
													<tspan x={viewBox.cx} dy={-5} className="fill-foreground text-[11px] font-bold">
														{formatCurrency(total, currency)}
													</tspan>
													<tspan x={viewBox.cx} dy={14} className="fill-muted-foreground text-[9px]">
														total
													</tspan>
												</text>
											);
										}}
									/>
								</Pie>
							</PieChart>
						</ChartContainer>
					</div>
				</Card>

				{/* Category cards — square */}
				{expenses.map((exp) => {
					const pct = total > 0 ? (exp.value / total) * 100 : 0;
					return (
						<Card key={exp.accountId} className="w-44 h-44 shrink-0 flex flex-col justify-between p-4">
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
								<Link href={`/midas/accounts/${exp.accountId}`} className="hover:underline underline-offset-2">
									{exp.name}
								</Link>
							</p>

							<p className="text-2xl font-bold leading-none tracking-tight">
								{formatCurrency(exp.value, currency)}
							</p>

							<div className="space-y-1">
								<div className="h-1.5 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full"
										style={{ width: `${pct}%`, backgroundColor: exp.fill }}
									/>
								</div>
								<p className="text-xs text-muted-foreground tabular-nums">
									{pct.toFixed(1)}% of total
								</p>
							</div>
						</Card>
					);
				})}

			</div>
		</div>
	);
}
