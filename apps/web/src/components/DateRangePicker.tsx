'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '@ethos/ui';

interface Props {
  from: string | undefined;
  to: string | undefined;
}

function parseLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmt(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

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
        <Button variant="outline" className="w-36 justify-start gap-2 font-normal">
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
          {date ? (
            format(date, 'MMM d, yyyy')
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

export function DateRangePicker({ from, to }: Props) {
  const router = useRouter();
  // Local state prevents stale-closure bug: if the user picks "from" then
  // immediately picks "to" before the server round-trip completes, the second
  // pick would otherwise capture the old `from` prop from its closure.
  const [localFrom, setLocalFrom] = React.useState(from);
  const [localTo, setLocalTo] = React.useState(to);

  // Keep local state in sync when URL-driven props change (e.g. browser back/forward).
  React.useEffect(() => { setLocalFrom(from); }, [from]);
  React.useEffect(() => { setLocalTo(to); }, [to]);

  function push(f: string | undefined, t: string | undefined) {
    setLocalFrom(f);
    setLocalTo(t);
    const params = new URLSearchParams();
    if (f) params.set('from', f);
    if (t) params.set('to', t);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : '?');
  }

  return (
    <div className="flex items-center gap-2">
      <DateButton
        value={localFrom}
        placeholder="Start date"
        onChange={(f) => push(f, localTo)}
      />
      <span className="text-sm text-muted-foreground">–</span>
      <DateButton
        value={localTo}
        placeholder="End date"
        onChange={(t) => push(localFrom, t)}
      />
      {(localFrom || localTo) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => push(undefined, undefined)}
          aria-label="Clear date filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
