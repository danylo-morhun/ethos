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
| U15 | ✅ | Mobile | DateRangePicker cramped on mobile — needs combined range picker |
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

## Features P2 — Phase 6

| # | Status | Feature | Notes |
|---|--------|---------|-------|
| F9  | ✅ | **Recurring transactions** | `frequency` enum (daily/weekly/monthly/yearly), `nextDate`, `endDate`, `isActive`. On-demand generation on page load. Manage in settings (Add/pause/delete). |
| F10 | ✅ | **Transaction tags** | `tags` + `transaction_tags` tables. Tags on Add/EditTransactionModal (inline create). Tag chips on table rows. Filter by `?tag=` URL param. |
| F11 | ✅ | **Multi-currency accounts** | Currency picker in Add/EditAccountModal; native + `≈ base` balance display in AccountsOverview. `nativeBalance` added to `getBalances`. |
| F12 | ✅ | **Bulk delete** | Checkbox column (shadcn `Checkbox`) + `deleteTransactions(ids[])` action + bulk delete confirmation. |
| F13 | ✅ | **Account archiving** | `archivedAt` column, archive/unarchive actions, Archive in dropdown, Restore in Settings page. Hidden from pickers + overview; balances still count in SummaryCards. |
| F14 | ✅ | **Transaction split** | One transaction → multiple category entries. Requires AddTransactionModal rework: "add split" button that adds extra category rows. Backend: still double-entry, just more entries per side. |
| F15 | ✅ | **Keyboard shortcut** | `N` key opens AddTransactionModal when focus not in input/textarea. |

---

## Settings Page — `/midas/settings` ✅ implemented

Current state:
- Workspace name editable via `updateWorkspace` action
- Base currency shown read-only (change not yet supported — would require recalculating all `baseAmount` values)
- Accounts section: full `AccountsOverview` with edit/delete/archive/add + currency picker
- Archived accounts section: restore button for each
- Recurring transactions section: list with pause/resume/delete + AddRecurringModal

Still TODO:
- Account reorder (needs `sortOrder` column + migration)
- Display preferences (date format, week start) — needs `userSettings` table
- Danger zone: delete + archive buttons on Account Detail page (currently only via AccountsOverview dropdown)

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

---

## Onboarding / Empty State ✅ implemented

`OnboardingCard` shown when `accounts.length === 0` instead of charts.
3-step flow: Add wallet → Add categories → Record transaction.
Step indicator auto-advances based on account count.

---

## Period Comparison ✅ implemented

`↑ +12%` / `↓ −8%` delta badge on Net Worth and Cashflow SummaryCards vs previous equivalent period.
`getBalances` called twice in `page.tsx` (current + prev). Prev period = same duration, ending day before `from`.

---

## Implementation Status

```
Phase 1 — Bugs & quality       ✅ 8 commits
Phase 2 — UX quick wins        ✅ 3 commits
Phase 3 — Features P1          ✅ 7 commits
Phase 4 — Settings & pages     ✅ 1 commit
Phase 5 — UX depth             ✅ 6 commits
Phase 6 — Features P2          ✅ 10 commits (F15/F11/F13/F12/F10/F9 + Checkbox UI)
Phase 7 — Final polish         ✅ 3 commits (F14 split, U15 mobile, period comparison)
                               ──────────
Total                          39+ commits, HEAD: 6f2ec54

Remaining: nothing — all items complete ✅
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

## New Files Created (Phase 6)

```
apps/web/src/features/midas/
  actions/
    tags.ts       — getTags, createTag, deleteTag, setTransactionTags
    recurring.ts  — getRecurringTransactions, createRecurringTransaction,
                    toggleRecurring, deleteRecurringTransaction, generateDueRecurring
  components/
    TagSelect.tsx                  — inline tag picker with create-on-type
    ArchivedAccountsList.tsx       — restore archived accounts (settings)
    AddRecurringModal.tsx          — create recurring transaction
    RecurringTransactionsList.tsx  — manage recurring (pause/resume/delete)

packages/ui/src/components/
  checkbox.tsx  — shadcn Checkbox (Radix UI, inline SVG checkmark)
```

## DB Schema Changes (Phase 6)

```
accounts         + archivedAt timestamptz (nullable)
tags             id, workspaceId FK, name, color, createdAt
                 UNIQUE(workspaceId, name)
transaction_tags transactionId FK + tagId FK (composite PK, cascade delete)
recurring_transactions
                 id, workspaceId FK, fromAccountId FK, toAccountId FK,
                 amount, currency, description, frequency enum, nextDate date,
                 endDate date (nullable), isActive bool default true,
                 createdAt, updatedAt
```

---

## Handoff — For Next Chat

**Current branch:** `main`, HEAD `3f77912`

**Stack reminders:**
- Monorepo: Turborepo + pnpm. Dev: `pnpm dev` from root
- DB: `pnpm -F @ethos/db db:push` (project uses push, not generate+migrate)
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
- `tags` unique on `(workspaceId, name)` — createTag can return `{ error: 'Tag name already exists' }`
- Recurring generation: on-demand in `page.tsx` via `generateDueRecurring(workspace.id)`, capped at 365 iterations per rule
- `inline style={{ backgroundColor }}` in ExpenseChart/IncomeChart legends is intentional (dynamic colors)

**Remaining work (priority order):**
1. **F14** (transaction split) — largest UI change; rework AddTransactionModal to allow multiple "To" entries per transaction. Backend: still double-entry, just N expense entries summing to the same debit amount. UI: "Split" tab or "Add split" button that adds extra category+amount rows.
2. **U15** (mobile DateRangePicker) — the dual calendar is cramped on mobile; replace with a single range-capable picker or a bottom sheet on small screens.
3. **Period comparison** — show `+12%` / `−8%` delta badge on SummaryCards. Requires calling `getBalances` twice in `page.tsx` (current period + previous equivalent period), compute delta in RSC, pass to `SummaryCards`.

---

## Prompt for New Chat

```
Продовжуємо полировку Midas (finance tracker) в проекті ethos.

Контекст:
- Прочитай docs/midas-polish.md — там повний план, статус по фазах і handoff
- Прочитай CLAUDE.md — стек, паттерни, інваріанти
- Поточна гілка: main, HEAD: 3f77912 (36+ комітів з початку роботи)
- Фази 1–6 (крім F14) завершені

Залишилося (пріоритетний порядок з docs/midas-polish.md):
1. F14 — transaction split (найбільша UI-зміна: рефакторинг AddTransactionModal)
2. U15 — mobile DateRangePicker (CSS/UX, no DB)
3. Period comparison на SummaryCards

Правила:
- Коміть після кожного фіксу/фічі (Conventional Commits, subject only)
- Typecheck перед кожним комітом: запускати з apps/web/ через `pnpm tsc --noEmit`
- Drizzle для DB (не raw SQL), при нових таблицях: `pnpm -F @ethos/db db:push`
- auth check у кожному server action
- URL params + useTransition для state (no Zustand/TanStack Query)
- shadcn компоненти з @ethos/ui скрізь де можливо
```
