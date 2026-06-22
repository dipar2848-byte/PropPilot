# Changelog

All notable changes to **PropPilot** are documented here. The project is built
incrementally across numbered phases; each entry summarises what shipped.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/).

---

## [6.1.0] — Stabilization & bug-fix release

**No database schema change. No new migration.** Fully backward-compatible with
existing installs and Supabase projects.

### Fixed
- **Landing page reverted to "Unpublished" after refresh (critical).** Root
  cause: PostgREST serialises a parent→child to-one embed (`properties` →
  `landing_pages` / `marketing_assets`) as an **array** in some cases, so
  reading `is_published` off the assumed object yielded `undefined`. Added a
  `toOne()` normaliser to `getProperty` + `listProperties`
  (`src/lib/data/properties.ts`) and `listMarketing` (`src/lib/data/marketing.ts`).
  DB-level publish/unpublish/re-publish were verified persistent — this was a
  read-mapping bug only.
- **Property creation generic "Something went wrong" (critical).**
  `createPropertyAction` now maps Postgres/PostgREST error codes to actionable
  messages (`42P01` pending migration, `42501`/`PGRST301` RLS denied, `23505`
  duplicate, `23502` missing field, `22P02` invalid value) and logs the raw
  error server-side. Verified end-to-end on a fresh Postgres for new, existing,
  trial and free-plan users.

### Hardened
- **Subscription reads no longer crash older installs.**
  `getSubscriptionState`, `getUsage`, `listTransactions` treat a missing Phase 4
  table (`42P01`) as Free plan / zero usage / empty history instead of throwing,
  so dashboard/billing/marketing render even before Phase 4/6 migrations are
  applied. A limit-check failure during property creation is logged and never
  blocks creation.

### Audited (no code change required)
- **Profile dependency:** profile completion is **not** required to create a
  property; `getMyProfile()` self-heals a missing profile row.
- **File uploads:** unique storage paths prevent `upsert:false` collisions;
  client + server validate type and the 5 MB cap; upload failure is non-fatal.

### Build
- Documented a low-memory production build for constrained hosts:
  `NODE_OPTIONS="--max-old-space-size=1024" npm run build` (resolves OOM /
  `SIGKILL` of the Next build worker). `tsc --noEmit` and `next lint` clean;
  all 24 routes compile.

---

## [6.0.0] — Online payments (Cashfree)

### Added
- Migration `0012_payments_cashfree.sql`: `payment_order_status` enum,
  `payment_orders` table (owner read-only RLS; service-role writes only), and
  the idempotent `apply_subscription_payment(...)` `SECURITY DEFINER` RPC
  (granted to `service_role` only).
- Cashfree gateway client with HMAC-SHA256 webhook signature verification
  (`src/lib/payments/cashfree.ts`); order persistence + apply
  (`src/lib/data/payments.ts`); checkout + reconcile server actions; webhook
  route (`/api/payments/cashfree/webhook`); `UpgradeButton` + `CheckoutReturn`
  UI.
- New optional env: `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_MODE`.

### Security
- The client can never set the price or self-upgrade. A subscription is upgraded
  only by the idempotent RPC, triggered by a signature-verified webhook or a
  return-URL gateway re-query. Duplicate webhooks are safe no-ops; the ledger
  never double-records. Payments are fully optional — the app runs on the trial
  when unconfigured.

---

## [5.0.0] — Plan-limit enforcement & usage UI

### Added
- Server-side limit checks (`checkPropertyLimit`, `checkLandingPageLimit`,
  `checkAiGenerationLimit`) read the effective plan + real DB counts;
  `getLimitsSummary()` consolidated snapshot.
- Usage meters on the dashboard, "Add property" gating + upgrade prompts on the
  properties list / `new` page, AI-generation gating in the marketing panel, and
  a published-landing limit prompt on the landing-pages list.
- `UsageMeter` + `UpgradePrompt` components. No schema change.

---

## [4.0.0] — Subscriptions, plans, transactions & usage credits

### Added
- Migrations `0010_subscriptions.sql` (subscriptions + extended
  `handle_new_user` + 7-day trial) and `0011_billing_plans_transactions.sql`
  (`plans`, `transactions`, `usage_counters`, `increment_usage` RPC).
- Code-based plan limits (`src/lib/plans.ts`), effective-plan resolution, and a
  Billing & Plan page. Owner-only RLS — users can never self-promote.

---

## [3.0.0] — Document vault, private details & lead flow
## [2.0.0] — Lead capture & WhatsApp click-to-chat
## [1.0.0] — Foundation: auth, properties CRUD, landing pages, AI marketing kit

See `README.md` for the full feature matrix and migration table.
