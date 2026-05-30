"use client";

import { AddTransactionModal } from "@/features/midas/components/AddTransactionModal";
import { Button, cn } from "@ethos/ui";
import { Add01Icon, BankIcon, BanknoteIcon, Chart01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export type MidasTab = "overview" | "accounts" | "transactions";

interface Props {
	workspaceId: string;
	baseCurrency: string;
}

export function MidasNavTabs({ workspaceId, baseCurrency }: Props) {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [pendingTab, setPendingTab] = useState<MidasTab | null>(null);

	const activeTab = (searchParams.get("tab") as MidasTab) || "overview";
	const displayTab = pendingTab ?? activeTab;
	const isSettings = pathname.startsWith("/settings");

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

	function handleTabClick(tab: MidasTab) {
		if (tab === displayTab && !isSettings) return;
		setPendingTab(tab);
		startTransition(() => {
			router.push(tabHref(tab));
		});
	}

	function tabClass(active: boolean, loading = false) {
		return cn(
			"flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
			active ? "text-primary" : "text-muted-foreground",
			loading && "animate-pulse",
		);
	}

	return (
		<nav
			className="fixed z-40 md:hidden"
			style={{
				bottom: "max(1.25rem, env(safe-area-inset-bottom))",
				left: "50%",
				transform: "translateX(-50%)",
			}}
		>
			<div className="relative">
				{/* Elevated FAB */}
				<div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
					<AddTransactionModal
						workspaceId={workspaceId}
						baseCurrency={baseCurrency}
						trigger={
							<Button
								size="icon"
								className="h-12 w-12 rounded-full shadow-xl transition-transform active:scale-95"
							>
								<HugeiconsIcon icon={Add01Icon} className="h-5 w-5" />
							</Button>
						}
					/>
				</div>

				{/* Pill */}
				<div className="flex items-center rounded-full border border-border/40 bg-background/85 px-2 py-1 shadow-lg backdrop-blur-xl">
					{/* Left: Expenses, Accounts */}
					<button
						type="button"
						onClick={() => handleTabClick("overview")}
						className={tabClass(displayTab === "overview" && !isSettings, isPending && pendingTab === "overview")}
					>
						<HugeiconsIcon icon={Chart01Icon} className="h-5 w-5" />
						Expenses
					</button>
					<button
						type="button"
						onClick={() => handleTabClick("accounts")}
						className={tabClass(displayTab === "accounts" && !isSettings, isPending && pendingTab === "accounts")}
					>
						<HugeiconsIcon icon={BankIcon} className="h-5 w-5" />
						Accounts
					</button>

					{/* Spacer under FAB */}
					<div className="w-14" aria-hidden />

					{/* Right: Transactions, Settings */}
					<button
						type="button"
						onClick={() => handleTabClick("transactions")}
						className={tabClass(displayTab === "transactions" && !isSettings, isPending && pendingTab === "transactions")}
					>
						<HugeiconsIcon icon={BanknoteIcon} className="h-5 w-5" />
						Txns
					</button>
					<Link href="/settings" className={tabClass(isSettings)}>
						<HugeiconsIcon icon={Settings01Icon} className="h-5 w-5" />
						Settings
					</Link>
				</div>
			</div>
		</nav>
	);
}
