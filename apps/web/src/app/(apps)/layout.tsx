import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { getWorkspace } from '@/features/midas/actions/workspace';
import { AppShell } from '@/components/AppShell';

export default async function AppsLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);

  const sidebarCookie = cookieStore.get('sidebar_state');
  const defaultOpen = sidebarCookie ? sidebarCookie.value === 'true' : true;

  const workspace = session?.user?.id ? await getWorkspace(session.user.id) : null;

  return (
    <AppShell workspaceName={workspace?.name ?? 'My Workspace'} sidebarDefaultOpen={defaultOpen}>
      {children}
    </AppShell>
  );
}
