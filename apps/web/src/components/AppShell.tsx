'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@ethos/ui';
import { APP_THEMES, getThemeForPath } from '@/lib/app-themes';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';

const ALL_THEMES = Object.values(APP_THEMES);

interface Props {
  workspaceName: string;
  sidebarDefaultOpen?: boolean;
  children: React.ReactNode;
}

export function AppShell({ workspaceName, sidebarDefaultOpen = true, children }: Props) {
  const pathname = usePathname();
  const theme = getThemeForPath(pathname);

  // Apply theme to body so portaled elements (Dialog, Popover etc.) get themed
  useEffect(() => {
    document.body.classList.remove(...ALL_THEMES);
    if (theme) document.body.classList.add(theme);
    return () => { document.body.classList.remove(...ALL_THEMES); };
  }, [theme]);

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen} className={theme}>
      <AppSidebar workspaceName={workspaceName} />
      <SidebarInset>
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
