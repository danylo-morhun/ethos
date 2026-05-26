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
} from '@ethos/ui';
import { getAccounts } from '@/actions/getAccounts';
import { createTransaction } from '@/actions/createTransaction';

const formSchema = z.object({
  description: z.string().min(1, 'Description required'),
  amount: z.number({ error: 'Amount required' }).positive('Amount must be positive'),
  date: z.string().min(1, 'Date required'),
  fromAccountId: z.string().min(1, 'Select an account'),
  toAccountId: z.string().min(1, 'Select an account'),
});

type FormValues = z.infer<typeof formSchema>;
type Account = Awaited<ReturnType<typeof getAccounts>>[number];

export function AddTransactionModal({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [success, setSuccess] = React.useState(false);
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
      description: '',
      date: new Date().toISOString().slice(0, 10),
      fromAccountId: '',
      toAccountId: '',
    },
  });

  React.useEffect(() => {
    if (open) getAccounts(workspaceId).then(setAccounts);
  }, [open, workspaceId]);

  const onOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      reset();
      setSuccess(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    await createTransaction({ workspaceId, ...values });
    setSuccess(true);
    router.refresh();
    setTimeout(() => setOpen(false), 1200);
  };

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
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g. Grocery run"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-destructive text-[0.8rem]">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-destructive text-[0.8rem]">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && (
                <p className="text-destructive text-[0.8rem]">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>From Account</Label>
              <Controller
                control={control}
                name="fromAccountId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.fromAccountId && (
                <p className="text-destructive text-[0.8rem]">{errors.fromAccountId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>To Account</Label>
              <Controller
                control={control}
                name="toAccountId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.toAccountId && (
                <p className="text-destructive text-[0.8rem]">{errors.toAccountId.message}</p>
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
