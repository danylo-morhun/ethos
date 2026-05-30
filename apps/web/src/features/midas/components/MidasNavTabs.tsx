"use client";

import { AddTransactionModal } from "@/features/midas/components/AddTransactionModal";
import { Button, cn } from "@ethos/ui";
import { Add01Icon, BankIcon, BanknoteIcon, Chart01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type MidasTab = "overview" | "accounts" | "transactions";

const NOTCH_R = 28; // matches FAB h-12/2 = 24px + 4px gap
const CORNER_R = 14; // ~rounded-xl

/** SVG bar shape with concave notch cut from top-center */
function NavShape({ width, height }: { width: number; height: number }) {
	if (!width || !height) return null;
	const cx = width / 2;
	// Smooth transition bezier radius at the notch entrance/exit
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
		<svg
			className="pointer-events-none absolute inset-0"
			width={width}
			height={height}
			aria-hidden
		>
			<path
				d={d}
				style={{ fill: "var(--background)", stroke: "var(--border)", strokeWidth: 1 }}
			/>
		</svg>
	);
}

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
					{/* ref wrapper — SVG measures and fills this exact box */}
					<div ref={barRef} className="relative">
						{/* SVG notch shape — behind everything */}
						<NavShape width={dims.width} height={dims.height} />
						{/* Fallback border while SVG measures (first render) */}
						{!dims.width && (
							<div className="absolute inset-0 rounded-xl border border-border bg-background" />
						)}

						{/* FAB — center pinned to bar's top edge */}
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

						{/* Icon grid — sits on top of SVG */}
						<div className="relative grid grid-cols-[1fr_4rem_1fr] items-center px-3 py-3">
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

							{/* Center spacer — FAB sits here via absolute */}
							<div aria-hidden />

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
				</div>
			</nav>
		</>
	);
}
