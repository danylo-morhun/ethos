import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { initializeWorkspace } from '@/features/midas/actions/workspace';
import { getAccounts } from '@/features/midas/actions/accounts';
import { getBalances } from '@/features/midas/actions/balances';
import { WorkspaceSettingsForm } from '@/features/midas/components/WorkspaceSettingsForm';
import { AccountsOverview } from '@/features/midas/components/AccountsOverview';
import { AddAccountModal } from '@/features/midas/components/AddAccountModal';
import { ArchivedAccountsList } from '@/features/midas/components/ArchivedAccountsList';
import { AddRecurringModal } from '@/features/midas/components/AddRecurringModal';
import { RecurringTransactionsList } from '@/features/midas/components/RecurringTransactionsList';
import { getRecurringTransactions } from '@/features/midas/actions/recurring';
import { Separator } from '@ethos/ui';

export default async function MidasSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const workspace = await initializeWorkspace(session.user.id);
  const [accounts, archivedAccounts, balances, recurringItems] = await Promise.all([
    getAccounts(workspace.id),
    getAccounts(workspace.id, { includeArchived: true }).then((all) => all.filter((a) => a.archivedAt !== null)),
    getBalances(workspace.id, undefined, undefined),
    getRecurringTransactions(workspace.id),
  ]);

  return (
    <main className="px-4 py-6 sm:px-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/midas" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to dashboard
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold">Settings</h1>

      <section className="mb-10">
        <h2 className="mb-1 text-base font-semibold">Workspace</h2>
        <p className="mb-4 text-sm text-muted-foreground">Your personal finance workspace settings.</p>
        <WorkspaceSettingsForm
          workspaceId={workspace.id}
          initialName={workspace.name}
          baseCurrency={workspace.baseCurrency}
        />
      </section>

      <Separator className="my-8" />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Accounts</h2>
            <p className="text-sm text-muted-foreground">Manage your asset, liability, income and expense accounts.</p>
          </div>
          <AddAccountModal workspaceId={workspace.id} baseCurrency={workspace.baseCurrency} />
        </div>
        <AccountsOverview
          balances={balances}
          accounts={accounts}
          currency={workspace.baseCurrency}
          workspaceId={workspace.id}
          periodLabel="All time"
        />
        <ArchivedAccountsList accounts={archivedAccounts} />
      </section>

      <Separator className="my-8" />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Recurring Transactions</h2>
            <p className="text-sm text-muted-foreground">Automatically recorded on their scheduled dates when you visit.</p>
          </div>
          <AddRecurringModal workspaceId={workspace.id} baseCurrency={workspace.baseCurrency} />
        </div>
        <RecurringTransactionsList items={recurringItems} currency={workspace.baseCurrency} />
      </section>
    </main>
  );
}
