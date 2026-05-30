"use client";

import { DueDateChip } from "@/features/tasso/components/DueDateChip";
import { PriorityBadge } from "@/features/tasso/components/PriorityBadge";
import { cn } from "@ethos/ui";

type Priority = "low" | "medium" | "high" | "urgent";

export type CardData = {
	id: string;
	columnId: string;
	title: string;
	priority: Priority | null;
	dueDate: string | null;
	position: string;
};

interface Props {
	card: CardData;
	onClick?: (card: CardData) => void;
}

export function KanbanCard({ card, onClick }: Props) {
	const hasMeta = card.priority || card.dueDate;

	return (
		<div
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onClick?.(card);
			}}
			onClick={() => onClick?.(card)}
			className={cn(
				"group flex flex-col gap-1.5 rounded-md border border-border bg-card px-3 py-2.5",
				"cursor-pointer text-left transition-colors hover:border-border/80 hover:bg-accent/30",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
			)}
		>
			<p className="text-sm leading-snug text-card-foreground">{card.title}</p>

			{hasMeta && (
				<div className="flex flex-wrap items-center gap-1.5">
					{card.priority && <PriorityBadge priority={card.priority} showLabel />}
					{card.dueDate && <DueDateChip dueDate={card.dueDate} />}
				</div>
			)}
		</div>
	);
}
