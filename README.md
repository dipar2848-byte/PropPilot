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
| **Lead capture & management** *(Phase 2)* | Public landing pages capture leads (name, phone, message) and **persist them to the database BEFORE the WhatsApp hand-off**. Honeypot + server-side rate limiting. Per-property lead dashboard with summary counts, search by name/phone, status filter, and mobile-first lead cards (Call / WhatsApp / Mark Contacted / Mark Closed). |
| **Public landing pages** | SEO + Open Graph optimized, JSON-LD `RealEstateListing` structured data, image gallery, lead form, and a WhatsApp CTA. Served to anonymous visitors via a `SECURITY DEFINER` RPC so private rows stay locked down. |
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
| `PAYMENT_PROVIDER` | — | Payment provider id (`cashfree`). Provider is abstracted; MVP billing is manual UPI. |
| `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` / `CASHFREE_WEBHOOK_SECRET` / `CASHFREE_ENV` | — | Cashfree credentials (used in the billing phase). |

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
│       └── 0007_reconcile_property_images.sql # Schema reconciliation fix
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
  `landing_pages`, `profiles` and `leads` all enforce owner-only access.
- **Public data is opt-in** — only published landing pages are readable by
  anonymous users, and anonymous lead submission goes through a
  `SECURITY DEFINER` RPC; neither exposes private rows.
- **No privilege escalation** — the `profiles` update policy prevents a user
  from flipping their own `is_admin` flag.
- **Lead-before-WhatsApp** — public lead capture always persists the lead to the
  database before any WhatsApp hand-off (enforced client + server side).
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

---

## ⬆️ Upgrading an existing database

Run the new migrations **in order** in the Supabase SQL Editor. They are written
to be safe/idempotent:

```text
0004_profiles.sql
0005_landing_agent_contact.sql
0006_leads.sql
0007_reconcile_property_images.sql
```

If you already applied the Phase 1 migrations (`0004`, `0005`) manually, just run
`0006` and `0007`. After running `0007`, the
`column property_images.image_url does not exist` error is resolved.

---

## 📄 License

Provided as-is for use as a starter/production SaaS. Adapt freely for your
brokerage or product.
