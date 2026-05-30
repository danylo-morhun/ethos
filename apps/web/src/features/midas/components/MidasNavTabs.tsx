"use client";

import { AddTransactionModal } from "@/features/midas/components/AddTransactionModal";
import { Button, cn } from "@ethos/ui";
import { Add01Icon, Chart01Icon, Clock01Icon, Settings01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type MidasTab = "overview" | "accounts" | "transactions";

// FAB h-14 = 56px → radius 28px + 4px gap = 32
const NOTCH_R = 32;
const CORNER_R = 14;

function NavShape({ width, height }: { width: number; height: number }) {
	if (!width || !height) return null;
	const cx = width / 2;
	const br = 8;
	const d = [
		`M ${CORNER_R} 0`,
		`L ${cx - NOTCH_R - br} 0`,
		`Q ${cx - NOTCH_R} 0 ${cx - NOTCH_R} ${br}`,
		`A ${NOTCH_R} ${NOTCH_R} 0 0 1 ${cx + NOTCH_R} ${br}`,
		`Q ${cx + NOTCH_R} 0 ${cx + NOTCH_R + br} 0`,
		`L ${width - CORNER_R} 0`,
		`Q ${width} 0 ${width} ${CORNER_R}`,
		`L ${width} ${height - CORNER_R}`,
		`Q ${width} ${height} ${width - CORNER_R} ${height}`,
		`L ${CORNER_R} ${height}`,
		`Q 0 ${height} 0 ${height - CORNER_R}`,
		`L 0 ${CORNER_R}`,
		`Q 0 0 ${CORNER_R} 0`,
		`Z`,
	].join(" ");

	return (
		<svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
			<path d={d} style={{ fill: "var(--background)", stroke: "var(--border)", strokeWidth: 1 }} />
		</svg>
	);
}

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

	const barRef = useRef<HTMLDivElement>(null);
	const [dims, setDims] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const el = barRef.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => {
			setDims({
				width: Math.round(entry.contentRect.width),
				height: Math.round(entry.contentRect.height),
			});
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

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
					<div ref={barRef} className="relative">
						<NavShape width={dims.width} height={dims.height} />
						{!dims.width && (
							<div className="absolute inset-0 rounded-xl border border-border bg-background" />
						)}

						{/* FAB h-14 = 56px, center at bar top edge */}
						<div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
							<AddTransactionModal
								workspaceId={workspaceId}
								baseCurrency={baseCurrency}
								trigger={
									<Button
										size="icon"
										className="h-14 w-14 rounded-full shadow-xl transition-transform active:scale-95"
									>
										<HugeiconsIcon icon={Add01Icon} className="h-6 w-6" />
									</Button>
								}
							/>
						</div>

						<div className="relative grid grid-cols-[1fr_4.5rem_1fr] items-center px-4 py-3">
							{/* Left: Expenses, Accounts */}
							<div className="flex items-center justify-around">
								{TABS.slice(0, 2).map(({ value, label, icon }) => {
									const active = displayTab === value && !isSettings;
									const loading = isPending && pendingTab === value;
									return (
										<button
											key={value}
											type="button"
											onClick={() => handleTabClick(value)}
											className={tabCls(active, loading)}
										>
											<HugeiconsIcon icon={icon} className="h-5 w-5" />
											<span className="text-[10px] font-medium">{label}</span>
										</button>
									);
								})}
							</div>

							<div aria-hidden />

							{/* Right: History, Settings */}
							<div className="flex items-center justify-around">
								{(() => {
									const { value, label, icon } = TABS[2];
									const active = displayTab === value && !isSettings;
									const loading = isPending && pendingTab === value;
									return (
										<button
											type="button"
											onClick={() => handleTabClick(value)}
											className={tabCls(active, loading)}
										>
											<HugeiconsIcon icon={icon} className="h-5 w-5" />
											<span className="text-[10px] font-medium">{label}</span>
										</button>
									);
								})()}
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
