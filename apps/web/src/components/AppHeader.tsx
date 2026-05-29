'use client';

import { usePathname } from 'next/navigation';
import {
  SidebarTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@ethos/ui';
import { getAppForPath } from '@/lib/app-themes';

export function AppHeader() {
  const pathname = usePathname();
  const app = getAppForPath(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-2">
      <SidebarTrigger className="h-7 w-7 [&>svg]:h-4 [&>svg]:w-4" />
      <div aria-hidden className="h-4 w-px shrink-0 bg-border" />
      <Breadcrumb className="ml-2">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
              ethos
            </BreadcrumbLink>
          </BreadcrumbItem>
          {app && (
            <>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{app.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
