"use client";

import { parseLocal } from "@/features/midas/lib/dates";
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from "@ethos/ui";
import { Calendar01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	endOfMonth,
	endOfYear,
	format,
	startOfMonth,
	startOfYear,
	subDays,
	subMonths,
} from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface Props {
	from: string | undefined;
	to: string | undefined;
}

function fmt(d: Date) {
	return format(d, "yyyy-MM-dd");
}

const PRESETS = [
	{
		label: "This month",
		range: () => {
			const today = new Date();
			return [fmt(startOfMonth(today)), fmt(endOfMonth(today))] as const;
		},
	},
	{
		label: "Last month",
		range: () => {
			const last = subMonths(new Date(), 1);
			return [fmt(startOfMonth(last)), fmt(endOfMonth(last))] as const;
		},
	},
	{
		label: "Last 3 months",
		range: () => {
			const today = new Date();
			return [fmt(startOfMonth(subMonths(today, 2))), fmt(endOfMonth(today))] as const;
		},
	},
	{
		label: "This year",
		range: () => {
			const today = new Date();
			return [fmt(startOfYear(today)), fmt(endOfYear(today))] as const;
		},
	},
] as const;

function DateButton({
	value,
	placeholder,
	onChange,
}: {
	value: string | undefined;
	placeholder: string;
	onChange: (v: string) => void;
}) {
	const [open, setOpen] = React.useState(false);
	const date = value ? parseLocal(value) : undefined;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" className="w-full justify-start gap-2 font-normal sm:w-36">
					<HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 shrink-0 opacity-50" />
					{date ? (
						format(date, "MMM d, yyyy")
					) : (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					onSelect={(d) => {
						if (d) {
							onChange(fmt(d));
							setOpen(false);
						}
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

function isPresetActive(label: string, from: string | undefined, to: string | undefined): boolean {
	const preset = PRESETS.find((p) => p.label === label);
	if (!preset) return false;
	const [pFrom, pTo] = preset.range();
	return from === pFrom && to === pTo;
}

export function DateRangePicker({ from, to }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [localFrom, setLocalFrom] = React.useState(from);
	const [localTo, setLocalTo] = React.useState(to);

	React.useEffect(() => {
		setLocalFrom(from);
	}, [from]);
	React.useEffect(() => {
		setLocalTo(to);
	}, [to]);

	function push(f: string | undefined, t: string | undefined) {
		const [safeFrom, safeTo] = f && t && f > t ? [t, f] : [f, t];
		setLocalFrom(safeFrom);
		setLocalTo(safeTo);
		const params = new URLSearchParams(searchParams.toString());
		if (safeFrom) params.set("from", safeFrom);
		else params.delete("from");
		if (safeTo) params.set("to", safeTo);
		else params.delete("to");
		params.delete("page");
		const qs = params.toString();
		router.push(qs ? `?${qs}` : "?");
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-1">
				{PRESETS.map((p) => (
					<Button
						key={p.label}
						variant={isPresetActive(p.label, localFrom, localTo) ? "secondary" : "ghost"}
						size="sm"
						className="h-7 px-2 text-xs"
						onClick={() => {
							const [f, t] = p.range();
							push(f, t);
						}}
					>
						{p.label}
					</Button>
				))}
				{(localFrom || localTo) && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-xs text-muted-foreground"
						onClick={() => push(undefined, undefined)}
					>
						All time
					</Button>
				)}
			</div>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<DateButton value={localFrom} placeholder="Start date" onChange={(f) => push(f, localTo)} />
				<span className="hidden text-sm text-muted-foreground sm:block">–</span>
				<DateButton value={localTo} placeholder="End date" onChange={(t) => push(localFrom, t)} />
				{(localFrom || localTo) && (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0 self-start sm:self-auto"
						onClick={() => push(undefined, undefined)}
						aria-label="Clear date filter"
					>
						<HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
