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
	// Two-click logic: first click sets "from", second click sets "to"
	const [picking, setPicking] = React.useState<"from" | "to">("from");

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
			setLocalFrom(from);
			setLocalTo(to);
			setPicking("from");
		}
		setOpen(v);
	}

	function handleDayClick(day: Date) {
		const val = fmt(day);
		if (picking === "from") {
			setLocalFrom(val);
			setLocalTo(undefined);
			setPicking("to");
		} else {
			const base = localFrom ?? val;
			const [f, t] = base > val ? [val, base] : [base, val];
			push(f, t);
			setOpen(false);
			setPicking("from");
		}
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
						{/* Date chips — active one has a ring to indicate it's being picked */}
						<div className="mb-3 flex items-center gap-2">
							<span
								className={cn(
									"cursor-pointer rounded-md border px-2 py-1 text-sm transition-colors",
									picking === "from"
										? "border-primary bg-primary/10 text-foreground"
										: localFrom
											? "border-transparent bg-muted text-foreground"
											: "border-transparent text-muted-foreground",
								)}
								onClick={() => setPicking("from")}
							>
								{localFrom ? format(parseLocal(localFrom), "MMM d, yyyy") : "Start date"}
							</span>
							<span className="text-xs text-muted-foreground">–</span>
							<span
								className={cn(
									"cursor-pointer rounded-md border px-2 py-1 text-sm transition-colors",
									picking === "to"
										? "border-primary bg-primary/10 text-foreground"
										: localTo
											? "border-transparent bg-muted text-foreground"
											: "border-transparent text-muted-foreground",
								)}
								onClick={() => setPicking("to")}
							>
								{localTo ? format(parseLocal(localTo), "MMM d, yyyy") : "End date"}
							</span>
						</div>
						{/* mode="range" keeps range highlight CSS; onDayClick overrides selection logic */}
						<Calendar
							mode="range"
							selected={{
								from: localFrom ? parseLocal(localFrom) : undefined,
								to: localTo ? parseLocal(localTo) : undefined,
							}}
							defaultMonth={localFrom ? parseLocal(localFrom) : undefined}
							onSelect={() => {}}
							onDayClick={handleDayClick}
							initialFocus
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
