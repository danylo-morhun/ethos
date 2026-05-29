"use client";

import { AddTransactionModal } from "@/features/midas/components/AddTransactionModal";
import { DateRangePicker } from "@/features/midas/components/DateRangePicker";
import { getAppForPath } from "@/lib/app-themes";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	SidebarTrigger,
} from "@ethos/ui";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
	workspaceId?: string;
	baseCurrency?: string;
}

export function AppHeader({ workspaceId, baseCurrency }: Props) {
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

			{app && (
				<div className="ml-auto flex items-center gap-1.5">
					{workspaceId && baseCurrency && (
						<>
							<DateRangePicker />
							<AddTransactionModal workspaceId={workspaceId} baseCurrency={baseCurrency} />
						</>
					)}
					<Button variant="ghost" size="icon" className="h-7 w-7" asChild>
						<Link href={`${app.href}/settings`} aria-label="Settings">
							<HugeiconsIcon icon={Settings01Icon} className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			)}
		</header>
	);
}
