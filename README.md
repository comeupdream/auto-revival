# Revive Detail

A complete auto-detailing website with **online booking** and a
password-protected **admin job book** (a live spreadsheet + calendar of every
appointment), themed in black & gold.

The landing page opens with a **theater-curtain reveal**: a black curtain
covers the screen, and scrolling down lifts the valance and draws the panels
apart to unveil the gold Revive Detail logo flanked by two car photos.

---

## What's included

- **Public site** (`/`) — curtain-reveal hero, full services & pricing menu,
  hours, and contact.
- **Online booking** (`/book`) — a 3-step flow:
  1. Pick a service
  2. Pick a date, then a time from **real, conflict-checked availability**
  3. Enter contact + vehicle details → appointment saved to the database
- **Admin job book** (`/admin`) — password-gated spreadsheet of every
  appointment with:
  - Filter by date range / status, plus search (name, phone, email, vehicle,
    service)
  - Inline status changes (Confirmed → Completed / Cancelled / No-show)
  - **Add walk-in / phone bookings** (skips the online lead-time limit)
  - Delete, live totals (booked value), **CSV export**, month calendar view,
    and a photo gallery manager for the public **Our Work** page
- **Email notifications** (optional, via Resend) — booking confirmations,
  owner alerts, cancellation notices, and 24-hour reminders
  (`/api/cron/reminders`).

The booking engine enforces opening hours, service duration, a booking
horizon, a minimum lead time, and prevents double-booking — all server-side.

---

## Drop in your assets

Two things are designed to be dropped straight into the repo with **no code
changes**:

| Asset | Where to put it |
| ----- | --------------- |
| **Car photos** (the two hero shots) | `public/cars/car-left.jpg` and `public/cars/car-right.jpg` (also accepts `.jpeg` / `.png` / `.webp`, or `car-1.*` / `car-2.*`) |
| **Logo** (black & gold) | `public/brand/logo.png` (also accepts `.webp` / `.jpg` / `.svg`) |

Until the files exist, the site shows a built-in gold "REVIVE DETAIL" lockup
and gold-framed "photo coming soon" placeholders in the same spots.

Business details (phone, address, email, hours) live in one place:
[`src/lib/shop-config.ts`](src/lib/shop-config.ts) — the placeholder values
are marked with `TODO`.

---

## Tech stack

| Layer     | Choice                                  |
| --------- | --------------------------------------- |
| Framework | Next.js 15 (App Router) + React 19      |
| Language  | TypeScript                              |
| Styling   | Tailwind CSS (design tokens = CSS vars) |
| Database  | Prisma ORM + Postgres                   |

---

## Quick start

```bash
# 1. Install
npm install

# 2. Set up environment (needs a Postgres DATABASE_URL — local or hosted)
cp .env.example .env        # then edit the values (see below)

# 3. Create + seed the database
npm run db:push             # creates the tables in Postgres
npm run db:seed             # adds the services menu + demo appointments

# 4. Run it
npm run dev                 # http://localhost:3000
```

> Local dev needs a Postgres database. Quickest options: a free
> [Neon](https://neon.tech) dev branch, or local Postgres
> (`postgresql://USER:PASS@localhost:5432/revivedetail`).

Then visit:

- `http://localhost:3000` — the website (scroll to open the curtain)
- `http://localhost:3000/book` — booking flow
- `http://localhost:3000/admin` — admin job book (password from `.env`)

> The default dev admin password is `revival-admin` (set in `.env`).
> **Change it before going live.**

---

## Environment variables

See `.env.example`. The three that matter:

| Variable         | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `DATABASE_URL`   | Postgres connection string (Render/Neon/Supabase/local). |
| `ADMIN_PASSWORD` | Password for the `/admin` job book. **Change this.**     |
| `SESSION_SECRET` | Signs the admin session cookie. Long random string.      |

Optional email delivery (skipped gracefully when unset): `RESEND_API_KEY`,
`EMAIL_FROM`, `OWNER_EMAIL`, plus `CRON_SECRET` to protect the reminder
endpoint and `NEXT_PUBLIC_SITE_URL` for links in emails.

---

## Site lockdown

The whole site — every page and API route, `/admin` and the cron endpoint
included — currently sits behind a password gate at `/locked`
(`src/middleware.ts`). Two env vars control it:

| Variable             | Effect                                                              |
| -------------------- | ------------------------------------------------------------------- |
| `SITE_LOCKDOWN`      | Lockdown is **on unless** set to `0` (unset = locked).               |
| `SITE_GATE_PASSWORD` | The password that opens the gate. **Unset = no password works.**     |

So out of the box the site is fully bricked: the gate shows, and every
password is rejected. To hand out access, set `SITE_GATE_PASSWORD`; to reopen
the site to everyone, set `SITE_LOCKDOWN=0`. (For local dev, put
`SITE_LOCKDOWN="0"` in `.env` to skip the gate.)

---

## Deploy (Render)

`render.yaml` is a one-click Render Blueprint: it creates the web service and
a free Postgres, wires `DATABASE_URL`, generates `SESSION_SECRET` +
`CRON_SECRET`, and prompts for `ADMIN_PASSWORD`. For the 24-hour reminder
emails, point any external scheduler (cron-job.org, GitHub Actions, …) at
`GET /api/cron/reminders` roughly hourly with
`Authorization: Bearer <CRON_SECRET>`.
