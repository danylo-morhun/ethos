'use client';

import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ethos/ui';

interface Props {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

function buildOptions(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, i);
    return {
      value: `${format(startOfMonth(d), 'yyyy-MM-dd')}_${format(endOfMonth(d), 'yyyy-MM-dd')}`,
      label: format(d, 'MMMM yyyy'),
    };
  });
}

export function MonthPicker({ from, to }: Props) {
  const router = useRouter();
  const options = buildOptions();

  return (
    <Select
      value={`${from}_${to}`}
      onValueChange={(v) => {
        const [f, t] = v.split('_');
        router.push(`?from=${f}&to=${t}`);
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
