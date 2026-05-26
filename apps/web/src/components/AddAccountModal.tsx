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
import { createAccount } from '@/actions/createAccount';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'] as const;

const formSchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(ACCOUNT_TYPES, { error: 'Select a type' }),
  parentId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type Account = Awaited<ReturnType<typeof getAccounts>>[number];

export function AddAccountModal({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', type: undefined, parentId: undefined },
  });

  React.useEffect(() => {
    if (open) getAccounts(workspaceId).then(setAccounts);
  }, [open, workspaceId]);

  const onOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) reset();
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await createAccount(
        workspaceId,
        values.name,
        values.type,
        values.parentId || undefined,
      );
      toast.success(`"${values.name}" created`);
      router.refresh();
      setOpen(false);
    } catch {
      toast.error('Failed to create account');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acc-name">Name</Label>
            <Input id="acc-name" placeholder="e.g. Savings" {...register('name')} />
            {errors.name && (
              <p className="text-destructive text-[0.8rem]">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-destructive text-[0.8rem]">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Parent Account (optional)</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
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
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
