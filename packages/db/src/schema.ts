import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const accountTypeEnum = pgEnum('account_type', [
  'ASSET',
  'LIABILITY',
  'INCOME',
  'EXPENSE',
]);

// ─── Auth.js tables ──────────────────────────────────────────────────────────

export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
});

export const authAccounts = pgTable(
  'auth_accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const authSessions = pgTable('auth_sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Auth user id — plain text ref, no DB FK (auth is external; avoids cascade issues)
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  baseCurrency: text('base_currency').notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => accounts.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    type: accountTypeEnum('type').notNull(),
    currency: text('currency').notNull(),
    budget: numeric('budget', { precision: 19, scale: 4 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('accounts_workspace_id_idx').on(t.workspaceId)],
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('transactions_workspace_id_idx').on(t.workspaceId)],
);

export const transactionEntries = pgTable(
  'transaction_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id),
    amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
    currency: text('currency').notNull(),
    // Amount converted to workspace base currency; sum per transaction must = 0
    baseAmount: numeric('base_amount', { precision: 19, scale: 4 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('transaction_entries_transaction_id_idx').on(t.transactionId),
    index('transaction_entries_account_id_idx').on(t.accountId),
  ],
);

// Cached historical exchange rates — fetched once per (date, pair) and reused
export const exchangeRates = pgTable(
  'exchange_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(),
    fromCurrency: text('from_currency').notNull(),
    toCurrency: text('to_currency').notNull(),
    // scale 8 preserves precision for minor currency pairs (e.g., JPY/BTC)
    rate: numeric('rate', { precision: 19, scale: 8 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('exchange_rates_date_pair_idx').on(t.date, t.fromCurrency, t.toCurrency),
  ],
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const authUsersRelations = relations(authUsers, ({ many }) => ({
  workspaces: many(workspaces),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [workspaces.userId],
    references: [authUsers.id],
  }),
  accounts: many(accounts),
  transactions: many(transactions),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [accounts.workspaceId],
    references: [workspaces.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
    relationName: 'account_children',
  }),
  children: many(accounts, { relationName: 'account_children' }),
  transactionEntries: many(transactionEntries),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [transactions.workspaceId],
    references: [workspaces.id],
  }),
  entries: many(transactionEntries),
}));

export const transactionEntriesRelations = relations(transactionEntries, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionEntries.transactionId],
    references: [transactions.id],
  }),
  account: one(accounts, {
    fields: [transactionEntries.accountId],
    references: [accounts.id],
  }),
}));
