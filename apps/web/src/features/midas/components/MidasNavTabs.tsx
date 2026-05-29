"use client";

import { cn } from "@ethos/ui";
import { BankIcon, BanknoteIcon, Chart01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export type MidasTab = "overview" | "accounts" | "transactions";

const TABS: { value: MidasTab; label: string; icon: typeof Chart01Icon }[] = [
	{ value: "overview", label: "Overview", icon: Chart01Icon },
	{ value: "accounts", label: "Accounts", icon: BankIcon },
	{ value: "transactions", label: "Transactions", icon: BanknoteIcon },
];

interface Props {
	activeTab: MidasTab;
}

export function MidasNavTabs({ activeTab }: Props) {
	const searchParams = useSearchParams();

	function tabHref(tab: MidasTab) {
		const params = new URLSearchParams(searchParams.toString());
		if (tab === "overview") {
			params.delete("tab");
		} else {
			params.set("tab", tab);
		}
		// Clear table-specific params when leaving transactions
		if (tab !== "transactions") {
			params.delete("page");
			params.delete("account");
			params.delete("q");
			params.delete("sort");
			params.delete("dir");
			params.delete("tag");
		}
		const qs = params.toString();
		return qs ? `?${qs}` : "?";
	}

	return (
		<>
			{/* Desktop — top tab strip */}
			<nav className="hidden border-b md:flex">
				{TABS.map(({ value, label }) => (
					<Link
						key={value}
						href={tabHref(value)}
						className={cn(
							"relative px-4 py-2.5 text-sm font-medium transition-colors",
							activeTab === value
								? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{label}
					</Link>
				))}
			</nav>

			{/* Mobile — fixed bottom nav */}
			<nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
				<div className="flex">
					{TABS.map(({ value, label, icon }) => (
						<Link
							key={value}
							href={tabHref(value)}
							className={cn(
								"flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
								activeTab === value ? "text-primary" : "text-muted-foreground",
							)}
						>
							<HugeiconsIcon icon={icon} className="h-5 w-5" />
							{label}
						</Link>
					))}
				</div>
			</nav>
		</>
	);
}
