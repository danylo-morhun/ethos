'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { updateTransaction } from '@/features/midas/actions/transactions';
import type { RecentTransaction } from '@/features/midas/actions/transactions';

type TxType = 'expense' | 'income' | 'transfer';

const CURRENCIES = ['PLN', 'EUR', 'USD', 'CHF', 'GBP'] as const;
type Currency = (typeof CURRENCIES)[number];

function toCurrency(c: string): Currency {
  return (CURRENCIES as readonly string[]).includes(c) ? (c as Currency) : 'PLN';
}

function inferTxType(txn: RecentTransaction): TxType {
  if (txn.toAccountType === 'EXPENSE') return 'expense';
  if (txn.fromAccountType === 'INCOME') return 'income';
  return 'transfer';
}

const baseFields = {
  description: z.string().min(1, 'Description required'),
  amount: z.number({ error: 'Amount required' }).positive('Amount must be positive'),
  currency: z.enum(CURRENCIES),
  date: z.string().min(1, 'Date required'),
};

const expenseSchema = z.object({ ...baseFields, txType: z.literal('expense'), walletId: z.string().min(1), categoryId: z.string().min(1) });
const incomeSchema  = z.object({ ...baseFields, txType: z.literal('income'),  categoryId: z.string().min(1), walletId: z.string().min(1) });
const transferSchema = z.object({ ...baseFields, txType: z.literal('transfer'), fromWalletId: z.string().min(1), toWalletId: z.string().min(1) });

const formSchema = z.discriminatedUnion('txType', [expenseSchema, incomeSchema, transferSchema]);
type FormValues = z.infer<typeof formSchema>;
type Account = Awaited<ReturnType<typeof getAccounts>>[number];

function AccountSelect({
  control, name, accounts, placeholder, error,
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
            <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-destructive text-[0.8rem]">{error}</p>}
        </>
      )}
    />
  );
}

interface Props {
  transaction: RecentTransaction;
  workspaceId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function EditTransactionModal({ transaction, workspaceId, open, onOpenChange }: Props) {
  const router = useRouter();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [txType, setTxType] = React.useState<TxType>(() => inferTxType(transaction));

  const wallets = accounts.filter((a) => a.type === 'ASSET' || a.type === 'LIABILITY');
  const expenseCategories = accounts.filter((a) => a.type === 'EXPENSE');
  const incomeCategories = accounts.filter((a) => a.type === 'INCOME');

  function buildDefaults(type: TxType, txn: RecentTransaction): FormValues {
    const base = {
      description: txn.description ?? '',
      amount: Math.abs(Number(txn.amount)),
      currency: toCurrency(txn.currency),
      date: txn.date,
    };
    if (type === 'expense') return { ...base, txType: 'expense', walletId: txn.fromAccountId, categoryId: txn.toAccountId };
    if (type === 'income')  return { ...base, txType: 'income',  categoryId: txn.fromAccountId, walletId: txn.toAccountId };
    return { ...base, txType: 'transfer', fromWalletId: txn.fromAccountId, toWalletId: txn.toAccountId };
  }

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaults(txType, transaction) as unknown as FormValues,
  });

  React.useEffect(() => {
    if (open) getAccounts(workspaceId).then(setAccounts);
  }, [open, workspaceId]);

  const handleTabChange = (val: string) => {
    const next = val as TxType;
    setTxType(next);
    reset(buildDefaults(next, transaction) as unknown as FormValues);
  };

  const onSubmit = async (values: FormValues) => {
    let fromAccountId: string;
    let toAccountId: string;
    if (values.txType === 'expense') { fromAccountId = values.walletId; toAccountId = values.categoryId; }
    else if (values.txType === 'income') { fromAccountId = values.categoryId; toAccountId = values.walletId; }
    else { fromAccountId = values.fromWalletId; toAccountId = values.toWalletId; }

    const result = await updateTransaction({
      transactionId: transaction.id,
      fromAccountId,
      toAccountId,
      amount: values.amount,
      currency: values.currency,
      description: values.description,
      date: values.date,
    });

    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('Transaction updated.');
      router.refresh();
      onOpenChange(false);
    }
  };

  const errs = errors as Record<string, { message?: string }>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
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
            <Label htmlFor="edit-description">Description</Label>
            <Input id="edit-description" placeholder="e.g. Grocery run" {...register('description')} />
            {errs.description && <p className="text-destructive text-[0.8rem]">{errs.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount</Label>
            <div className="flex gap-2">
              <Input id="edit-amount" type="number" step="0.01" placeholder="0.00" className="flex-1" {...register('amount', { valueAsNumber: true })} />
              <Controller
                control={control}
                name="currency"
                render={({ field }: { field: { onChange: (v: string) => void; value: string } }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? toCurrency(transaction.currency)}>
                    <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {errs.amount && <p className="text-destructive text-[0.8rem]">{errs.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input id="edit-date" type="date" {...register('date')} />
            {errs.date && <p className="text-destructive text-[0.8rem]">{errs.date.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
