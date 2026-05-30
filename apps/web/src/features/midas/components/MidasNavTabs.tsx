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

	function iconBtn(active: boolean, loading = false) {
		return cn(
			"flex h-10 w-10 items-center justify-center rounded-full transition-colors",
			active ? "text-primary" : "text-muted-foreground",
			loading && "opacity-40",
		);
	}

	return (
		<>
			{/* Progress bar */}
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
					{/* Grid: equal left/right columns guarantee FAB lands dead-center */}
					<div className="grid grid-cols-[1fr_4rem_1fr] items-center rounded-2xl border border-border/40 bg-background/85 px-3 py-2 shadow-lg backdrop-blur-xl">
						{/* Left: Overview, Accounts */}
						<div className="flex items-center justify-around">
							<button
								type="button"
								onClick={() => handleTabClick("overview")}
								className={iconBtn(displayTab === "overview" && !isSettings, isPending && pendingTab === "overview")}
							>
								<HugeiconsIcon icon={Chart01Icon} className="h-5 w-5" />
							</button>
							<button
								type="button"
								onClick={() => handleTabClick("accounts")}
								className={iconBtn(displayTab === "accounts" && !isSettings, isPending && pendingTab === "accounts")}
							>
								<HugeiconsIcon icon={BankIcon} className="h-5 w-5" />
							</button>
						</div>

						{/* Center FAB — inside the bar, slightly raised with -mt-3 */}
						<div className="flex items-center justify-center">
							<div className="-mt-3">
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
						</div>

						{/* Right: Transactions, Settings */}
						<div className="flex items-center justify-around">
							<button
								type="button"
								onClick={() => handleTabClick("transactions")}
								className={iconBtn(displayTab === "transactions" && !isSettings, isPending && pendingTab === "transactions")}
							>
								<HugeiconsIcon icon={BanknoteIcon} className="h-5 w-5" />
							</button>
							<Link href="/settings" className={iconBtn(isSettings)}>
								<HugeiconsIcon icon={Settings01Icon} className="h-5 w-5" />
							</Link>
						</div>
					</div>
				</div>
			</nav>
		</>
	);
}
