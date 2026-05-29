"use client";

import { buildPeriodLabel, parseLocal } from "@/features/midas/lib/dates";
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, Separator, cn } from "@ethos/ui";
import { Calendar01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	endOfMonth,
	endOfYear,
	format,
	startOfMonth,
	startOfYear,
	subMonths,
} from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface Props {
	from: string | undefined;
	to: string | undefined;
	isAllTime?: boolean;
}

function fmt(d: Date) {
	return format(d, "yyyy-MM-dd");
}

const PRESETS = [
	{
		label: "This month",
		range: () => {
			const t = new Date();
			return [fmt(startOfMonth(t)), fmt(endOfMonth(t))] as const;
		},
	},
	{
		label: "Last month",
		range: () => {
			const l = subMonths(new Date(), 1);
			return [fmt(startOfMonth(l)), fmt(endOfMonth(l))] as const;
		},
	},
	{
		label: "Last 3 months",
		range: () => {
			const t = new Date();
			return [fmt(startOfMonth(subMonths(t, 2))), fmt(endOfMonth(t))] as const;
		},
	},
	{
		label: "This year",
		range: () => {
			const t = new Date();
			return [fmt(startOfYear(t)), fmt(endOfYear(t))] as const;
		},
	},
] as const;

export function DateRangePicker({ from, to, isAllTime = false }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [open, setOpen] = React.useState(false);
	const [localFrom, setLocalFrom] = React.useState(from);
	const [localTo, setLocalTo] = React.useState(to);

	React.useEffect(() => { setLocalFrom(from); }, [from]);
	React.useEffect(() => { setLocalTo(to); }, [to]);

	function push(f: string | undefined, t: string | undefined, allTime = false) {
		const [safeFrom, safeTo] = f && t && f > t ? [t, f] : [f, t];
		setLocalFrom(safeFrom);
		setLocalTo(safeTo);
		const params = new URLSearchParams(searchParams.toString());
		if (allTime) {
			params.delete("from");
			params.delete("to");
			params.set("all", "1");
		} else {
			params.delete("all");
			if (safeFrom) params.set("from", safeFrom);
			else params.delete("from");
			if (safeTo) params.set("to", safeTo);
			else params.delete("to");
		}
		params.delete("page");
		const qs = params.toString();
		router.push(qs ? `?${qs}` : "?");
	}

	function handleOpenChange(v: boolean) {
		if (!v) {
			// Abandon partial selection — reset to committed URL state
			setLocalFrom(from);
			setLocalTo(to);
		}
		setOpen(v);
	}

	const label = buildPeriodLabel(localFrom, localTo, isAllTime);
	const hasFilter = localFrom || localTo || isAllTime;

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button variant="outline" className="gap-2 font-normal">
					<HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 shrink-0 opacity-50" />
					{label}
					{hasFilter && (
						<span
							role="button"
							aria-label="Clear date filter"
							className="ml-1 rounded opacity-50 hover:opacity-100"
							onClick={(e) => {
								e.stopPropagation();
								push(undefined, undefined);
							}}
						>
							<HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="end">
				<div className="flex">
					{/* Presets column */}
					<div className="flex flex-col gap-1 border-r p-3 min-w-[140px]">
						<p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Presets</p>
						{PRESETS.map((p) => {
							const [pf, pt] = p.range();
							const active = !isAllTime && localFrom === pf && localTo === pt;
							return (
								<Button
									key={p.label}
									variant={active ? "secondary" : "ghost"}
									size="sm"
									className="justify-start"
									onClick={() => {
										push(pf, pt);
										setOpen(false);
									}}
								>
									{p.label}
								</Button>
							);
						})}
						<Separator className="my-1" />
						<Button
							variant={isAllTime ? "secondary" : "ghost"}
							size="sm"
							className="justify-start"
							onClick={() => {
								push(undefined, undefined, true);
								setOpen(false);
							}}
						>
							All time
						</Button>
					</div>

					{/* Custom range column */}
					<div className="flex flex-col p-3">
						<p className="mb-2 text-xs font-medium text-muted-foreground">Custom range</p>
						<div className="mb-3 flex items-center gap-2">
							<span
								className={cn(
									"rounded px-2 py-1 text-sm",
									localFrom ? "bg-muted text-foreground" : "text-muted-foreground",
								)}
							>
								{localFrom ? format(parseLocal(localFrom), "MMM d, yyyy") : "Start date"}
							</span>
							<span className="text-xs text-muted-foreground">–</span>
							<span
								className={cn(
									"rounded px-2 py-1 text-sm",
									localTo ? "bg-muted text-foreground" : "text-muted-foreground",
								)}
							>
								{localTo ? format(parseLocal(localTo), "MMM d, yyyy") : "End date"}
							</span>
						</div>
						<Calendar
							mode="range"
							selected={{
								from: localFrom ? parseLocal(localFrom) : undefined,
								to: localTo ? parseLocal(localTo) : undefined,
							}}
							defaultMonth={localFrom ? parseLocal(localFrom) : undefined}
							onSelect={(range) => {
								if (!range) return;
								const f = range.from ? fmt(range.from) : undefined;
								const t = range.to ? fmt(range.to) : undefined;
								setLocalFrom(f);
								setLocalTo(t);
								if (f && t) {
									push(f, t);
									setOpen(false);
								}
							}}
							initialFocus
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
