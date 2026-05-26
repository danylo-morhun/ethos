import { Card, CardContent, CardHeader, CardTitle } from '@ethos/ui';
import type { AccountBalance } from '@/actions/getBalances';

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Assets',
  LIABILITY: 'Liabilities',
  INCOME: 'Income',
  EXPENSE: 'Expenses',
};

const TYPE_ORDER = ['ASSET', 'INCOME', 'EXPENSE', 'LIABILITY'];

function fmt(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(Number(amount)));
}

function totalLabel(type: string, balances: AccountBalance[], currency: string) {
  const sum = balances.reduce((acc, b) => acc + Number(b.balance), 0);
  return fmt(String(sum), currency);
}

interface Props {
  balances: AccountBalance[];
  currency: string;
}

export function AccountsOverview({ balances, currency }: Props) {
  const grouped = TYPE_ORDER.reduce<Record<string, AccountBalance[]>>((acc, type) => {
    acc[type] = balances.filter((b) => b.type === type);
    return acc;
  }, {});

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Accounts</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TYPE_ORDER.map((type) => {
          const group = grouped[type] ?? [];
          const sum = group.reduce((acc, b) => acc + Number(b.balance), 0);
          const displaySum = fmt(String(Math.abs(sum)), currency);

          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {TYPE_LABELS[type]}
                </CardTitle>
                <p className="text-2xl font-bold">{displaySum}</p>
              </CardHeader>
              <CardContent>
                {group.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No accounts</p>
                ) : (
                  <ul className="space-y-1">
                    {group.map((b) => (
                      <li key={b.accountId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{b.name}</span>
                        <span
                          className={
                            Number(b.balance) < 0
                              ? 'font-medium text-red-500'
                              : 'font-medium text-foreground'
                          }
                        >
                          {fmt(b.balance, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
