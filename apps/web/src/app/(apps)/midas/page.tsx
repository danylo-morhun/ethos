import { auth } from "@/auth";
import { getAccounts } from "@/features/midas/actions/accounts";
import { getBalances } from "@/features/midas/actions/balances";
import { generateDueRecurring } from "@/features/midas/actions/recurring";
import { getTags } from "@/features/midas/actions/tags";
import { getRecentTransactions } from "@/features/midas/actions/transactions";
import { initializeWorkspace } from "@/features/midas/actions/workspace";
import { AccountsOverview } from "@/features/midas/components/AccountsOverview";
import { ExpenseBreakdown } from "@/features/midas/components/ExpenseBreakdown";
import { type MidasTab, MidasNavTabs } from "@/features/midas/components/MidasNavTabs";
import { OnboardingCard } from "@/features/midas/components/OnboardingCard";
import { TransactionTable } from "@/features/midas/components/TransactionTable";
import { formatCurrency } from "@/features/midas/lib/format";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { redirect } from "next/navigation";

function fmt(d: Date) {
	return format(d, "yyyy-MM-dd");
}

const VALID_TABS: MidasTab[] = ["overview", "accounts", "transactions"];

export default async function MidasPage({
	searchParams,
}: {
	searchParams: Promise<{
		tab?: string;
		from?: string;
		to?: string;
		all?: string;
		page?: string;
		account?: string;
		q?: string;
		sort?: string;
		dir?: string;
		tag?: string;
	}>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/");

	const {
		tab: rawTab,
		from: rawFrom,
		to: rawTo,
		all: rawAll,
		page: rawPage,
		account: rawAccount,
		q: rawQ,
		sort: rawSort,
		dir: rawDir,
		tag: rawTag,
	} = await searchParams;

	const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
	const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	const tab: MidasTab = VALID_TABS.includes(rawTab as MidasTab)
		? (rawTab as MidasTab)
		: "overview";

	const isAllTime = rawAll === "1";
	const rawValidFrom = rawFrom && ISO_DATE.test(rawFrom) ? rawFrom : undefined;
	const rawValidTo = rawTo && ISO_DATE.test(rawTo) ? rawTo : undefined;
	const today = new Date();
	const defaultFrom = fmt(startOfMonth(today));
	const defaultTo = fmt(endOfMonth(today));
	const swapped = rawValidFrom && rawValidTo && rawValidFrom > rawValidTo;
	const from = isAllTime ? undefined : (swapped ? rawValidTo : rawValidFrom) ?? defaultFrom;
	const to = isAllTime ? undefined : (swapped ? rawValidFrom : rawValidTo) ?? defaultTo;

	const pageNum = rawPage && /^\d+$/.test(rawPage) ? Math.max(0, Number.parseInt(rawPage, 10)) : 0;
	const accountId = rawAccount && UUID.test(rawAccount) ? rawAccount : undefined;
	const q = rawQ?.trim() || undefined;
	const sortField = rawSort === "amount" ? "amount" : "date";
	const sortDir = rawDir === "asc" ? "asc" : "desc";
	const tagId = rawTag && UUID.test(rawTag) ? rawTag : undefined;

	const workspace = await initializeWorkspace(session.user.id);
	await generateDueRecurring(workspace.id);

	// ── Overview ────────────────────────────────────────────────────────────────
	if (tab === "overview") {
		const balances = await getBalances(workspace.id, from, to);

		const income = Math.abs(
			balances.filter((b) => b.type === "INCOME").reduce((acc, b) => acc + Number(b.balance), 0),
		);
		const expenses = Math.abs(
			balances.filter((b) => b.type === "EXPENSE").reduce((acc, b) => acc + Number(b.balance), 0),
		);
		const cashflow = income - expenses;
		const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : null;

		return (
			<main className="flex flex-col pb-16 md:pb-0">
				<MidasNavTabs activeTab="overview" />

				{balances.length === 0 ? (
					<div className="px-4 py-6 sm:px-6">
						<OnboardingCard
							workspaceId={workspace.id}
							baseCurrency={workspace.baseCurrency}
							accountCount={0}
						/>
					</div>
				) : (
					<div className="space-y-6 px-4 py-6 sm:px-6">
						<div className="flex items-center gap-6">
							<div>
								<p className="text-xs text-muted-foreground">Cashflow</p>
								<p className={`text-2xl font-bold ${cashflow < 0 ? "text-destructive" : ""}`}>
									{cashflow < 0 ? "−" : ""}
									{formatCurrency(Math.abs(cashflow), workspace.baseCurrency)}
								</p>
							</div>
							<div className="h-8 w-px bg-border" />
							<div>
								<p className="text-xs text-muted-foreground">Savings rate</p>
								<p className={`text-2xl font-bold ${savingsRate !== null && savingsRate < 0 ? "text-destructive" : ""}`}>
									{savingsRate === null
										? "—"
										: `${savingsRate < 0 ? "−" : ""}${Math.abs(savingsRate).toFixed(1)}%`}
								</p>
							</div>
						</div>

						<ExpenseBreakdown balances={balances} currency={workspace.baseCurrency} />
					</div>
				)}
			</main>
		);
	}

	// ── Accounts ────────────────────────────────────────────────────────────────
	if (tab === "accounts") {
		const [balances, accounts] = await Promise.all([
			getBalances(workspace.id, undefined, undefined),
			getAccounts(workspace.id),
		]);

		const assets = balances
			.filter((b) => b.type === "ASSET")
			.reduce((acc, b) => acc + Number(b.balance), 0);
		const liabilities = Math.abs(
			balances.filter((b) => b.type === "LIABILITY").reduce((acc, b) => acc + Number(b.balance), 0),
		);
		const netWorth = assets - liabilities;

		return (
			<main className="flex flex-col pb-16 md:pb-0">
				<MidasNavTabs activeTab="accounts" />
				<div className="px-4 py-6 sm:px-6">
					<div className="mb-6">
						<p className="text-xs text-muted-foreground">Net Worth</p>
						<p className={`text-3xl font-bold ${netWorth < 0 ? "text-destructive" : ""}`}>
							{netWorth < 0 ? "−" : ""}
							{formatCurrency(Math.abs(netWorth), workspace.baseCurrency)}
						</p>
					</div>
					<AccountsOverview
						balances={balances}
						accounts={accounts}
						currency={workspace.baseCurrency}
						workspaceId={workspace.id}
						periodLabel="All time"
					/>
				</div>
			</main>
		);
	}

	// ── Transactions ─────────────────────────────────────────────────────────────
	const [recentTransactions, accounts, allTags] = await Promise.all([
		getRecentTransactions(workspace.id, from, to, pageNum, accountId, q, sortField, sortDir, tagId),
		getAccounts(workspace.id),
		getTags(workspace.id),
	]);

	return (
		<main className="flex flex-col pb-16 md:pb-0">
			<MidasNavTabs activeTab="transactions" />
			<div className="px-4 py-6 sm:px-6">
				<TransactionTable
					transactions={recentTransactions.rows}
					currency={workspace.baseCurrency}
					workspaceId={workspace.id}
					page={pageNum}
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
