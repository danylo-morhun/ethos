import { redirect } from 'next/navigation';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { auth } from '@/auth';
import { initializeWorkspace } from '@/actions/initializeWorkspace';
import { getBalances } from '@/actions/getBalances';
import { getAccounts } from '@/actions/getAccounts';
import { getRecentTransactions } from '@/actions/getRecentTransactions';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { AccountsOverview } from '@/components/AccountsOverview';
import { TransactionTable } from '@/components/TransactionTable';
import { MonthPicker } from '@/components/MonthPicker';

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function buildPeriodLabel(from: string, to: string): string {
  const f = parseLocalDate(from);
  const t = parseLocalDate(to);
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const { from: rawFrom, to: rawTo } = await searchParams;
  const { from, to } = rawFrom && rawTo ? { from: rawFrom, to: rawTo } : defaultRange();

  const workspace = await initializeWorkspace(session.user.id);
  const periodLabel = buildPeriodLabel(from, to);

  const [balances, accounts, recentTransactions] = await Promise.all([
    getBalances(workspace.id, from, to),
    getAccounts(workspace.id),
    getRecentTransactions(workspace.id, from, to),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <MonthPicker from={from} to={to} />
            <AddTransactionModal workspaceId={workspace.id} baseCurrency={workspace.baseCurrency} />
          </div>
        </div>

        <div className="space-y-8">
          <AccountsOverview
            balances={balances}
            accounts={accounts}
            currency={workspace.baseCurrency}
            workspaceId={workspace.id}
            periodLabel={periodLabel}
          />
          <TransactionTable transactions={recentTransactions} currency={workspace.baseCurrency} />
        </div>
      </div>
    </main>
  );
}
