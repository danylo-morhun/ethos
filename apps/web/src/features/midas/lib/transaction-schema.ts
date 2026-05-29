import { z } from 'zod';
import { CURRENCIES } from './constants';

const baseFields = {
  description: z.string().optional(),
  amount: z.number({ error: 'Amount required' }).positive('Amount must be positive'),
  currency: z.enum(CURRENCIES),
  date: z.string().min(1, 'Date required'),
};

export const expenseSchema = z.object({
  ...baseFields,
  txType: z.literal('expense'),
  walletId: z.string().min(1, 'Select a wallet'),
  categoryId: z.string().min(1, 'Select a category'),
});

export const incomeSchema = z.object({
  ...baseFields,
  txType: z.literal('income'),
  categoryId: z.string().min(1, 'Select a category'),
  walletId: z.string().min(1, 'Select a wallet'),
});

export const transferSchema = z.object({
  ...baseFields,
  txType: z.literal('transfer'),
  fromWalletId: z.string().min(1, 'Select from wallet'),
  toWalletId: z.string().min(1, 'Select to wallet'),
});

export const transactionFormSchema = z.discriminatedUnion('txType', [
  expenseSchema,
  incomeSchema,
  transferSchema,
]);

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
export type TxType = 'expense' | 'income' | 'transfer';
