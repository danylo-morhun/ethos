import { redirect } from 'next/navigation';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { auth } from '@/auth';
import { initializeWorkspace } from '@/features/midas/actions/workspace';
import { getBalances } from '@/features/midas/actions/balances';
import { getAccounts } from '@/features/midas/actions/accounts';
import { getRecentTransactions } from '@/features/midas/actions/transactions';
import { AddTransactionModal } from '@/features/midas/components/AddTransactionModal';
import { AccountsOverview } from '@/features/midas/components/AccountsOverview';
import { ExpenseChart } from '@/features/midas/components/ExpenseChart';
import { SummaryCards } from '@/features/midas/components/SummaryCards';
import { TrendChart } from '@/features/midas/components/TrendChart';
import { TransactionTable } from '@/features/midas/components/TransactionTable';
import { DateRangePicker } from '@/features/midas/components/DateRangePicker';
import { parseLocal } from '@/features/midas/lib/dates';
import { getMonthlyTrends } from '@/features/midas/actions/trends';

function buildPeriodLabel(from: string | undefined, to: string | undefined): string {
  if (!from && !to) return 'All time';
  if (!from || !to) return 'Custom range';
  const f = parseLocal(from);
  const t = parseLocal(to);
  const isMonthStart = isSameDay(f, startOfMonth(f));
  const isMonthEnd = isSameDay(t, endOfMonth(t));
  const singleMonth = f.getFullYear() === t.getFullYear() && f.getMonth() === t.getMonth();

  if (isMonthStart && isMonthEnd && singleMonth) return format(f, 'MMMM yyyy');
  if (isMonthStart && isMonthEnd) {
    return f.getFullYear() === t.getFullYear()
      ? `${format(f, 'MMM')} – ${format(t, 'MMM yyyy')}`
      : `${format(f, 'MMM yyyy')} – ${format(t, 'MMM yyyy')}`;
  }
  return `${format(f, 'MMM d')} – ${format(t, 'MMM d, yyyy')}`;
}

export default async function MidasPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string; account?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const { from: rawFrom, to: rawTo, page: rawPage, account: rawAccount } = await searchParams;
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const rawValidFrom = rawFrom && ISO_DATE.test(rawFrom) ? rawFrom : undefined;
  const rawValidTo   = rawTo   && ISO_DATE.test(rawTo)   ? rawTo   : undefined;
  const from      = rawValidFrom && rawValidTo && rawValidFrom > rawValidTo ? rawValidTo   : rawValidFrom;
  const to        = rawValidFrom && rawValidTo && rawValidFrom > rawValidTo ? rawValidFrom : rawValidTo;
  const page      = rawPage    && /^\d+$/.test(rawPage)     ? Math.max(0, parseInt(rawPage, 10)) : 0;
  const accountId = rawAccount && UUID.test(rawAccount)     ? rawAccount : undefined;

  const workspace = await initializeWorkspace(session.user.id);
  const periodLabel = buildPeriodLabel(from, to);

  const [balances, accounts, recentTransactions, trends] = await Promise.all([
    getBalances(workspace.id, from, to),
    getAccounts(workspace.id),
    getRecentTransactions(workspace.id, from, to, page, accountId),
    getMonthlyTrends(workspace.id, from, to),
  ]);

  return (
    <main className="px-4 py-6 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker from={from} to={to} />
          <AddTransactionModal workspaceId={workspace.id} baseCurrency={workspace.baseCurrency} />
        </div>
      </div>

      <div className="space-y-8">
        <SummaryCards balances={balances} currency={workspace.baseCurrency} periodLabel={periodLabel} />
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
            <TrendChart data={trends} currency={workspace.baseCurrency} />
          </div>
        </div>
        <TransactionTable
          transactions={recentTransactions.rows}
          currency={workspace.baseCurrency}
          workspaceId={workspace.id}
          page={page}
          hasMore={recentTransactions.hasMore}
          accountFilterId={accountId}
          accountFilterName={accountId ? accounts.find((a) => a.id === accountId)?.name : undefined}
        />
      </div>
    </main>
  );
}
