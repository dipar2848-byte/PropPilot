# PropPilot

**AI-powered real estate marketing & property management for agents.**

PropPilot is a complete, production-ready SaaS platform that lets real estate
agents manage their listings, upload photos, auto-generate marketing copy with
AI, and publish SEO-optimized public landing pages with a one-tap WhatsApp
call-to-action — all from a polished, installable PWA dashboard.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and
**Supabase** (Auth + Postgres + Storage). Deploys to **Vercel** in minutes.

---

## ✨ Features

| Area | What you get |
| --- | --- |
| **Authentication** | Email/password sign-up, sign-in, sign-out, forgot-password, reset-password, email confirmation callback, server-side session management, and route protection middleware. |
| **Multi-tenancy** | Every row is scoped to `auth.uid()` via Postgres **Row Level Security**. Agents only ever see their own data. |
| **Property CRUD** | Create, read, update, delete, and **duplicate** listings. Rich fields: type, status, price, beds/baths, area, location, amenities, description. |
| **Image management** | Multi-image upload to Supabase Storage, set cover image, delete images, drag-free reordering by position. Stored at `property-images/<user_id>/<property_id>/<file>`. |
| **Real search** | Full database search across title/location with type, status, bedrooms, and price-range filters. |
| **AI Marketing Kit** | One click generates a long description, short description, Instagram caption, Facebook post, LinkedIn post, and WhatsApp message. Pluggable provider abstraction (Template / OpenAI / Anthropic / Gemini) — swap with a single env var. **Works with zero config** via the built-in deterministic template engine. |
| **Agent profiles** *(Phase 1)* | Each agent has a `profiles` row (full name, phone, WhatsApp, email, agency, photo). Landing pages source contact details from the **property owner's profile** — never from environment variables. Onboarding profile-completion screen + dashboard Settings page. |
| **Lead capture & WhatsApp click-to-chat** *(Phase 2 + Phase 3)* | Public landing pages capture leads (name, phone, optional message) and **persist them to the database BEFORE any WhatsApp hand-off**. Strict **2-step flow**: (1) submit → save to DB; (2) success screen with a **"Continue on WhatsApp"** button that opens `wa.me` **click-to-chat only on click** (no auto-redirect, no phone auto-detection). The message is built from the user's own input + property title, with a copy-to-clipboard / manual-link fallback. **No Meta / WhatsApp Business API, no webhooks, no server-side messaging.** Per-property lead dashboard with counts, search and status filters. |
| **Document Vault** *(Phase 3)* | Up to **5 private documents per property** (PDF / JPG / PNG / WEBP, **25 MB** max). Stored in a **non-public** Supabase bucket; never exposed via public URLs — every preview/download uses a **short-lived signed URL** minted server-side after an ownership check. Upload / preview / download / delete, all **audit-logged**. |
| **Private Details** *(Phase 3)* | A strictly **internal-only** tab per property: real owner contact, commission terms (percentage/fixed, expected commission), deal stage and private notes. **Never** exposed on public landing pages, the `get_public_landing` RPC, the AI kit, or any public API. Owner-only via RLS. |
| **Subscriptions & plans** *(Phase 4)* | Every user is auto-provisioned a **`subscriptions` row** on signup that starts a **7-day Pro trial**. Two plans — **Free** (3 properties, 1 landing page, 10 AI generations/mo, 5 docs/property) and **Pro** (unlimited) — with **limits defined in code** (`src/lib/plans.ts`) so they evolve without a migration. A `getSubscriptionState()` helper resolves the **effective plan** (trial grants full Pro access until it lapses) and is the single source of truth Phase 5 limit enforcement reads from. A **Billing & Plan** page shows current status + plan comparison, and the dashboard surfaces a trial banner. **Owner-only RLS — users can never self-promote to a paid plan** (paid transitions are applied server-side / via the payment webhook in a later phase). |
| **Plan-limit enforcement & usage UI** *(Phase 5)* | Server-side limit checks (`checkPropertyLimit`, `checkLandingPageLimit`, `checkAiGenerationLimit`) read the **effective plan + real DB counts** before any gated action — the client is never trusted. The UI mirrors that truth: the dashboard shows a **"Plan usage" card** with live `UsageMeter` progress bars (properties, published landing pages, AI generations), the **properties list disables the "Add property" button** and shows an `UpgradePrompt` at limit, **`/properties/new` blocks the form** when the property cap is reached, the **marketing panel disables AI generation** at the monthly cap, and the **landing-pages list surfaces a published-page limit prompt**. Every gate degrades gracefully to a CTA that links to **Billing** — no client-side privilege changes. **No new migration is required** (Phase 5 is purely enforcement + UI on top of the Phase 4 schema). |
| **Online payments — Cashfree** *(Phase 6)* | Real **Pro upgrades via the Cashfree Payment Gateway**. The client never sets the price or its own plan: an **`UpgradeButton`** asks a server action to create a `payment_orders` row (service-role) + a Cashfree order, then launches the hosted checkout with the returned `payment_session_id`. A subscription is upgraded **only** by the tamper-proof, **idempotent** `apply_subscription_payment` `SECURITY DEFINER` RPC, triggered by either (a) a **signature-verified webhook** (`/api/payments/cashfree/webhook`, HMAC-SHA256 over the raw body) or (b) a **return-URL reconciliation** that re-queries the gateway for the authoritative status. Duplicate webhooks are safe no-ops; the ledger never double-records. **Fully optional** — with no Cashfree env the app runs on the trial and shows a friendly note instead of the button. |
| **Public landing pages** | SEO + Open Graph optimized, JSON-LD `RealEstateListing` structured data, image gallery, lead form, and a WhatsApp CTA. Served to anonymous visitors via a `SECURITY DEFINER` RPC that returns **only** public fields — never documents or private details. |
| **Centralized branding** | A single `APP_CONFIG` (`src/lib/config.ts`) drives the product name everywhere (metadata, dashboard, landing pages, PWA). Rebrand by changing one value / `NEXT_PUBLIC_APP_NAME`. |
| **PWA** | Web app manifest, service worker (network-first navigation, stale-while-revalidate assets), offline fallback page, generated icons, and an install prompt. |
| **Performance & security** | React Server Components, Server Actions, Zod validation, in-memory rate limiting, security headers, and strict route protection. |

---

## 🧱 Tech Stack

- **Next.js 15.5** — App Router, React Server Components, Server Actions
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS** with a custom brand palette
- **Supabase** — `@supabase/ssr` for cookie-bound auth, Postgres with RLS, Storage
- **Zod** for input validation

---

## 🚀 Quick Start (Deploy in 6 steps)

> You only need to do the following — no other code changes required.

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the SQL migrations** (in order) in the Supabase SQL Editor:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_storage.sql`
   - `supabase/migrations/0003_public_landing.sql`
   - `supabase/migrations/0004_profiles.sql`
   - `supabase/migrations/0005_landing_agent_contact.sql`
   - `supabase/migrations/0006_leads.sql`
   - `supabase/migrations/0007_reconcile_property_images.sql`
   - `supabase/migrations/0008_documents.sql`
   - `supabase/migrations/0009_private_details.sql`
3. **Copy `.env.example` → `.env.local`** and fill in your Supabase URL/keys
   (see [Environment Variables](#-environment-variables)). Agent contact details
   are entered in-app (Settings → Profile), **not** via env vars.
4. **Push this repo to GitHub.**
5. **Import the repo into Vercel** and add the same environment variables in
   *Project Settings → Environment Variables*.
6. **Deploy.** 🎉

Then run locally with:

```bash
npm install
npm run dev          # http://localhost:3000
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local`. Required values are marked **REQUIRED**.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (Settings → API). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon public key. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — **server only**, never exposed to the browser. |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Full public URL (e.g. `https://your-app.vercel.app`). Used for auth redirects, landing links and OG metadata. |
| `NEXT_PUBLIC_APP_NAME` | — | Public brand name (default `PropPilot`). Drives `APP_CONFIG.name` everywhere — change in one place to rebrand. |
| `NEXT_PUBLIC_TRIAL_DAYS` | — | Trial length in days (default `7`). |
| `AI_PROVIDER` | — | `template` (default, no key) \| `openai` \| `anthropic` \| `gemini`. |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | — | Only when `AI_PROVIDER=openai`. |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | — | Only when `AI_PROVIDER=anthropic`. |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | — | Only when `AI_PROVIDER=gemini`. |
| `RESEND_API_KEY` | — | Resend API key for email notifications (used in a later phase). |
| `NOTIFICATIONS_FROM_EMAIL` | — | From-address for outbound notifications. |
| `ADMIN_EMAIL` | — | Recipient for admin alerts (e.g. AI outages). |
| `CASHFREE_APP_ID` | — | Cashfree Payment Gateway App ID. Required to enable online Pro upgrades (Phase 6). Server only. |
| `CASHFREE_SECRET_KEY` | — | Cashfree secret key. **Server only** — used to authenticate API calls *and* to verify webhook signatures. |
| `CASHFREE_MODE` | — | `sandbox` (default) \| `production`. Selects the Cashfree API base + checkout SDK mode. |

> 💳 **Payments are optional.** If `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` are
> unset, the app runs normally on the 7-day Pro trial and the Billing page shows
> an *"online payments aren't enabled"* note instead of the upgrade button — no
> errors. Set all three to enable real Pro upgrades.

> ⚠️ **Removed in Phase 1:** `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL`
> and `NEXT_PUBLIC_CONTACT_WHATSAPP` no longer exist. Per-agent contact details
> are stored in the `profiles` table and edited at **Settings → Profile**;
> landing pages read them from the property owner's profile.

> 💡 **AI works without any LLM key.** The default `template` provider produces
> high-quality, deterministic marketing copy. Set a provider + key any time to
> upgrade — no code changes needed.

---

## 🗄️ Supabase Setup Guide

### 1. Run migrations

Open **SQL Editor** in your Supabase dashboard and run each file in order:

| File | What it does |
| --- | --- |
| `0001_init.sql` | Creates enums, the four core tables (`properties`, `property_images`, `marketing_assets`, `landing_pages`), indexes, foreign keys, an `updated_at` trigger, and **RLS policies** (owner-only writes/reads; public read for published landing pages). |
| `0002_storage.sql` | Creates the public `property-images` storage bucket (5 MB limit, image MIME types) and `storage.objects` policies that allow public read but restrict writes to the owning user's folder. |
| `0003_public_landing.sql` | Creates the `get_public_landing(p_slug)` `SECURITY DEFINER` function so anonymous visitors can read published landing pages without exposing private rows. Granted to `anon` and `authenticated`. |
| `0004_profiles.sql` *(Phase 1)* | Creates the `profiles` table (1:1 with `auth.users`), an auto-provision trigger on signup (+ backfill for existing users), and **RLS** (owner-only; a privilege-escalation guard prevents users from setting their own `is_admin`). |
| `0005_landing_agent_contact.sql` *(Phase 1)* | Replaces `get_public_landing` so landing pages return the owner's agent contact details from `profiles`. |
| `0006_leads.sql` *(Phase 2)* | Creates the `lead_status` enum + `leads` table with **owner-only RLS**, and the `submit_public_lead(...)` `SECURITY DEFINER` RPC for spam-safe anonymous lead capture (anonymous users never get direct table access). |
| `0007_reconcile_property_images.sql` *(Phase 2 fix)* | **Idempotent** reconciliation that brings legacy databases in line with the code: renames `property_images.url` → `image_url` if needed, and adds missing `storage_path` / `is_cover` columns + indexes. No-op on already-correct schemas. |
| `0008_documents.sql` *(Phase 3)* | Creates the `document_type` + `document_access_action` enums, the `property_documents` table, the append-only `document_access_log` audit table (both **owner-only RLS**), and the **private** `property-documents` storage bucket (25 MB, PDF/JPG/PNG/WEBP) with owner-only storage policies and **no public read**. |
| `0009_private_details.sql` *(Phase 3)* | Creates the `commission_type` enum and the `property_private_details` table (one row per property, **owner-only RLS**). This data is never exposed publicly. |
| `0010_subscriptions.sql` *(Phase 4)* | Creates the `subscription_plan` + `subscription_status` enums and the `subscriptions` table (one row per user, **owner-only RLS**). **Extends `handle_new_user()`** so every new signup is auto-provisioned a `free`/`trialing` subscription with a 7-day window (+ backfill for existing users). Users may insert only a `free`/`trialing` starter row and have **no UPDATE/DELETE** policy — they can never self-promote to a paid plan (paid transitions are applied server-side). |
| `0011_billing_plans_transactions.sql` *(Phase 4)* | Creates the `transaction_type` + `transaction_status` enums and three tables: **`plans`** (publicly-readable plan catalog, seeded `free`/`pro`, kept in sync with `src/lib/plans.ts`; service-role writes only), **`transactions`** (append-only billing/credit ledger — owner read-only, **inserts blocked for clients** so a user can never fabricate a payment), and **`usage_counters`** (per-user, per-month credit tracking — owner read-only). Adds the tamper-proof `increment_usage(feature, amount)` `SECURITY DEFINER` RPC for server-side credit deduction. |
| `0012_payments_cashfree.sql` *(Phase 6)* | Creates the `payment_order_status` enum and the **`payment_orders`** table (one row per checkout attempt — **owner read-only**, all writes via the service role). Adds the **idempotent** `apply_subscription_payment(order_id, cf_payment_id, period_months)` `SECURITY DEFINER` RPC (granted to `service_role` **only**) which, in one transaction, marks the order paid, flips the subscription to `pro`/`active` with a one-month period, and appends a `succeeded` transaction — a duplicate webhook is a safe no-op. |

### 2. Auth configuration

In **Authentication → URL Configuration**:

- **Site URL**: your `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-app.vercel.app`).
- **Redirect URLs**: add `<SITE_URL>/auth/callback` and
  `<SITE_URL>/reset-password`.

Email confirmations are on by default; the app handles the
`/auth/callback` code exchange automatically.

### 3. Storage

The `property-images` bucket is created by the migration. No manual steps
needed — uploads are namespaced per user/property and protected by storage
policies.

---

## ☁️ Vercel Deployment Guide

1. Push the repository to GitHub.
2. In Vercel, click **Add New → Project** and import the repo.
3. Framework preset is auto-detected as **Next.js**.
4. Under **Environment Variables**, add every variable from your `.env.local`
   (use the same values; remember `NEXT_PUBLIC_SITE_URL` should be the Vercel
   production URL).
5. Click **Deploy**.
6. After the first deploy, copy the production URL into `NEXT_PUBLIC_SITE_URL`
   and into Supabase's Site URL / Redirect URLs, then redeploy if you changed it.

That's it. No build configuration or custom commands are required.

---

## 📁 Project Structure

```
.
├── public/
│   ├── icons/                # PWA icons (192, 512, maskable, apple-touch)
│   ├── favicon.ico
│   └── sw.js                 # Service worker (offline + caching)
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql       # Schema, indexes, RLS
│       ├── 0002_storage.sql    # Storage bucket + policies
│       ├── 0003_public_landing.sql        # Public landing RPC
│       ├── 0004_profiles.sql              # Agent profiles + RLS (Phase 1)
│       ├── 0005_landing_agent_contact.sql # Landing RPC v2 w/ agent contact
│       ├── 0006_leads.sql                 # Leads table + public RPC (Phase 2)
│       ├── 0007_reconcile_property_images.sql # Schema reconciliation fix
│       ├── 0008_documents.sql             # Document vault + audit log (Phase 3)
│       ├── 0009_private_details.sql       # Private property details (Phase 3)
│       ├── 0010_subscriptions.sql         # Subscriptions + trial (Phase 4)
│       ├── 0011_billing_plans_transactions.sql # Plans, transactions, usage credits (Phase 4)
│       └── 0012_payments_cashfree.sql     # Cashfree orders + idempotent apply RPC (Phase 6)
├── src/
│   ├── middleware.ts         # Route protection entry
│   ├── app/
│   │   ├── (auth)/           # login, signup, forgot/reset password
│   │   ├── (dashboard)/      # dashboard, properties, search, marketing, landing-pages
│   │   ├── auth/callback/    # OAuth/email code exchange
│   │   ├── p/[slug]/         # Public landing pages
│   │   ├── manifest.ts       # PWA manifest
│   │   ├── robots.ts         # robots.txt
│   │   ├── sitemap.ts        # sitemap.xml
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Tailwind layers + component classes
│   ├── components/           # UI, dashboard, properties, marketing, landing, pwa
│   └── lib/
│       ├── supabase/         # client, server, admin, middleware helpers
│       ├── ai/               # provider abstraction + service
│       │   └── providers/    # template, openai, anthropic, gemini
│       ├── data/             # typed data-access (properties, marketing, landing)
│       ├── types.ts          # DB types + typed Supabase Database
│       ├── env.ts            # Validated env access
│       ├── validation.ts     # Zod schemas
│       ├── rate-limit.ts     # In-memory rate limiter
│       └── utils.ts          # Formatting & helpers
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🤖 Swapping the AI Provider

The marketing generator is built around a `MarketingProvider` interface
(`src/lib/ai/types.ts`). To switch providers, set `AI_PROVIDER` and the matching
key — no code changes:

```bash
# Use OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Use Anthropic Claude
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-latest

# Use Google Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
```

If a provider call fails for any reason, PropPilot automatically falls back to
the deterministic template engine so generation **always succeeds**.

---

## 🧪 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript (tsc --noEmit)
```

---

## 🔒 Security Notes

- **RLS everywhere** — `properties`, `property_images`, `marketing_assets`,
  `landing_pages`, `profiles`, `leads`, `property_documents`,
  `document_access_log` and `property_private_details` all enforce owner-only
  access. No cross-tenant access is possible.
- **Public data is opt-in** — only published landing pages are readable by
  anonymous users, and anonymous lead submission goes through a
  `SECURITY DEFINER` RPC; neither exposes private rows. The RPC returns only
  public fields — **never documents or private details**.
- **Private documents** — stored in a non-public bucket; never served via public
  URLs. Every preview/download is a short-lived **signed URL** minted
  server-side after an ownership check, and **every** upload / preview /
  download / delete is written to an append-only audit log.
- **Private Details** — internal owner/commission/notes data is owner-only and
  is never referenced by the public RPC, the AI marketing kit, or any public API.
- **No privilege escalation** — the `profiles` update policy prevents a user
  from flipping their own `is_admin` flag.
- **Lead-before-WhatsApp** — public lead capture always persists the lead to the
  database first; the WhatsApp **click-to-chat** hand-off is an optional action
  triggered only by an explicit button click (no Meta API, no webhooks).
- **Anti-spam** — honeypot field + server-side IP/slug rate limiting on lead
  submission.
- **Service role key** is used only on the server (never bundled to the client).
- **Input validation** with Zod on every Server Action.
- **Rate limiting** on sensitive actions.
- **Security headers** configured in `next.config.mjs`.

---

## 🧬 Schema Changes (Phase 1 & Phase 2)

### Phase 1 — Agent Profiles & Branding
- **New table `profiles`** — `id` (PK, FK → `auth.users`), `full_name`, `phone`,
  `whatsapp_number`, `email`, `agency_name` (nullable), `profile_photo_url`
  (nullable), `is_admin` (default `false`), `created_at`, `updated_at`.
- **New trigger** `on_auth_user_created` → `handle_new_user()` auto-creates a
  profile on signup; existing users are backfilled.
- **RLS** on `profiles`: owner-only select/insert/update; `is_admin` cannot be
  self-escalated. No delete policy (removed via `auth.users` cascade).
- **`get_public_landing` RPC updated** to also return the owner's agent contact
  block from `profiles`.
- **Env removed:** `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL`,
  `NEXT_PUBLIC_CONTACT_WHATSAPP`. **Env added:** `NEXT_PUBLIC_APP_NAME`,
  `NEXT_PUBLIC_TRIAL_DAYS`, plus placeholders for Resend / Cashfree / admin email.

### Phase 2 — Leads
- **New enum `lead_status`** = `('new','contacted','closed')`.
- **New table `leads`** — `id` (PK), `property_id` (FK → `properties`),
  `user_id` (FK → `auth.users`), `name`, `phone`, `message`, `status`
  (`lead_status`, default `new`), `source` (default `landing_page`),
  `created_at`, `updated_at`. Indexes on `user_id`, `property_id`,
  `(user_id,status)`, `created_at`, `lower(name)`, `phone`.
- **RLS** on `leads`: owner-only select/insert/update/delete.
- **New RPC `submit_public_lead(p_slug,p_name,p_phone,p_message)`**
  (`SECURITY DEFINER`) for anonymous, spam-safe lead capture.

### Phase 2 — Database reconciliation (important)
Some earlier databases were created with `property_images.url` (and without
`storage_path` / `is_cover`). **The code expects `image_url`, `storage_path` and
`is_cover`** (as defined in `0001_init.sql`). Migration
`0007_reconcile_property_images.sql` fixes this idempotently:

1. If a legacy `url` column exists and `image_url` does not → it is **renamed**.
2. If both exist → data is copied into `image_url` and `url` is dropped.
3. Missing `storage_path`, `is_cover`, `position` columns and indexes are added.
4. `image_url` is set `NOT NULL`.

> If you saw `column property_images_1.image_url does not exist`, run migration
> `0007` (and the Phase 1 migrations if not yet applied) — see below.

### Phase 3 — Document Vault, Private Details & lead flow
- **New enums** `document_type` (`agreement`, `floor_plan`, `brochure`,
  `legal`, `identity`, `other`), `document_access_action`
  (`upload`, `preview`, `download`, `delete`), `commission_type`
  (`percentage`, `fixed`).
- **New table `property_documents`** — `id`, `property_id` (FK), `user_id` (FK),
  `file_name`, `file_url` (storage object path — **not** a public URL),
  `document_type`, `file_size`, `title`, `mime_type`, `uploaded_at`,
  `updated_at`. **Owner-only RLS.**
- **New table `document_access_log`** (append-only audit) — `id`, `document_id`
  (FK, set-null on delete), `property_id` (FK), `user_id`, `action`,
  `file_name`, `created_at`. **Owner-readable / owner-insertable RLS**; no
  update/delete policies.
- **New table `property_private_details`** — one row per property
  (`unique(property_id)`): `owner_name`, `owner_phone`, `owner_email`,
  `alternate_contact`, `commission_type`, `commission_percentage`,
  `commission_amount`, `expected_commission`, `deal_stage`, `internal_notes`,
  timestamps. **Owner-only RLS.** Never exposed publicly.
- **New private storage bucket `property-documents`** — `public = false`,
  25 MB limit, MIME = PDF/JPG/PNG/WEBP. Storage policies allow owners to
  read/write/delete only their own folder; there is **no public read policy**
  (reads happen exclusively via signed URLs).
- **Lead flow finalized** (no schema change): public lead capture is now a
  strict 2-step flow — save to DB first, then a **"Continue on WhatsApp"**
  button that opens `wa.me` click-to-chat **only on click**. No Meta /
  WhatsApp Business API, no webhooks, no server-side WhatsApp messaging.
- **No new environment variables** are required for Phase 3.

### Phase 4 — Subscriptions, Plans, Transactions & Usage Credits
- **New enums** `subscription_plan` (`free`, `pro`), `subscription_status`
  (`trialing`, `active`, `past_due`, `canceled`), `transaction_type`
  (`subscription`, `credit_purchase`, `refund`, `adjustment`),
  `transaction_status` (`pending`, `succeeded`, `failed`, `refunded`).
- **New table `subscriptions`** — one row per user (`unique(user_id)`):
  `plan` (default `free`), `status` (default `trialing`), `trial_started_at`,
  `trial_ends_at` (default now + 7 days), `current_period_end`, `provider`,
  `provider_ref`, timestamps. **Owner-only RLS** — a user may insert only a
  `free`/`trialing` starter row and **cannot UPDATE/DELETE** (no self-promote;
  paid transitions are applied with the service role).
- **`handle_new_user()` extended** (in `0010`) to auto-provision a trialing
  subscription on signup, plus a one-time backfill for existing users. The
  profile-insert behaviour from Phase 1 is preserved exactly.
- **New table `plans`** — publicly-readable plan catalog (`id`, `name`,
  `price_monthly`, `max_properties`, `max_landing_pages`,
  `max_ai_generations_month`, `max_documents_property`, `is_active`,
  `sort_order`), seeded with `free`/`pro` and kept in sync with
  `src/lib/plans.ts`. **Read = public; writes = service role only.**
- **New table `transactions`** — append-only billing/credit ledger
  (`user_id`, `type`, `status`, `amount`, `currency`, `plan_id`, `provider`,
  `provider_ref`, `description`, `created_at`). **Owner read-only**; there is
  **no client INSERT/UPDATE/DELETE policy** so a user can never fabricate a
  payment record (verified: an attacker insert is rejected by RLS).
- **New table `usage_counters`** — per-user, per-month metered-feature credits
  (`unique(user_id, feature, period)`), e.g. `ai_generation`. **Owner read-only**;
  the count is mutated **only** by the tamper-proof `increment_usage(feature,
  amount)` `SECURITY DEFINER` RPC.
- **Server-side limit enforcement** (never trusts the client): property creation
  checks `checkPropertyLimit()` and AI generation checks
  `checkAiGenerationLimit()` against the **effective plan** (trial grants Pro
  access until it lapses) and the **real DB counts** before proceeding; a
  successful AI generation deducts one credit via `recordUsage('ai_generation')`.
- **Billing & Plan page** (`/billing`) shows current status, a plan comparison,
  this month's AI-usage meter and billing history. The dashboard shows a
  trial-status banner. Plan limits are defined in code (`src/lib/plans.ts`).
- **No new environment variables** are required for Phase 4. Online payments
  (Cashfree) arrive in a later phase; until then the trial grants full Pro access.

### Phase 5 — Plan-limit enforcement & usage UI
- **No new migration / no schema change.** Phase 5 is built entirely on top of
  the Phase 4 schema — it adds server-side enforcement helpers and the UI that
  reflects them. (If you already applied `0010` + `0011`, you are ready.)
- **New server helpers** in `src/lib/data/subscription.ts`:
  - `checkLandingPageLimit(excludePropertyId?)` — counts only **published**
    landing pages against the plan's allowance; when re-publishing an existing
    page it excludes that property so a page never counts against itself.
  - `getLimitsSummary()` — a single consolidated snapshot (effective plan, trial
    state, and a `UsageItem` for properties / published landing pages / AI
    generations) that the dashboard renders. Each item carries `current`,
    `limit` (null = unlimited) and a derived `atLimit` flag.
- **All limit checks are server-side and read the real database** — the client
  is never trusted. The UI only *reflects* the server's decision; it never
  grants access.
- **UI surfaces** (all degrade to a Billing CTA, never a client privilege change):
  - **Dashboard** — a "Plan usage" card with live `UsageMeter` progress bars
    (turns amber near 80%, rose at limit) plus the existing trial banner.
  - **Properties list** — the "Add property" button is **disabled with a lock**
    and a rose `UpgradePrompt` is shown when the property cap is reached.
  - **`/properties/new`** — renders the `UpgradePrompt` instead of the form when
    the property limit is hit (defence in depth alongside the server action).
  - **Marketing panel** — the AI "Generate" buttons are **disabled** at the
    monthly AI-generation cap, with the current usage shown beneath them.
  - **Landing-pages list** — shows a published-landing-page limit prompt and the
    `live/limit` count in the page subtitle.
- **New presentational components** `src/components/billing/UsageMeter.tsx` and
  `src/components/billing/UpgradePrompt.tsx`.
- **Publish flow** (`publishLandingAction`) now also runs `checkLandingPageLimit`
  (excluding the current property) as a non-fatal guard before publishing.
- **No new environment variables** are required for Phase 5.

### Phase 6 — Online payments (Cashfree)
- **New migration `0012`** adds the `payment_order_status` enum, the
  `payment_orders` table (owner read-only; service-role writes only) and the
  **idempotent** `apply_subscription_payment(...)` `SECURITY DEFINER` RPC granted
  to `service_role` only.
- **The client can never self-upgrade.** The upgrade path is:
  1. `UpgradeButton` (client) → `startCheckoutAction` (server) creates a
     `payment_orders` row via the **service role** and a Cashfree order; it
     returns only a `payment_session_id`.
  2. The Cashfree hosted checkout (loaded from `sdk.cashfree.com`) collects
     payment and returns the user to `/billing?order_id=...`.
  3. The subscription is upgraded **only** by `apply_subscription_payment`,
     triggered by either:
     - the **signature-verified webhook** at
       `POST /api/payments/cashfree/webhook` — HMAC-SHA256 over
       `timestamp + rawBody` with the secret key, constant-time compared; an
       invalid signature is rejected with `401` and does nothing; **or**
     - the **return reconciliation** (`reconcileOrderAction`) which re-queries
       the gateway for the authoritative `order_status` and applies the upgrade
       if `PAID` — so the user sees Pro immediately even if the webhook lags.
- **Idempotent & tamper-proof.** The RPC locks the order row, refuses to act if
  it is already `paid` (duplicate webhook = no-op), and only then upgrades the
  subscription and writes **exactly one** `succeeded` ledger row. The price and
  plan come from the server (`src/lib/plans.ts`) — never the client.
- **Graceful when unconfigured.** With no `CASHFREE_APP_ID` /
  `CASHFREE_SECRET_KEY`, payments are disabled cleanly: the Billing page shows a
  note instead of the button, the webhook ACKs without acting, and the trial
  continues to grant full Pro access.
- **New env (all optional):** `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`,
  `CASHFREE_MODE` (`sandbox`|`production`). All server-only.
- **New files:** `src/lib/payments/cashfree.ts` (gateway client + signature
  verify), `src/lib/data/payments.ts` (order persistence + apply via RPC),
  `src/app/(dashboard)/billing/actions.ts` (checkout + reconcile actions),
  `src/app/api/payments/cashfree/webhook/route.ts`,
  `src/components/billing/UpgradeButton.tsx`,
  `src/components/billing/CheckoutReturn.tsx`.

### Phase 6.1 — Stabilization & bug-fix release
- **No schema change / no new migration.** Phase 6.1 is purely correctness and
  resilience fixes; existing installs and Supabase projects keep working as-is.
- **Fixed: landing page reverted to "Unpublished" after refresh (root cause).**
  When embedding a to-one relation from the parent side (`properties` →
  `landing_pages` / `marketing_assets`), PostgREST can serialise it as an
  **array**, so reading `is_published` off the assumed object returned
  `undefined`. The read path now normalises both shapes via a `toOne()` helper
  in `getProperty`, `listProperties` (`src/lib/data/properties.ts`) and
  `listMarketing` (`src/lib/data/marketing.ts`). DB-level publish/unpublish was
  verified correct; this was strictly a read-mapping bug.
- **Fixed: property creation showed a generic error.** `createPropertyAction`
  now maps opaque Postgres/PostgREST errors (`42P01` missing table / pending
  migration, `42501`/`PGRST301` RLS denied, `23505` duplicate, `23502` missing
  field, `22P02` invalid value) to **actionable messages**, and logs the raw
  error server-side. The property insert remains the hard-fail step; image
  upload stays non-fatal. Verified end-to-end on a fresh Postgres for new,
  existing, trial and free users.
- **Hardened: subscription reads no longer crash older installs.**
  `getSubscriptionState`, `getUsage` and `listTransactions` now treat a
  *missing* Phase 4 table (`42P01`) as "Free plan / zero usage / empty history"
  instead of throwing — so the dashboard, billing and marketing pages render
  even before the Phase 4/6 migrations are applied. A limit-check failure during
  property creation is logged and **never blocks** creation.
- **Profile dependency audit:** profile completion is **NOT** required to create
  a property; `getMyProfile()` self-heals a missing profile row. (Profile
  contact details are only used to enrich public landing pages.)
- **File-upload audit:** uploads use unique storage paths (`Date.now()` + random
  suffix) so `upsert:false` cannot collide; client + server both validate type
  and the 5 MB size cap; upload failure is non-fatal and reported clearly.
- **Build/OOM note:** Next 15 production builds can exceed ~1.5 GB. On
  memory-constrained machines, build with a capped heap:
  `NODE_OPTIONS="--max-old-space-size=1024" npm run build` (verified to compile
  all 24 routes successfully). `tsc --noEmit` and `next lint` are clean.

---

## ⬆️ Upgrading an existing database

Run the new migrations **in order** in the Supabase SQL Editor. They are written
to be safe/idempotent (every object uses `IF NOT EXISTS` / `DROP POLICY IF
EXISTS`, enums are guarded, and the storage bucket upsert is conflict-safe):

```text
0004_profiles.sql
0005_landing_agent_contact.sql
0006_leads.sql
0007_reconcile_property_images.sql
0008_documents.sql
0009_private_details.sql
0010_subscriptions.sql
0011_billing_plans_transactions.sql
0012_payments_cashfree.sql
```

Only run the files you haven't applied yet. After running `0007`, the
`column property_images.image_url does not exist` error is resolved. `0008` and
`0009` add the Phase 3 tables, audit log, private bucket and private-details
table. `0010` and `0011` add the Phase 4 subscription, plan-catalog,
transaction-ledger and usage-credit tables. `0010` also extends the existing
`handle_new_user()` trigger to auto-provision a trialing subscription and
backfills one for any users created before Phase 4. `0012` adds the Phase 6
`payment_orders` table and the idempotent `apply_subscription_payment` RPC for
Cashfree upgrades — it is upgrade-safe and applies cleanly on top of `0010`/`0011`.

## 🆕 Fresh installation

On a brand-new Supabase project, run **all** migrations once, in numeric order:

```text
0001_init.sql
0002_storage.sql
0003_public_landing.sql
0004_profiles.sql
0005_landing_agent_contact.sql
0006_leads.sql
0007_reconcile_property_images.sql   # no-op on a fresh DB
0008_documents.sql
0009_private_details.sql
0010_subscriptions.sql
0011_billing_plans_transactions.sql
0012_payments_cashfree.sql
```

They execute cleanly from zero with no schema conflicts. `set_updated_at()` is
defined in `0001` and reused by later triggers, so order matters.

---

## 📄 License

Provided as-is for use as a starter/production SaaS. Adapt freely for your
brokerage or product.
