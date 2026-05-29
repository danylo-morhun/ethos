'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '@ethos/ui';
import { parseLocal } from '@/features/midas/lib/dates';

interface Props {
  from: string | undefined;
  to: string | undefined;
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
          <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 shrink-0 opacity-50" />
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
  const searchParams = useSearchParams();
  const [localFrom, setLocalFrom] = React.useState(from);
  const [localTo, setLocalTo] = React.useState(to);

  React.useEffect(() => { setLocalFrom(from); }, [from]);
  React.useEffect(() => { setLocalTo(to); }, [to]);

  function push(f: string | undefined, t: string | undefined) {
    const [safeFrom, safeTo] = f && t && f > t ? [t, f] : [f, t];
    setLocalFrom(safeFrom);
    setLocalTo(safeTo);
    const params = new URLSearchParams(searchParams.toString());
    if (safeFrom) params.set('from', safeFrom); else params.delete('from');
    if (safeTo) params.set('to', safeTo); else params.delete('to');
    params.delete('page');
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
          <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
