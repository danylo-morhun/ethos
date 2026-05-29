"use client";

// Fix 7: import APPS_CONFIG as single source of truth for paths + names
import { APPS_CONFIG } from "@/lib/app-themes";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ethos/ui";
import {
	ArrowUpDownIcon,
	CheckIcon,
	GreekHelmetIcon,
	Money01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Icons are UI-only — keyed by the same paths as APPS_CONFIG
const APP_ICONS: Record<string, typeof Money01Icon> = {
	"/midas": Money01Icon,
};

interface Props {
	workspaceName: string;
}

export function AppSidebar({ workspaceName }: Props) {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
										<HugeiconsIcon icon={GreekHelmetIcon} className="h-6 w-6" />
									</div>
									<div className="flex min-w-0 flex-col text-left leading-none">
										<span className="text-sm font-bold">ethos</span>
										<span className="truncate text-xs text-muted-foreground">Midas</span>
									</div>
									<HugeiconsIcon
										icon={ArrowUpDownIcon}
										className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/60"
									/>
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" side="right" align="start" sideOffset={20}>
								<DropdownMenuLabel className="text-xs text-muted-foreground">
									Workspaces
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<HugeiconsIcon icon={CheckIcon} className="h-4 w-4 text-primary" />
									{workspaceName}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem disabled>
									New workspace
									<span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
										soon
									</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Applications</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{Object.entries(APPS_CONFIG).map(([href, { name }]) => {
								const icon = APP_ICONS[href];
								return (
									<SidebarMenuItem key={href}>
										<SidebarMenuButton asChild isActive={pathname.startsWith(href)} tooltip={name}>
											<Link href={href}>
												{icon && <HugeiconsIcon icon={icon} className="h-4 w-4" />}
												<span>{name}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
