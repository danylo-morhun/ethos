import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { initializeWorkspace } from '@/actions/initializeWorkspace';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) redirect('/');

  const workspace = await initializeWorkspace(session.user.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="text-muted-foreground space-y-1 text-center text-sm">
        <p>
          Signed in as <span className="text-foreground font-medium">{session.user.email}</span>
        </p>
        <p>
          Workspace ID: <span className="text-foreground font-mono">{workspace.id}</span>
        </p>
      </div>
    </main>
  );
}
