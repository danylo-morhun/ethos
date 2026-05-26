import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { initializeWorkspace } from '@/actions/initializeWorkspace';
import { getBalances } from '@/actions/getBalances';
import { getRecentTransactions } from '@/actions/getRecentTransactions';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { AccountsOverview } from '@/components/AccountsOverview';
import { TransactionTable } from '@/components/TransactionTable';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) redirect('/');

  const workspace = await initializeWorkspace(session.user.id);

  const [balances, recentTransactions] = await Promise.all([
    getBalances(workspace.id),
    getRecentTransactions(workspace.id),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
          <AddTransactionModal workspaceId={workspace.id} />
        </div>

        <div className="space-y-8">
          <AccountsOverview balances={balances} currency={workspace.baseCurrency} />
          <TransactionTable transactions={recentTransactions} currency={workspace.baseCurrency} />
        </div>
      </div>
    </main>
  );
}
