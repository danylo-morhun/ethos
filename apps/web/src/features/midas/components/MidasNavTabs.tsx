"use client";

import { AddTransactionModal } from "@/features/midas/components/AddTransactionModal";
import { Button, cn } from "@ethos/ui";
import { Add01Icon, Chart01Icon, Clock01Icon, Settings01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type MidasTab = "overview" | "accounts" | "transactions";

const TABS: { value: MidasTab; label: string; icon: typeof Chart01Icon }[] = [
	{ value: "overview", label: "Expenses", icon: Chart01Icon },
	{ value: "accounts", label: "Accounts", icon: Wallet01Icon },
	{ value: "transactions", label: "History", icon: Clock01Icon },
];

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

	function tabCls(active: boolean, loading = false) {
		return cn(
			"flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors",
			active ? "text-primary" : "text-muted-foreground",
			loading && "opacity-40",
		);
	}

	return (
		<>
			{isPending && (
				<div className="fixed inset-x-0 top-14 z-50 h-0.5 overflow-hidden md:hidden">
					<div className="h-full w-1/2 animate-[nav-loader_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
				</div>
			)}

			<nav
				className="fixed inset-x-0 bottom-0 z-40 md:hidden"
				style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
			>
				<div className="mx-3 mb-3">
					{/* FAB — exactly half above the bar (top-0 + -translate-y-1/2) */}
					<div className="relative">
						<div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
							<AddTransactionModal
								workspaceId={workspaceId}
								baseCurrency={baseCurrency}
								trigger={
									<Button
										size="icon"
										className="h-11 w-11 rounded-full shadow-lg transition-transform active:scale-95"
									>
										<HugeiconsIcon icon={Add01Icon} className="h-5 w-5" />
									</Button>
								}
							/>
						</div>

						<div className="grid grid-cols-[1fr_3.5rem_1fr] items-center rounded-xl border border-border bg-background px-4 py-2 shadow-sm">
							{/* Left: Expenses, Accounts */}
							<div className="flex items-center justify-around">
								{TABS.slice(0, 2).map(({ value, label, icon }) => (
									<button
										key={value}
										type="button"
										onClick={() => handleTabClick(value)}
										className={tabCls(displayTab === value && !isSettings, isPending && pendingTab === value)}
									>
										<HugeiconsIcon icon={icon} className="h-5 w-5" />
										<span className="text-[10px] font-medium">{label}</span>
									</button>
								))}
							</div>

							<div aria-hidden />

							{/* Right: History, Settings */}
							<div className="flex items-center justify-around">
								<button
									type="button"
									onClick={() => handleTabClick("transactions")}
									className={tabCls(displayTab === "transactions" && !isSettings, isPending && pendingTab === "transactions")}
								>
									<HugeiconsIcon icon={Clock01Icon} className="h-5 w-5" />
									<span className="text-[10px] font-medium">History</span>
								</button>
								<Link href="/settings" className={tabCls(isSettings)}>
									<HugeiconsIcon icon={Settings01Icon} className="h-5 w-5" />
									<span className="text-[10px] font-medium">Settings</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</nav>
		</>
	);
}
