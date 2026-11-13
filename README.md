# Star Generation — Student & Tutor App (PWA)

Mobile-first, installable web app for students and tutors.

| Students: Home · Explore · My classes · Invoices | Tutors: Home · My classes · Logbooks · Earnings |
|---|---|
| **Home**: what's next (pay, next lesson), stat tiles, featured classes | **Home**: what's next (logbook to fix, lessons to log, next lesson), stats, upcoming lessons |
| **Explore**: search by subject, level, day or tutor; lazy-loads as you scroll; enroll | **My classes**: seats filled, next lesson, rate; schedule and cancel lessons (WIB) |
| **My classes**: hours left / used / booked / awaiting tutor notes, schedule, approved logbooks, *Buy package* | **Logbooks**: by month with progress and the next step; one entry per lesson; submit and fix sent-back months |
| **Invoices**: filter by status, pay (simulated) | **Earnings**: per lesson and month, approved vs pending |

> Setup, seeded logins, architecture and decisions live in the API repo: **[sg-api](https://github.com/dimsurd/sg-api)**.
> The admin back office is **[sg-backoffice](https://github.com/dimsurd/sg-backoffice)**.

## Run

The API must be running on `http://localhost:4000` (see sg-api's README).

The only setting is `API_URL` (see `.env.example`): where `/api/*` is proxied. It defaults to `http://localhost:4000`, so local dev needs no `.env`. It's read at build time; the browser never sees it and no secrets live here.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Sign in with any seeded student or tutor (`student1@stargeneration.test` … `student3@…`, `tutor1@…`, `tutor2@…`); the password is `Password123!`. The login screen has one-tap shortcuts for all of them.

To try the PWA itself (install prompt, offline page), run a production build: `pnpm build && pnpm start`. The service worker isn't registered in dev.

| Script | |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js on port 3000 |
| `pnpm typecheck`, `pnpm lint` | Static checks |
| `pnpm gen:api` | Regenerate `src/lib/api/schema.d.ts` from the running API's `openapi.yaml` |

## Mobile app feel

- App bar with avatar and greeting; the avatar opens a profile sheet with log out.
- Floating pill bottom nav; every dialog is a bottom sheet with large buttons (`components/ui/dialog.tsx`, `components/action-sheet.tsx`).
- **Install app** button (`components/install-app.tsx`): native prompt on Chromium/Android, a Share → Add to Home Screen guide on iOS; hidden once installed.
- `app/manifest.ts` with icons from `app/pwa-icon/[size]/route.tsx`.
- `public/sw.js`: cache-first for hashed assets, network-first pages with an `/offline` fallback, and it **never caches `/api`**, so balances and invoices are always live; cached pages are cleared on logout.

## Layout

```
src/
  app/student/        home, explore, classes (list + detail), invoices
  app/tutor/          home, classes (list + detail), logbooks (list + month), earnings
  app/login, offline  sign-in and offline fallback
  components/         mobile shell, home kit, student/ and tutor/ cards, sheets, shadcn ui
  lib/                typed API client + generated schema, class-meta, formatting
  proxy.ts            routes tutors to /tutor and students to /student (the API still checks every call)
```
