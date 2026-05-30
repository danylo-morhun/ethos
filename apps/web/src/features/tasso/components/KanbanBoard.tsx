"use client";

import { type CardData } from "@/features/tasso/components/KanbanCard";
import { type ColumnData, KanbanColumn } from "@/features/tasso/components/KanbanColumn";

interface Props {
	columns: ColumnData[];
	cards: CardData[];
	projectId: string;
}

export function KanbanBoard({ columns, cards, projectId: _projectId }: Props) {
	const cardsByColumn = new Map<string, CardData[]>();
	for (const col of columns) cardsByColumn.set(col.id, []);
	for (const card of cards) {
		const list = cardsByColumn.get(card.columnId);
		if (list) list.push(card);
	}

	if (columns.length === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-sm text-muted-foreground">No columns yet. Add one to get started.</p>
			</div>
		);
	}

	return (
		<div className="flex h-full gap-3 overflow-x-auto p-4 pb-6">
			{columns.map((col) => (
				<KanbanColumn
					key={col.id}
					column={col}
					cards={cardsByColumn.get(col.id) ?? []}
				/>
			))}
		</div>
	);
}
