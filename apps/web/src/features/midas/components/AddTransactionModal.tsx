'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { AccountSelect } from '@/features/midas/components/AccountSelect';
import { CURRENCIES, toCurrency } from '@/features/midas/lib/constants';
import {
  transactionFormSchema,
  type TransactionFormValues,
  type TxType,
} from '@/features/midas/lib/transaction-schema';

type Account = Awaited<ReturnType<typeof getAccounts>>[number];

export function AddTransactionModal({
  workspaceId,
  baseCurrency,
}: {
  workspaceId: string;
  baseCurrency: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [txType, setTxType] = React.useState<TxType>('expense');
  const router = useRouter();

  const defaultCurrency = toCurrency(baseCurrency);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      txType: 'expense',
      description: undefined,
      amount: undefined,
      currency: defaultCurrency,
      date: new Date().toISOString().slice(0, 10),
      walletId: '',
      categoryId: '',
    } as unknown as TransactionFormValues,
  });

  React.useEffect(() => {
    if (open) getAccounts(workspaceId).then(setAccounts);
  }, [open, workspaceId]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (open) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const onOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      reset({
        txType: 'expense',
        description: undefined,
        currency: defaultCurrency,
        date: new Date().toISOString().slice(0, 10),
        walletId: '',
        categoryId: '',
      } as unknown as TransactionFormValues);
      setTxType('expense');
    }
  };

  const handleTabChange = (val: string) => {
    const next = val as TxType;
    setTxType(next);
    const base = { description: undefined, currency: defaultCurrency, date: new Date().toISOString().slice(0, 10) };
    if (next === 'expense') reset({ ...base, txType: 'expense', walletId: '', categoryId: '' } as unknown as TransactionFormValues);
    else if (next === 'income') reset({ ...base, txType: 'income', categoryId: '', walletId: '' } as unknown as TransactionFormValues);
    else reset({ ...base, txType: 'transfer', fromWalletId: '', toWalletId: '' } as unknown as TransactionFormValues);
  };

  const onSubmit = async (values: TransactionFormValues) => {
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

    const result = await createTransaction({
      workspaceId,
      fromAccountId,
      toAccountId,
      amount: values.amount,
      currency: values.currency,
      description: values.description,
      date: values.date,
    });

    if ('error' in result) {
      toast.error(result.error);
      return;
    }

    toast.success('Transaction recorded.');
    router.refresh();
    setOpen(false);
  };

  const wallets = accounts.filter((a) => a.type === 'ASSET' || a.type === 'LIABILITY');
  const expenseCategories = accounts.filter((a) => a.type === 'EXPENSE');
  const incomeCategories = accounts.filter((a) => a.type === 'INCOME');
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
                <AccountSelect control={control} name="walletId" accounts={wallets} placeholder="Select wallet" error={errs.walletId?.message} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <AccountSelect control={control} name="categoryId" accounts={expenseCategories} placeholder="Select expense category" error={errs.categoryId?.message} />
              </div>
            </TabsContent>

            <TabsContent value="income" className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <AccountSelect control={control} name="categoryId" accounts={incomeCategories} placeholder="Select income category" error={errs.categoryId?.message} />
              </div>
              <div className="space-y-2">
                <Label>Wallet</Label>
                <AccountSelect control={control} name="walletId" accounts={wallets} placeholder="Select wallet" error={errs.walletId?.message} />
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-4">
              <div className="space-y-2">
                <Label>From Wallet</Label>
                <AccountSelect control={control} name="fromWalletId" accounts={wallets} placeholder="Select source wallet" error={errs.fromWalletId?.message} />
              </div>
              <div className="space-y-2">
                <Label>To Wallet</Label>
                <AccountSelect control={control} name="toWalletId" accounts={wallets} placeholder="Select destination wallet" error={errs.toWalletId?.message} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="e.g. Grocery run" {...register('description')} />
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
      </DialogContent>
    </Dialog>
  );
}
