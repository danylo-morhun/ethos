"use client";

import { AddTransactionModal } from "@/features/midas/components/AddTransactionModal";
import { DateRangePicker } from "@/features/midas/components/DateRangePicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAppForPath } from "@/lib/app-themes";
import { Button, SidebarTrigger, cn } from "@ethos/ui";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type MidasTab = "overview" | "accounts" | "transactions";

const MIDAS_TABS: { value: MidasTab; label: string }[] = [
	{ value: "overview", label: "Expenses" },
	{ value: "accounts", label: "Accounts" },
	{ value: "transactions", label: "Transactions" },
];

interface Props {
	workspaceId?: string;
	baseCurrency?: string;
}

export function AppHeader({ workspaceId, baseCurrency }: Props) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const app = getAppForPath(pathname);

	const isMidasHome = pathname === "/midas";
	const activeTab = (searchParams.get("tab") as MidasTab) || "overview";

	function tabHref(tab: MidasTab) {
		const params = new URLSearchParams(searchParams.toString());
		if (tab === "overview") {
			params.delete("tab");
		} else {
			params.set("tab", tab);
		}
		if (tab !== "transactions") {
			params.delete("page");
			params.delete("account");
			params.delete("q");
			params.delete("sort");
			params.delete("dir");
			params.delete("tag");
		}
		const qs = params.toString();
		return qs ? `/midas?${qs}` : "/midas";
	}

	return (
		<header className="relative flex h-14 shrink-0 items-center gap-1 border-b border-border px-2">
			<SidebarTrigger className="h-7 w-7 [&>svg]:h-4 [&>svg]:w-4" />
			<div aria-hidden className="h-4 w-px shrink-0 bg-border" />

			<Link
				href={app?.href ?? "/"}
				className="ml-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
			>
				{app?.name ?? "ethos"}
			</Link>

			{isMidasHome && (
				<nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex h-full items-stretch">
					{MIDAS_TABS.map(({ value, label }) => (
						<Link
							key={value}
							href={tabHref(value)}
							className={cn(
								"relative flex items-center px-3.5 text-sm font-medium transition-colors",
								activeTab === value
									? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{label}
						</Link>
					))}
				</nav>
			)}

			{app && (
				<div className="ml-auto flex items-center gap-1.5">
					{workspaceId && baseCurrency && (
						<>
							<DateRangePicker />
							<span className="hidden md:contents">
								<AddTransactionModal workspaceId={workspaceId} baseCurrency={baseCurrency} />
							</span>
						</>
					)}
					<ThemeToggle />
					<Button variant="ghost" size="icon" className="hidden h-8 w-8 md:inline-flex" asChild>
						<Link href="/settings" aria-label="Settings">
							<HugeiconsIcon icon={Settings01Icon} className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			)}
		</header>
	);
}
