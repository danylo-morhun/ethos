"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type State = "idle" | "running" | "done";

export function NavigationProgress() {
	const [state, setState] = useState<State>("idle");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isNavRef = useRef(false); // true = nav-type (completes on path change), false = refresh-type
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function start(nav: boolean) {
		isNavRef.current = nav;
		if (timerRef.current) clearTimeout(timerRef.current);
		setState("running");
	}

	function complete() {
		setState("done");
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setState("idle"), 400);
	}

	// Link clicks + programmatic navigation events
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
			if (!anchor) return;
			const href = anchor.getAttribute("href");
			if (!href) return;
			if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return;
			if (anchor.hasAttribute("download") || anchor.target === "_blank") return;
			start(true);
		}
		function handleNavigate() {
			start(true);
		}
		function handleRefreshStart() {
			start(false);
		}
		function handleRefreshEnd() {
			complete();
		}
		document.addEventListener("click", handleClick);
		window.addEventListener("ethos:navigate-start", handleNavigate);
		window.addEventListener("ethos:refresh-start", handleRefreshStart);
		window.addEventListener("ethos:refresh-end", handleRefreshEnd);
		return () => {
			document.removeEventListener("click", handleClick);
			window.removeEventListener("ethos:navigate-start", handleNavigate);
			window.removeEventListener("ethos:refresh-start", handleRefreshStart);
			window.removeEventListener("ethos:refresh-end", handleRefreshEnd);
		};
	}, []);

	// Complete nav-type progress when pathname/searchParams change
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — path change = nav done
	useEffect(() => {
		if (state === "running" && isNavRef.current) {
			complete();
		}
	}, [pathname, searchParams]);

	if (state === "idle") return null;

	return (
		<div className="fixed inset-x-0 top-0 z-[9999] h-[2px] overflow-hidden" aria-hidden>
			<div
				className={
					state === "running"
						? "h-full bg-primary transition-all duration-[5000ms] ease-out"
						: "h-full bg-primary transition-all duration-300 ease-in"
				}
				style={{ width: state === "running" ? "85%" : "100%", transformOrigin: "left" }}
			/>
		</div>
	);
}
