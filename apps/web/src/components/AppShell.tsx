"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { APP_THEMES, getThemeForPath } from "@/lib/app-themes";
import { SidebarInset, SidebarProvider } from "@ethos/ui";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ALL_THEMES = Object.values(APP_THEMES);

interface Props {
	workspaceName: string;
	workspaceId?: string;
	baseCurrency?: string;
	sidebarDefaultOpen?: boolean;
	children: React.ReactNode;
}

export function AppShell({
	workspaceName,
	workspaceId,
	baseCurrency,
	sidebarDefaultOpen = true,
	children,
}: Props) {
	const pathname = usePathname();
	const theme = getThemeForPath(pathname);

	// Apply theme to body so portaled elements (Dialog, Popover etc.) get themed
	useEffect(() => {
		document.body.classList.remove(...ALL_THEMES);
		if (theme) document.body.classList.add(theme);
		return () => {
			document.body.classList.remove(...ALL_THEMES);
		};
	}, [theme]);

	return (
		<SidebarProvider defaultOpen={sidebarDefaultOpen} className={theme}>
			<AppSidebar workspaceName={workspaceName} />
			<SidebarInset>
				<AppHeader workspaceId={workspaceId} baseCurrency={baseCurrency} />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
