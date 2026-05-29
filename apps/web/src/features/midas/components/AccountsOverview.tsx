"use client";

import { archiveAccount, deleteAccount } from "@/features/midas/actions/accounts";
import type { getAccounts } from "@/features/midas/actions/accounts";
import type { AccountBalance } from "@/features/midas/actions/balances";
import { AddAccountModal } from "@/features/midas/components/AddAccountModal";
import { EditAccountModal } from "@/features/midas/components/EditAccountModal";
import { formatCurrency } from "@/features/midas/lib/format";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Progress,
} from "@ethos/ui";
import {
	Archive01Icon,
	Delete01Icon,
	MoreHorizontalIcon,
	PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

function typeLabels(periodLabel: string): Record<string, string> {
	return {
		ASSET: "Assets",
		LIABILITY: "Liabilities",
		INCOME: `${periodLabel} Income`,
		EXPENSE: `${periodLabel} Expenses`,
	};
}

const TYPE_ORDER = ["ASSET", "INCOME", "EXPENSE", "LIABILITY"];

type Account = Awaited<ReturnType<typeof getAccounts>>[number];

interface AccountRow extends AccountBalance {
	parentId: string | null;
}

interface Props {
	balances: AccountBalance[];
	currency: string;
	workspaceId: string;
	accounts: Account[];
	periodLabel: string;
	hideHeader?: boolean;
	listMode?: boolean;
}

function sortWithChildren(rows: AccountRow[]): AccountRow[] {
	const idSet = new Set(rows.map((r) => r.accountId));
	const result: AccountRow[] = [];
	const visited = new Set<string>();

	function visit(row: AccountRow) {
		if (visited.has(row.accountId)) return;
		visited.add(row.accountId);
		result.push(row);
		rows.filter((r) => r.parentId === row.accountId).forEach(visit);
	}

	rows.filter((r) => !r.parentId || !idSet.has(r.parentId)).forEach(visit);
	rows.forEach((r) => visit(r));

	return result;
}

export function AccountsOverview({
	balances,
	currency,
	workspaceId,
	accounts,
	periodLabel,
	hideHeader = false,
	listMode = false,
}: Props) {
	const TYPE_LABELS = typeLabels(periodLabel);
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [editTarget, setEditTarget] = React.useState<Account | null>(null);
	const [confirmTarget, setConfirmTarget] = React.useState<{ id: string; name: string } | null>(
		null,
	);
	const [archiveTarget, setArchiveTarget] = React.useState<{ id: string; name: string } | null>(
		null,
	);

	const accountMap = new Map(accounts.map((a) => [a.id, a]));
	const rows: AccountRow[] = balances
		.filter((b) => accountMap.has(b.accountId))
		.map((b) => ({
			...b,
			parentId: accountMap.get(b.accountId)?.parentId ?? null,
		}));

	const grouped = TYPE_ORDER.reduce<Record<string, AccountRow[]>>((acc, type) => {
		acc[type] = rows.filter((b) => b.type === type);
		return acc;
	}, {});

	function handleDeleteConfirm() {
		if (!confirmTarget) return;
		const { id, name } = confirmTarget;
		startTransition(async () => {
			const result = await deleteAccount(id);
			if ("error" in result) {
				toast.error(result.error);
			} else {
				toast.success(`"${name}" deleted`);
				router.refresh();
			}
			setConfirmTarget(null);
		});
	}

	function handleArchiveConfirm() {
		if (!archiveTarget) return;
		const { id, name } = archiveTarget;
		startTransition(async () => {
			const result = await archiveAccount(id);
			if ("error" in result) {
				toast.error(result.error);
			} else {
				toast.success(`"${name}" archived`);
				router.refresh();
			}
			setArchiveTarget(null);
		});
	}

	const LIST_LABELS: Record<string, string> = {
		ASSET: "Assets",
		LIABILITY: "Liabilities",
		INCOME: "Income",
		EXPENSE: "Expenses",
	};

	return (
		<section>
			{!hideHeader && (
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold">Accounts</h2>
					<AddAccountModal workspaceId={workspaceId} baseCurrency={currency} />
				</div>
			)}

			{listMode ? (
				<div className="space-y-4">
					{TYPE_ORDER.map((type) => {
						const typeAccounts = accounts.filter((a) => a.type === type);
						if (!typeAccounts.length) return null;
						return (
							<div key={type}>
								<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									{LIST_LABELS[type]}
								</p>
								<div className="rounded-lg border divide-y">
									{typeAccounts.map((acct) => (
										<div key={acct.id} className="flex items-center justify-between px-3 py-2">
											<span className="text-sm font-medium">{acct.name}</span>
											<div className="flex items-center gap-2">
												<span className="text-xs text-muted-foreground">{acct.currency}</span>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6 text-muted-foreground/60 hover:text-foreground"
														>
															<HugeiconsIcon icon={MoreHorizontalIcon} className="h-3.5 w-3.5" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem onClick={() => setEditTarget(acct)}>
															<HugeiconsIcon icon={PencilEdit01Icon} className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => setArchiveTarget({ id: acct.id, name: acct.name })}
														>
															<HugeiconsIcon icon={Archive01Icon} className="mr-2 h-4 w-4" />
															Archive
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-red-500 focus:text-red-500"
															onClick={() => setConfirmTarget({ id: acct.id, name: acct.name })}
														>
															<HugeiconsIcon icon={Delete01Icon} className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			) : (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{TYPE_ORDER.map((type) => {
					const group = grouped[type] ?? [];
					const sorted = sortWithChildren(group);
					const sum = group.reduce((acc, b) => acc + Number(b.balance), 0);
					const displaySum = formatCurrency(Math.abs(sum), currency);

					return (
						<Card key={type} className="overflow-hidden h-full flex flex-col">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{TYPE_LABELS[type]}
								</CardTitle>
								<p className="text-2xl lg:text-3xl font-bold tracking-tight break-words">
									{displaySum}
								</p>
							</CardHeader>
							<CardContent>
								{sorted.length === 0 ? (
									<p className="text-xs text-muted-foreground">No accounts</p>
								) : (
									<div className="mt-1 flex flex-col gap-3">
										{sorted.map((b) => {
											const isChild = !!b.parentId;
											const acct = accountMap.get(b.accountId);
											const budget = acct?.budget != null ? Number(acct.budget) : null;
											const balance = Number(b.balance);
											const absBalance = Math.abs(balance);
											const showBudget =
												(b.type === "EXPENSE" || b.type === "INCOME") &&
												budget != null &&
												budget > 0;
											const pct = showBudget ? Math.min((absBalance / budget) * 100, 100) : null;
											const overBudget = showBudget && absBalance > budget;
											const isIncome = b.type === "INCOME";

											return (
												<div
													key={b.accountId}
													className={`flex flex-col gap-1 w-full ${isChild ? "pl-4" : ""}`}
												>
													<div className="flex items-center justify-between w-full">
														<span className="flex min-w-0 items-center gap-1">
															{isChild && (
																<span className="shrink-0 text-muted-foreground/50">↳</span>
															)}
															<Link
																href={`/midas/accounts/${b.accountId}`}
																className="text-sm font-medium pr-2 truncate hover:underline underline-offset-2"
															>
																{b.name}
															</Link>
														</span>

														<div className="flex shrink-0 items-center gap-1">
															{(() => {
																const acctCurrency = acct?.currency ?? currency;
																const isMulti = acctCurrency !== currency;
																const baseAmt = Math.abs(Number(b.balance));
																const nativeAmt = Math.abs(Number(b.nativeBalance));
																const isNeg = Number(b.balance) < 0;
																return (
																	<span
																		className={`text-sm whitespace-nowrap text-right ${isNeg ? "text-red-500" : "text-muted-foreground"}`}
																	>
																		{isMulti ? (
																			<>
																				{formatCurrency(nativeAmt, acctCurrency)}
																				<span className="block text-xs text-muted-foreground/60">
																					≈ {formatCurrency(baseAmt, currency)}
																				</span>
																			</>
																		) : (
																			formatCurrency(baseAmt, currency)
																		)}
																	</span>
																);
															})()}

															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-6 w-6 text-muted-foreground/60 hover:text-foreground"
																	>
																		<HugeiconsIcon
																			icon={MoreHorizontalIcon}
																			className="h-3.5 w-3.5"
																		/>
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem
																		onClick={() => {
																			if (acct) setEditTarget(acct);
																		}}
																	>
																		<HugeiconsIcon
																			icon={PencilEdit01Icon}
																			className="mr-2 h-4 w-4"
																		/>
																		Edit
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={() =>
																			setArchiveTarget({ id: b.accountId, name: b.name })
																		}
																	>
																		<HugeiconsIcon icon={Archive01Icon} className="mr-2 h-4 w-4" />
																		Archive
																	</DropdownMenuItem>
																	<DropdownMenuSeparator />
																	<DropdownMenuItem
																		className="text-red-500 focus:text-red-500"
																		onClick={() =>
																			setConfirmTarget({ id: b.accountId, name: b.name })
																		}
																	>
																		<HugeiconsIcon icon={Delete01Icon} className="mr-2 h-4 w-4" />
																		Delete
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
													</div>

													{showBudget && pct !== null && (
														<div className="flex flex-col gap-1.5 mt-2">
															<Progress
																value={pct}
																className="h-1.5"
																indicatorClassName={
																	isIncome
																		? overBudget
																			? "bg-green-500"
																			: undefined
																		: overBudget
																			? "bg-destructive"
																			: undefined
																}
															/>
															<p className="text-xs text-muted-foreground">
																{formatCurrency(absBalance, currency)} /{" "}
																{formatCurrency(budget!, currency)}
																{isIncome && overBudget && " · target reached"}
															</p>
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
			)}

			{editTarget && (
				<EditAccountModal
					account={editTarget}
					workspaceId={workspaceId}
					open={!!editTarget}
					onOpenChange={(v) => {
						if (!v) setEditTarget(null);
					}}
				/>
			)}

			<AlertDialog
				open={!!archiveTarget}
				onOpenChange={(v) => {
					if (!v) setArchiveTarget(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive "{archiveTarget?.name}"?</AlertDialogTitle>
						<AlertDialogDescription>
							The account will be hidden from pickers and the dashboard. Its balance history is
							preserved and still counts toward totals. You can restore it from Settings.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={isPending} onClick={handleArchiveConfirm}>
							{isPending ? "Archiving…" : "Archive"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={!!confirmTarget}
				onOpenChange={(v) => {
					if (!v) setConfirmTarget(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete "{confirmTarget?.name}"?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the account and all its transaction entries. This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={isPending}
							onClick={handleDeleteConfirm}
						>
							{isPending ? "Deleting…" : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
