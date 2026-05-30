"use client";

import { useEffect, useState } from "react";

export function MidasContentShell({ children }: { children: React.ReactNode }) {
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		function onStart() {
			setRefreshing(true);
		}
		function onEnd() {
			setRefreshing(false);
		}
		window.addEventListener("ethos:refresh-start", onStart);
		window.addEventListener("ethos:refresh-end", onEnd);
		return () => {
			window.removeEventListener("ethos:refresh-start", onStart);
			window.removeEventListener("ethos:refresh-end", onEnd);
		};
	}, []);

	return (
		<div
			className={
				refreshing
					? "pointer-events-none opacity-50 transition-opacity duration-150"
					: "transition-opacity duration-150"
			}
		>
			{children}
		</div>
	);
}
