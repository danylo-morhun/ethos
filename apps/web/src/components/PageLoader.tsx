"use client";

import { GreekHelmetIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface Props {
	overlay?: boolean;
}

export function PageLoader({ overlay = false }: Props) {
	const spinner = (
		<div className="relative flex items-center justify-center">
			<div className="absolute h-12 w-12 rounded-full bg-primary/20 blur-2xl" />
			<HugeiconsIcon
				icon={GreekHelmetIcon}
				className="relative h-10 w-10 animate-pulse text-primary [animation-duration:1.2s]"
			/>
		</div>
	);

	if (overlay) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[2px] [animation:loader-appear_0.2s_ease_0.15s_both] opacity-0">
				{spinner}
			</div>
		);
	}

	return (
		<div className="flex min-h-[60vh] items-center justify-center [animation:loader-appear_0.2s_ease_0.1s_both] opacity-0">
			{spinner}
		</div>
	);
}
