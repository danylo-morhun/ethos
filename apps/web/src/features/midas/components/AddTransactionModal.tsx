'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@ethos/ui';
import { getAccounts } from '@/features/midas/actions/accounts';
import { createTransaction } from '@/features/midas/actions/transactions';

type TxType = 'expense' | 'income' | 'transfer';

const CURRENCIES = ['PLN', 'EUR', 'USD', 'CHF', 'GBP'] as const;
type Currency = (typeof CURRENCIES)[number];

function toCurrency(c: string): Currency {
  return (CURRENCIES as readonly string[]).includes(c) ? (c as Currency) : 'PLN';
}

const baseFields = {
  description: z.string().min(1, 'Description required'),
  amount: z.number({ error: 'Amount required' }).positive('Amount must be positive'),
  currency: z.enum(CURRENCIES),
  date: z.string().min(1, 'Date required'),
};

const expenseSchema = z.object({
  ...baseFields,
  txType: z.literal('expense'),
  walletId: z.string().min(1, 'Select a wallet'),
  categoryId: z.string().min(1, 'Select a category'),
});

const incomeSchema = z.object({
  ...baseFields,
  txType: z.literal('income'),
  categoryId: z.string().min(1, 'Select a category'),
  walletId: z.string().min(1, 'Select a wallet'),
});

const transferSchema = z.object({
  ...baseFields,
  txType: z.literal('transfer'),
  fromWalletId: z.string().min(1, 'Select from wallet'),
  toWalletId: z.string().min(1, 'Select to wallet'),
});

const formSchema = z.discriminatedUnion('txType', [expenseSchema, incomeSchema, transferSchema]);

type FormValues = z.infer<typeof formSchema>;
type Account = Awaited<ReturnType<typeof getAccounts>>[number];

const WALLET_TYPES = ['ASSET', 'LIABILITY'] as const;
const EXPENSE_TYPES = ['EXPENSE'] as const;
const INCOME_TYPES = ['INCOME'] as const;

function isWallet(a: Account) {
  return (WALLET_TYPES as readonly string[]).includes(a.type);
}
function isExpenseCategory(a: Account) {
  return (EXPENSE_TYPES as readonly string[]).includes(a.type);
}
function isIncomeCategory(a: Account) {
  return (INCOME_TYPES as readonly string[]).includes(a.type);
}

function AccountSelect({
  control,
  name,
  accounts,
  placeholder,
  error,
}: {
  control: ReturnType<typeof useForm<FormValues>>['control'];
  name: string;
  accounts: Account[];
  placeholder: string;
  error?: string;
}) {
  return (
    <Controller
      control={control as never}
      name={name as never}
      render={({ field }: { field: { onChange: (v: string) => void; value: string } }) => (
        <>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-destructive text-[0.8rem]">{error}</p>}
        </>
      )}
    />
  );
}

export function AddTransactionModal({
  workspaceId,
  baseCurrency,
}: {
  workspaceId: string;
  baseCurrency: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [success, setSuccess] = React.useState(false);
  const [txType, setTxType] = React.useState<TxType>('expense');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      txType: 'expense',
      description: '',
      amount: undefined,
      currency: toCurrency(baseCurrency),
      date: new Date().toISOString().slice(0, 10),
      walletId: '',
      categoryId: '',
    } as unknown as FormValues,
  });

  React.useEffect(() => {
    if (open) getAccounts(workspaceId).then(setAccounts);
  }, [open, workspaceId]);

  const defaultCurrency = toCurrency(baseCurrency);

  const onOpenChange = (val: boolean) => {
    setOpen(val);
    setSuccess(false);
    if (!val) {
      reset({
        txType: 'expense',
        description: '',
        currency: defaultCurrency,
        date: new Date().toISOString().slice(0, 10),
        walletId: '',
        categoryId: '',
      } as unknown as FormValues);
      setTxType('expense');
    }
  };

  const handleTabChange = (val: string) => {
    const next = val as TxType;
    setTxType(next);
    if (next === 'expense') {
      reset({
        txType: 'expense',
        description: '',
        currency: defaultCurrency,
        date: new Date().toISOString().slice(0, 10),
        walletId: '',
        categoryId: '',
      } as unknown as FormValues);
    } else if (next === 'income') {
      reset({
        txType: 'income',
        description: '',
        currency: defaultCurrency,
        date: new Date().toISOString().slice(0, 10),
        categoryId: '',
        walletId: '',
      } as unknown as FormValues);
    } else {
      reset({
        txType: 'transfer',
        description: '',
        currency: defaultCurrency,
        date: new Date().toISOString().slice(0, 10),
        fromWalletId: '',
        toWalletId: '',
      } as unknown as FormValues);
    }
  };

  const onSubmit = async (values: FormValues) => {
    let fromAccountId: string;
    let toAccountId: string;

    if (values.txType === 'expense') {
      fromAccountId = values.walletId;
      toAccountId = values.categoryId;
    } else if (values.txType === 'income') {
      fromAccountId = values.categoryId;
      toAccountId = values.walletId;
    } else {
      fromAccountId = values.fromWalletId;
      toAccountId = values.toWalletId;
    }

    await createTransaction({
      workspaceId,
      fromAccountId,
      toAccountId,
      amount: values.amount,
      currency: values.currency,
      description: values.description,
      date: values.date,
    });
    setSuccess(true);
    router.refresh();
    setTimeout(() => setOpen(false), 1200);
  };

  const wallets = accounts.filter(isWallet);
  const expenseCategories = accounts.filter(isExpenseCategory);
  const incomeCategories = accounts.filter(isIncomeCategory);
  const errs = errors as Record<string, { message?: string }>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>New Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <span className="text-4xl">✓</span>
            <p className="text-sm font-medium">Transaction recorded!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={txType} onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
                <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
                <TabsTrigger value="transfer" className="flex-1">Transfer</TabsTrigger>
              </TabsList>

              <TabsContent value="expense" className="space-y-4">
                <div className="space-y-2">
                  <Label>Wallet</Label>
                  <AccountSelect
                    control={control}
                    name="walletId"
                    accounts={wallets}
                    placeholder="Select wallet"
                    error={errs.walletId?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <AccountSelect
                    control={control}
                    name="categoryId"
                    accounts={expenseCategories}
                    placeholder="Select expense category"
                    error={errs.categoryId?.message}
                  />
                </div>
              </TabsContent>

              <TabsContent value="income" className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <AccountSelect
                    control={control}
                    name="categoryId"
                    accounts={incomeCategories}
                    placeholder="Select income category"
                    error={errs.categoryId?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wallet</Label>
                  <AccountSelect
                    control={control}
                    name="walletId"
                    accounts={wallets}
                    placeholder="Select wallet"
                    error={errs.walletId?.message}
                  />
                </div>
              </TabsContent>

              <TabsContent value="transfer" className="space-y-4">
                <div className="space-y-2">
                  <Label>From Wallet</Label>
                  <AccountSelect
                    control={control}
                    name="fromWalletId"
                    accounts={wallets}
                    placeholder="Select source wallet"
                    error={errs.fromWalletId?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Wallet</Label>
                  <AccountSelect
                    control={control}
                    name="toWalletId"
                    accounts={wallets}
                    placeholder="Select destination wallet"
                    error={errs.toWalletId?.message}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="e.g. Grocery run" {...register('description')} />
              {errs.description && (
                <p className="text-destructive text-[0.8rem]">{errs.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="flex-1"
                  {...register('amount', { valueAsNumber: true })}
                />
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }: { field: { onChange: (v: string) => void; value: string } }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? defaultCurrency}>
                      <SelectTrigger className="w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {errs.amount && (
                <p className="text-destructive text-[0.8rem]">{errs.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} />
              {errs.date && (
                <p className="text-destructive text-[0.8rem]">{errs.date.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
