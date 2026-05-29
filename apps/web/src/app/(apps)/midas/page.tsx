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
import { buildPeriodLabel, parseLocal } from "@/features/midas/lib/dates";
import { differenceInDays, endOfMonth, format, startOfMonth, subDays } from "date-fns";
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

export default async function MidasPage({
	searchParams,
}: {
	searchParams: Promise<{
		from?: string;
		to?: string;
		all?: string;
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
		all: rawAll,
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
	const isAllTime = rawAll === "1";
	const rawValidFrom = rawFrom && ISO_DATE.test(rawFrom) ? rawFrom : undefined;
	const rawValidTo = rawTo && ISO_DATE.test(rawTo) ? rawTo : undefined;
	const today = new Date();
	const defaultFrom = format(startOfMonth(today), "yyyy-MM-dd");
	const defaultTo = format(endOfMonth(today), "yyyy-MM-dd");
	const swapped = rawValidFrom && rawValidTo && rawValidFrom > rawValidTo;
	const from = isAllTime ? undefined : (swapped ? rawValidTo : rawValidFrom) ?? defaultFrom;
	const to = isAllTime ? undefined : (swapped ? rawValidFrom : rawValidTo) ?? defaultTo;
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
	const periodLabel = buildPeriodLabel(from, to, isAllTime);
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
			<div className="mb-8 flex items-center justify-end gap-3">
				<DateRangePicker from={from} to={to} isAllTime={isAllTime} />
				<AddTransactionModal workspaceId={workspace.id} baseCurrency={workspace.baseCurrency} />
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
