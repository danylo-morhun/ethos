"use client";

import { cn } from "@ethos/ui";
import { BankIcon, BanknoteIcon, Chart01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export type MidasTab = "overview" | "accounts" | "transactions";

const TABS: { value: MidasTab; label: string; icon: typeof Chart01Icon }[] = [
	{ value: "overview", label: "Expenses", icon: Chart01Icon },
	{ value: "accounts", label: "Accounts", icon: BankIcon },
	{ value: "transactions", label: "Transactions", icon: BanknoteIcon },
];

export function MidasNavTabs() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [pendingTab, setPendingTab] = useState<MidasTab | null>(null);

	const activeTab = (searchParams.get("tab") as MidasTab) || "overview";
	const displayTab = pendingTab ?? activeTab;

	useEffect(() => {
		if (!isPending) setPendingTab(null);
	}, [isPending]);

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

	function handleClick(tab: MidasTab) {
		if (tab === displayTab) return;
		setPendingTab(tab);
		startTransition(() => {
			router.push(tabHref(tab));
		});
	}

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
			<div className="flex">
				{TABS.map(({ value, label, icon }) => {
					const isActive = displayTab === value;
					const isLoading = isPending && pendingTab === value;
					return (
						<button
							key={value}
							type="button"
							onClick={() => handleClick(value)}
							className={cn(
								"flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
								isActive ? "text-primary" : "text-muted-foreground",
								isLoading && "animate-pulse",
							)}
						>
							<HugeiconsIcon icon={icon} className="h-5 w-5" />
							{label}
						</button>
					);
				})}
			</div>
		</nav>
	);
}
