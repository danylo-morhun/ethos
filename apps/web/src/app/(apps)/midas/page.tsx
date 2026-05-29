import { auth } from "@/auth";
import { getAccounts } from "@/features/midas/actions/accounts";
import { getBalances } from "@/features/midas/actions/balances";
import { getNetWorthHistory } from "@/features/midas/actions/net-worth";
import { generateDueRecurring } from "@/features/midas/actions/recurring";
import { getTags } from "@/features/midas/actions/tags";
import { getRecentTransactions } from "@/features/midas/actions/transactions";
import { getMonthlyTrends } from "@/features/midas/actions/trends";
import { initializeWorkspace } from "@/features/midas/actions/workspace";
import { AccountsOverview } from "@/features/midas/components/AccountsOverview";
import { AddTransactionModal } from "@/features/midas/components/AddTransactionModal";
import { DateRangePicker } from "@/features/midas/components/DateRangePicker";
import { ExpenseChart } from "@/features/midas/components/ExpenseChart";
import { IncomeChart } from "@/features/midas/components/IncomeChart";
import { NetWorthChart } from "@/features/midas/components/NetWorthChart";
import { OnboardingCard } from "@/features/midas/components/OnboardingCard";
import { SummaryCards } from "@/features/midas/components/SummaryCards";
import { TransactionTable } from "@/features/midas/components/TransactionTable";
import { TrendChart } from "@/features/midas/components/TrendChart";
import { parseLocal } from "@/features/midas/lib/dates";
import { differenceInDays, endOfMonth, format, isSameDay, startOfMonth, subDays } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

function getPrevPeriod(from: string, to: string): { prevFrom: string; prevTo: string } {
	const fromDate = parseLocal(from);
	const toDate = parseLocal(to);
	const days = differenceInDays(toDate, fromDate) + 1;
	return {
		prevFrom: format(subDays(fromDate, days), "yyyy-MM-dd"),
		prevTo: format(subDays(fromDate, 1), "yyyy-MM-dd"),
	};
}

function computeMetrics(b: import("@/features/midas/actions/balances").AccountBalance[]) {
	const sum = (type: string) =>
		b.filter((x) => x.type === type).reduce((acc, x) => acc + Number(x.balance), 0);
	return {
		cashflow: sum("INCOME") - Math.abs(sum("EXPENSE")),
		netWorth: sum("ASSET") - Math.abs(sum("LIABILITY")),
	};
}

function buildPeriodLabel(from: string | undefined, to: string | undefined): string {
	if (!from && !to) return "All time";
	if (!from || !to) return "Custom range";
	const f = parseLocal(from);
	const t = parseLocal(to);
	const isMonthStart = isSameDay(f, startOfMonth(f));
	const isMonthEnd = isSameDay(t, endOfMonth(t));
	const singleMonth = f.getFullYear() === t.getFullYear() && f.getMonth() === t.getMonth();

	if (isMonthStart && isMonthEnd && singleMonth) return format(f, "MMMM yyyy");
	if (isMonthStart && isMonthEnd) {
		return f.getFullYear() === t.getFullYear()
			? `${format(f, "MMM")} – ${format(t, "MMM yyyy")}`
			: `${format(f, "MMM yyyy")} – ${format(t, "MMM yyyy")}`;
	}
	return `${format(f, "MMM d")} – ${format(t, "MMM d, yyyy")}`;
}

export default async function MidasPage({
	searchParams,
}: {
	searchParams: Promise<{
		from?: string;
		to?: string;
		page?: string;
		account?: string;
		q?: string;
		trend?: string;
		sort?: string;
		dir?: string;
		tag?: string;
	}>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/");

	const {
		from: rawFrom,
		to: rawTo,
		page: rawPage,
		account: rawAccount,
		q: rawQ,
		trend: rawTrend,
		sort: rawSort,
		dir: rawDir,
		tag: rawTag,
	} = await searchParams;
	const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
	const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const rawValidFrom = rawFrom && ISO_DATE.test(rawFrom) ? rawFrom : undefined;
	const rawValidTo = rawTo && ISO_DATE.test(rawTo) ? rawTo : undefined;
	const from = rawValidFrom && rawValidTo && rawValidFrom > rawValidTo ? rawValidTo : rawValidFrom;
	const to = rawValidFrom && rawValidTo && rawValidFrom > rawValidTo ? rawValidFrom : rawValidTo;
	const page = rawPage && /^\d+$/.test(rawPage) ? Math.max(0, Number.parseInt(rawPage, 10)) : 0;
	const accountId = rawAccount && UUID.test(rawAccount) ? rawAccount : undefined;
	const q = rawQ && rawQ.trim().length > 0 ? rawQ.trim() : undefined;
	const trend = rawTrend === "3m" || rawTrend === "1y" ? rawTrend : "6m";
	const trendMonths = trend === "3m" ? 3 : trend === "1y" ? 12 : 6;
	const sortField = rawSort === "amount" ? "amount" : "date";
	const sortDir = rawDir === "asc" ? "asc" : "desc";
	const tagId = rawTag && UUID.test(rawTag) ? rawTag : undefined;

	const workspace = await initializeWorkspace(session.user.id);
	await generateDueRecurring(workspace.id);
	const periodLabel = buildPeriodLabel(from, to);
	const prevPeriod = from && to ? getPrevPeriod(from, to) : null;

	const [balances, accounts, recentTransactions, trends, netWorthHistory, allTags, prevBalances] =
		await Promise.all([
			getBalances(workspace.id, from, to),
			getAccounts(workspace.id),
			getRecentTransactions(workspace.id, from, to, page, accountId, q, sortField, sortDir, tagId),
			getMonthlyTrends(workspace.id, from, to, trendMonths),
			getNetWorthHistory(workspace.id),
			getTags(workspace.id),
			prevPeriod
				? getBalances(workspace.id, prevPeriod.prevFrom, prevPeriod.prevTo)
				: Promise.resolve(null),
		]);

	const curr = computeMetrics(balances);
	const prev = prevBalances ? computeMetrics(prevBalances) : null;
	const deltas = prev
		? {
				cashflow:
					prev.cashflow !== 0
						? ((curr.cashflow - prev.cashflow) / Math.abs(prev.cashflow)) * 100
						: undefined,
				netWorth:
					prev.netWorth !== 0
						? ((curr.netWorth - prev.netWorth) / Math.abs(prev.netWorth)) * 100
						: undefined,
			}
		: undefined;

	return (
		<main className="px-4 py-6 sm:px-6">
			<div className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-bold">{workspace.name}</h1>
					<Link
						href="/midas/settings"
						className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
					>
						Settings
					</Link>
				</div>
				<div className="flex items-center gap-3">
					<DateRangePicker from={from} to={to} />
					<AddTransactionModal workspaceId={workspace.id} baseCurrency={workspace.baseCurrency} />
				</div>
			</div>

			<div className="space-y-8">
				{accounts.length === 0 ? (
					<OnboardingCard
						workspaceId={workspace.id}
						baseCurrency={workspace.baseCurrency}
						accountCount={accounts.length}
					/>
				) : (
					<>
						<SummaryCards
							balances={balances}
							currency={workspace.baseCurrency}
							periodLabel={periodLabel}
							deltas={deltas}
						/>
						<AccountsOverview
							balances={balances}
							accounts={accounts}
							currency={workspace.baseCurrency}
							workspaceId={workspace.id}
							periodLabel={periodLabel}
						/>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							<ExpenseChart balances={balances} currency={workspace.baseCurrency} />
							<div className="lg:col-span-2">
								<TrendChart
									data={trends}
									currency={workspace.baseCurrency}
									trendParam={trend}
									hasDateFilter={!!(from || to)}
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							<IncomeChart balances={balances} currency={workspace.baseCurrency} />
							<div className="lg:col-span-2">
								<NetWorthChart data={netWorthHistory} currency={workspace.baseCurrency} />
							</div>
						</div>
					</>
				)}
				<TransactionTable
					transactions={recentTransactions.rows}
					currency={workspace.baseCurrency}
					workspaceId={workspace.id}
					page={page}
					hasMore={recentTransactions.hasMore}
					total={recentTransactions.total}
					accountFilterId={accountId}
					accountFilterName={accountId ? accounts.find((a) => a.id === accountId)?.name : undefined}
					tagFilterId={tagId}
					tagFilterName={tagId ? allTags.find((t) => t.id === tagId)?.name : undefined}
					searchQuery={q}
					dateFrom={from}
					dateTo={to}
					sortField={sortField}
					sortDir={sortDir}
				/>
			</div>
		</main>
	);
}
