# Midas Polish Plan

Priority scale: **P0** = bug / data integrity | **P1** = high value | **P2** = nice to have
Status: ✅ done | 🔜 todo | ⏭ skipped (intentional)

---

## Bugs

| # | Status | Where | Issue |
|---|--------|-------|-------|
| B1 | ✅ | `DateRangePicker` | Changing date was resetting `account` URL param |
| B2 | ✅ | `AddTransactionModal` | `setTimeout` without cleanup — removed, now uses toast + immediate close |
| B3 | ✅ | `getBalances` | No auth check — added session + ownership guard |
| B4 | ✅ | `getMonthlyTrends` | No auth check — added session + ownership guard |
| B5 | ✅ | `createTransaction` | Threw on error — now returns `{ error }` consistent with other mutations |
| B6 | ✅ | `DateRangePicker` | Swaps `from`/`to` silently when inverted (acceptable UX, no toast needed) |
| B7 | ✅ | `page.tsx` | Cross-validate `from <= to` in searchParams, auto-swap if inverted |

---

## Code Quality

| # | Status | Where | Fix |
|---|--------|-------|-----|
| C1 | ✅ | `AccountsOverview` | Removed unused `byId` map in `sortWithChildren` |
| C2 | ✅ | Both modals | `CURRENCIES` + `toCurrency` extracted to `lib/constants.ts` |
| C3 | ⏭ | Both modals | `as never` casts — TS limitation with discriminated unions + RHF, no clean fix |
| C4 | ✅ | Both modals | `AccountSelect` extracted to `components/AccountSelect.tsx` |
| C5 | ✅ | Both modals | Schemas extracted to `lib/transaction-schema.ts` |
| C6 | ✅ | `TrendChart` | Now respects date filter via `from`/`to` params |
| C7 | ✅ | `getMonthlyTrends` | Accepts optional `from`/`to`, falls back to `months` cutoff |
| C8 | ✅ | `transactions.ts` | `getExchangeRate` moved to `lib/exchange-rates.ts` |
| C9 | ⏭ | `balances.ts` | Raw SQL refactor — works correctly, risk > benefit |
| C10 | ⏭ | `AddTransactionModal` | `isSubmitting` from RHF is sufficient, `useTransition` not needed here |
| C11 | ✅ | `accounts.ts` | `createAccount` now accepts optional `currency` param |
| C12 | ✅ | `page.tsx` | `getMonthlyTrends` now receives `from`/`to` from page |

---

## UX / UI

| # | Status | Area | Fix |
|---|--------|------|-----|
| U1  | ✅ | Transaction table | Dates formatted as `MMM d` / `MMM d, yyyy` |
| U2  | ✅ | Transaction table | Search via `?q=` URL param + `ilike` on description |
| U3  | ✅ | Transaction table | Date column sorting via `?sort=&dir=` URL params |
| U4  | ✅ | Transaction table | Total count + "Page X of Y" in pagination |
| U5  | ✅ | AddTransactionModal | `toast.success` + immediate close, removed success animation |
| U6  | ✅ | AddTransactionModal | Description optional (removed `min(1)` validation) |
| U7  | ✅ | DateRangePicker | Preset buttons: This month / Last month / Last 3 months / This year |
| U8  | ✅ | TrendChart | 3M / 6M / 1Y selector on chart card (hidden when date filter active) |
| U9  | ✅ | Charts | % legend below expense and income pie charts |
| U10 | ✅ | Summary cards | "All time P&L" when no filter, "Cashflow" when period active |
| U11 | ✅ | Transaction table | Contextual empty state (shows search query if present) |
| U12 | ✅ | Transaction table | Hover hint + `title` attribute on account filter buttons |
| U13 | ✅ | Accounts | Budget/target support for INCOME accounts (green when exceeded) |
| U14 | ✅ | Header | Removed redundant email, kept workspace name + Settings link |
| U15 | 🔜 | Mobile | DateRangePicker cramped on mobile — needs combined range picker |
| U16 | ✅ | Transaction table | Multi-currency: original amount + `≈ base` on separate muted line |
| U17 | ✅ | AccountsOverview | Account names are now links to detail page |

---

## Features P1

| # | Status | Feature |
|---|--------|---------|
| F1 | ✅ | **Settings page** `/midas/settings` — workspace name edit, accounts management |
| F2 | ✅ | **Date presets** — This month / Last month / Last 3 months / This year |
| F3 | ✅ | **Transaction search** — `?q=` URL param, `ilike` on description |
| F4 | ✅ | **CSV export** — server action + download button in table header |
| F5 | ✅ | **TrendChart period selector** — 3M / 6M / 1Y stored in `?trend=` |
| F6 | ✅ | **Net worth history chart** — line chart using `generate_series` per-month snapshot |
| F7 | ✅ | **Description optional** — removed `min(1)` in both modals + updated action signatures |
| F8 | ✅ | **Savings rate card** — third summary card, `(income − expenses) / income × 100%` |
| F16 | ✅ | **Income breakdown chart** — pie chart mirroring ExpenseChart |

---

## Features P2 — Phase 6 (TODO)

| # | Status | Feature | Notes |
|---|--------|---------|-------|
| F9  | 🔜 | **Recurring transactions** | New `recurringTransactions` table. `frequency` enum (daily/weekly/monthly/yearly), `nextDate`, `endDate`. Cron or on-demand generation. |
| F10 | 🔜 | **Transaction tags** | New `transactionTags` table + `tagsOnTransactions` join. Filter by tag in table (`?tag=`). |
| F11 | 🔜 | **Multi-currency accounts** | Account has own currency (schema already supports it, `createAccount` now accepts currency param). Show native balance + base equivalent in AccountsOverview. |
| F12 | 🔜 | **Bulk operations** | Checkbox column in TransactionTable → bulk delete + bulk recategorize. New `deleteTransactions(ids[])` action. |
| F13 | 🔜 | **Account archiving** | Add `archivedAt` column to `accounts`. Archived accounts hidden from pickers, balances still count. Archive/unarchive in settings and account detail. |
| F14 | 🔜 | **Transaction split** | One transaction → multiple category entries. Requires AddTransactionModal rework: "add split" button that adds extra category rows. Backend: still double-entry, just more entries. |
| F15 | 🔜 | **Keyboard shortcut** | `N` key opens AddTransactionModal when focus not in input/textarea. Simple `keydown` listener in a client layout wrapper. |

---

## Settings Page — `/midas/settings` ✅ implemented

Current state:
- Workspace name editable via `updateWorkspace` action
- Base currency shown read-only (change not yet supported — would require recalculating all `baseAmount` values)
- Accounts section reuses `AccountsOverview` with all edit/delete/add functionality

Still TODO:
- Account reorder (needs `sortOrder` column + migration)
- Account archiving (needs `archivedAt` column + migration — F13)
- Display preferences (date format, week start) — needs `userSettings` table

---

## Account Detail Page — `/midas/accounts/[id]` ✅ implemented

Route: `app/(apps)/midas/accounts/[id]/page.tsx`

What's there:
- Header: name, type badge, balance, edit button (`AccountEditButton` wrapper)
- Budget/target progress bar (EXPENSE + INCOME accounts)
- Monthly activity chart (`AccountActivityChart` — bar chart, credit/debit per month)
- Sub-accounts list with links to their own detail pages
- Full `TransactionTable` filtered to this account (with search, sort, pagination, export)
- Back link to dashboard

Clicking account name in `AccountsOverview` navigates here.

Still TODO:
- Danger zone: delete + archive buttons (currently only via AccountsOverview dropdown)

---

## Onboarding / Empty State ✅ implemented

`OnboardingCard` shown when `accounts.length === 0` instead of charts.
3-step flow: Add wallet → Add categories → Record transaction.
Step indicator auto-advances based on account count.

---

## Period Comparison 🔜 not started

Show `+12%` / `−8%` delta badge on SummaryCards vs previous equivalent period.
Requires calling `getBalances` twice (current + previous period) in `page.tsx`.

---

## Implementation Status

```
Phase 1 — Bugs & quality       ✅ 8 commits
Phase 2 — UX quick wins        ✅ 3 commits
Phase 3 — Features P1          ✅ 7 commits
Phase 4 — Settings & pages     ✅ 1 commit
Phase 5 — UX depth             ✅ 6 commits
                               ──────────
Total                          26 commits, HEAD: 614c466

Phase 6 — Features P2          🔜 next
  Priority order: F15 (keyboard shortcut, trivial)
                  F11 (multi-currency accounts, schema ready)
                  F13 (account archiving, needs migration)
                  F12 (bulk operations)
                  F10 (transaction tags, needs migration)
                  F9  (recurring transactions, needs migration)
                  F14 (transaction split, largest UI change)
  Also remaining: U15 (mobile DateRangePicker)
                  Period comparison on SummaryCards
```

---

## New Files Created (Phase 1–5)

```
apps/web/src/features/midas/
  lib/
    constants.ts              — CURRENCIES, Currency type, toCurrency()
    transaction-schema.ts     — shared Zod schemas for transaction form
    exchange-rates.ts         — getExchangeRate() utility
  components/
    AccountSelect.tsx         — shared account picker for modals
    AccountActivityChart.tsx  — bar chart for account detail page
    AccountEditButton.tsx     — client wrapper for EditAccountModal in RSC context
    NetWorthChart.tsx         — line chart: ASSET-LIABILITY per month
    IncomeChart.tsx           — pie chart: income sources breakdown
    OnboardingCard.tsx        — guided setup for new workspaces
    WorkspaceSettingsForm.tsx — client form for workspace name edit
  actions/
    export.ts                 — exportTransactionsCsv server action
    net-worth.ts              — getNetWorthHistory server action
    account-detail.ts         — getAccountDetail, getAccountActivity, getSubAccounts

apps/web/src/app/(apps)/midas/
  settings/page.tsx           — /midas/settings RSC
  accounts/[id]/page.tsx      — /midas/accounts/[id] RSC
```

---

## Handoff — For Next Chat

**Current branch:** `main`, HEAD `614c466`

**Stack reminders:**
- Monorepo: Turborepo + pnpm. Dev: `pnpm dev` from root
- DB migrations: `pnpm -F @ethos/db generate` then `pnpm -F @ethos/db migrate`
- Lint: `pnpm biome check --apply .` (Biome only, no ESLint/Prettier)
- Typecheck: run from `apps/web/`: `pnpm tsc --noEmit`
- Commit style: Conventional Commits, atomic, subject-only, more commits = better
- No raw SQL — Drizzle Relational API only
- State: URL params + `useTransition` — no Zustand/TanStack Query

**Key invariants:**
- Every `Transaction` has ≥2 `TransactionEntry` rows, `sum(baseAmount) = 0`
- Auth check in every server action: session + `workspace.userId === session.user.id`
- `createAccount` currency defaults to `workspace.baseCurrency` if not passed
- Exchange rates: Frankfurter `/YYYY-MM-DD` endpoint, cached in `exchangeRates` table

**Phase 6 start point — recommended order:**
1. **F15** (keyboard shortcut `N`) — ~20 lines, no DB change
2. **F11** (multi-currency accounts) — schema already has `currency` col on `accounts`, `createAccount` already accepts currency param; just need UI in Add/EditAccountModal + AccountsOverview display
3. **F13** (account archiving) — needs `archivedAt timestamptz` column migration on `accounts`; hide from pickers, show in settings with restore option
4. **F12** (bulk delete) — checkbox col in TransactionTable, new `deleteTransactions(ids[])` action
5. **F10** (transaction tags) — needs `tags` + `transaction_tags` tables migration
6. **F9** (recurring transactions) — needs `recurring_transactions` table, most complex
7. **F14** (transaction split) — largest UI change, rework AddTransactionModal
8. **U15** (mobile DateRangePicker) — CSS/UX only, no DB
9. **Period comparison** — call `getBalances` twice in page.tsx, compute delta in RSC
