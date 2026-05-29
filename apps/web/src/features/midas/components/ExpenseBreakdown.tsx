"use client";

import type { AccountBalance } from "@/features/midas/actions/balances";
import { formatCurrency } from "@/features/midas/lib/format";
import { Card } from "@ethos/ui";
import Link from "next/link";
import { Cell, Label, Pie, PieChart, Tooltip } from "recharts";

const COLORS = [
	"oklch(0.62 0.22 25)",   // red
	"oklch(0.72 0.17 55)",   // orange
	"oklch(0.62 0.16 285)",  // purple
	"oklch(0.68 0.15 195)",  // teal
	"oklch(0.78 0.15 85)",   // amber
	"oklch(0.65 0.18 330)",  // pink
];

const PIE_SIZE = 108; // explicit px — no ResponsiveContainer stretching

interface TooltipProps { active?: boolean; payload?: any[]; currency: string }

function PieTooltip({ active, payload, currency }: TooltipProps) {
	if (!active || !payload?.length) return null;
	const item = payload[0];
	return (
		<div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
			<div className="flex items-center gap-1.5">
				<span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.payload.fill }} />
				<span className="font-medium">{item.name}</span>
			</div>
			<p className="mt-1 font-bold">{formatCurrency(item.value, currency)}</p>
		</div>
	);
}

interface Props { balances: AccountBalance[]; currency: string }

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
		return <p className="py-8 text-center text-sm text-muted-foreground">No expenses this period</p>;
	}

	return (
		<div className="overflow-x-auto pb-1 md:overflow-visible">
			<div className="flex gap-3 min-w-max md:min-w-0 md:flex-wrap">

				{/* Pie card */}
				<Card className="w-44 h-44 shrink-0 p-3 flex flex-col gap-0">
					<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
						Expenses
					</p>
					<div className="flex flex-1 items-center justify-center">
						{/* Fixed-size PieChart — no ResponsiveContainer, no layout surprises */}
						<PieChart width={PIE_SIZE} height={PIE_SIZE} style={{ outline: "none", border: "none" }}>
							<Tooltip content={(props) => <PieTooltip {...props} currency={currency} />} />
							<Pie
								data={expenses}
								dataKey="value"
								nameKey="name"
								cx={PIE_SIZE / 2}
								cy={PIE_SIZE / 2}
								innerRadius={28}
								outerRadius={46}
								strokeWidth={0}
							>
								{expenses.map((entry) => (
									<Cell key={entry.accountId} fill={entry.fill} />
								))}
								<Label
									content={({ viewBox }) => {
										if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
										return (
											<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
												<tspan x={viewBox.cx} dy={-4} className="fill-foreground text-[10px] font-bold">
													{formatCurrency(total, currency)}
												</tspan>
												<tspan x={viewBox.cx} dy={12} className="fill-muted-foreground text-[8px]">
													total
												</tspan>
											</text>
										);
									}}
								/>
							</Pie>
						</PieChart>
					</div>
				</Card>

				{/* Category cards */}
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
									<div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: exp.fill }} />
								</div>
								<p className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(1)}% of total</p>
							</div>
						</Card>
					);
				})}

			</div>
		</div>
	);
}
