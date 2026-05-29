"use server";

import { auth } from "@/auth";
import {
	accounts,
	and,
	db,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	transactionEntries,
	transactions,
	workspaces,
} from "@ethos/db";

export async function exportTransactionsCsv(
	workspaceId: string,
	from: string | undefined,
	to: string | undefined,
	accountId: string | undefined,
	q: string | undefined,
): Promise<{ error: string } | { csv: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	const [ws] = await db
		.select({ userId: workspaces.userId })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);

	if (!ws || ws.userId !== session.user.id) return { error: "Forbidden" };

	const accountSubquery = accountId
		? db
				.selectDistinct({ id: transactionEntries.transactionId })
				.from(transactionEntries)
				.where(eq(transactionEntries.accountId, accountId))
		: undefined;

	const rows = await db.query.transactions.findMany({
		where: and(
			eq(transactions.workspaceId, workspaceId),
			from ? gte(transactions.date, from) : undefined,
			to ? lte(transactions.date, to) : undefined,
			q ? ilike(transactions.description, `%${q}%`) : undefined,
			accountSubquery ? inArray(transactions.id, accountSubquery) : undefined,
		),
		orderBy: [desc(transactions.date), desc(transactions.createdAt)],
		with: { entries: { with: { account: true } } },
	});

	const lines = ["Date,Description,From,To,Amount,Currency,Base Amount"];

	for (const txn of rows) {
		const fromEntry = txn.entries.find((e) => Number(e.baseAmount) < 0);
		const toEntry = txn.entries.find((e) => Number(e.baseAmount) > 0);

		const cell = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`;

		lines.push(
			[
				txn.date,
				cell(txn.description),
				cell(fromEntry?.account?.name),
				cell(toEntry?.account?.name),
				toEntry?.amount ?? "0",
				toEntry?.currency ?? "",
				toEntry?.baseAmount ?? "0",
			].join(","),
		);
	}

	return { csv: lines.join("\n") };
}
