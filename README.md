# El-Bethel International Academy — Digital School Platform

A complete school platform for a fictional private Primary School in Ushafa, Abuja,
built to `BUILD_SPEC.md`. It is one application covering six audiences:

| Area | Route | Who it is for |
|---|---|---|
| Public website | `/` | Prospective families, the general public |
| Online admissions | `/admissions/apply`, `/admissions/status` | Applicants |
| Parent portal | `/portal/parent` | Parents and guardians |
| Pupil portal | `/portal/pupil` | Children |
| Teacher portal | `/portal/teacher` | Teaching staff |
| Administration | `/portal/admin` | School administration |

## Running it

```bash
yarn dev      # http://localhost:3000
yarn build    # production build
yarn start    # production server
yarn lint
```

## Demo accounts

Every demo account uses the password **`elbethel`**. The login page also has one-click
sign-in buttons for the four main roles.

| Role | Email | What you see |
|---|---|---|
| Parent | `parent@elbethel.edu.ng` | Mrs. Ada Chukwu — three children across Primary 1, Primary 3 and Primary 5 |
| Pupil | `pupil@elbethel.edu.ng` | David Chukwu, Primary 4A, EIA-2026-00482 |
| Teacher | `teacher@elbethel.edu.ng` | Miss Chiamaka Obi, class teacher of Primary 4A |
| Administrator | `admin@elbethel.edu.ng` | The full school control centre |
| Headteacher | `headteacher@elbethel.edu.ng` | Leadership view |
| Accountant | `accounts@elbethel.edu.ng` | Finance-oriented admin access |
| Admissions | `admissions@elbethel.edu.ng` | Admissions pipeline |
| Applicant | `applicant@example.com` | An in-flight admission application |

Every teacher, parent and pupil in the seed data also has an account, so authorisation
boundaries are real rather than illustrative.

## Architecture

```
app/
  (site)/          public website — 40+ pages, fully SEO-configured
  admissions/      inside (site): apply wizard + applicant dashboard
  login/           authentication
  portal/
    parent/ pupil/ teacher/ admin/
  api/search/      public site search
  sitemap.ts robots.ts manifest.ts

components/
  ui/              shadcn (base-nova style, Base UI primitives)
  site/            public website composition
  portal/          portal shell, tables, charts, forms, dialogs
  admissions/      application wizard steps

lib/school/
  types.ts         the whole domain model — no `any` anywhere
  config.ts        school identity, fees, calendar, weighting, facilities
  seed.ts          deterministic demo data (390 pupils, 34 teachers, parent and result records…)
  store.ts         the single data-access seam
  data.ts          read accessors (server-only)
  auth.ts          sessions, roles, and the record-level access guards
  format.ts        money, dates, status maps, tones
  actions/         every write: auth, admissions, submissions, teaching, payments, portal
```

### Data layer

The specification recommends Convex + Clerk. Those need credentials that are not present in
this environment, so the platform ships with a **strongly-typed in-process store** seeded
deterministically at first access and cached on `globalThis`. Every read goes through
`lib/school/data.ts` and every write through `lib/school/actions/*` — nothing touches the seed
file directly.

That makes `store.ts` the only seam you need to replace: swap `getDb()` for a Convex client and
re-implement the accessors, and the 60+ pages above are unchanged. Mutations are already written
as server actions with server-side validation and authorisation, which is exactly the shape a
Convex mutation takes.

Data is in-memory, so it resets when the server restarts. Interactions during a session are real:
submitting an assignment, grading it, taking a register, entering results, paying an invoice,
booking a meeting and moving an application through its statuses all persist and cascade into
notifications and the audit log.

### Authorisation

Every boundary is enforced on the server, on every request:

- The session cookie is HTTP-only and HMAC-signed. It carries an opaque user id and nothing else —
  **roles are re-read from the database on every request**, so a client can never elevate itself.
- `requireUser` / `requireRole` / `requireAdmin` / `requireTeacher` / `requireParent` /
  `requirePupil` guard route segments through `unauthorized()` and `forbidden()`.
- `canAccessStudent` and `canAccessClass` guard *records*: a parent reaches only their own
  children, a pupil only themselves, a teacher only classes they teach.
- Uploads are validated on the server for MIME type and size (5 MB), never on the client alone.
- There is no online payment. Fees are paid at the bursary or by bank transfer, and a payment exists
  only once finance staff record it against an invoice.
- Administrative writes append to an audit log that ordinary administrators cannot edit.
- `/portal/*` is `noindex` in both `robots.txt` and a response header.

Verified by request: `parent → /portal/teacher` returns 403, `pupil → /portal/parent` returns 403,
and a parent requesting another family's child record returns 403.

## Design

- **Palette**: ivory, deep navy and warm gold. No pure white or pure black anywhere, in either
  theme. Tokens live in `app/globals.css`; light and dark are separately chosen, not flipped.
- **Type**: Nunito only, loaded through `next/font`.
- **Theme**: `next-themes`, class strategy, with light / dark / system.
- **Components**: shadcn throughout — Sheet for the mobile nav tray and portal tray, Select
  (never a native `<select>`), Dialog, Tabs, Accordion, Table, Command palette (⌘K), Sonner for
  rich toasts.
- **Charts**: dependency-free SVG and CSS on a single navy ramp, validated for monotone lightness,
  step separation and contrast against both surfaces. Every value is also written as text, so
  nothing depends on colour alone.
- **Imagery**: no photography ships with the build. Rather than link to third-party images that
  may disappear, the site renders deterministic on-brand `ToneImage` panels with proper
  `role="img"` labels. Swap this component for `next/image` when real photography exists.

## Accessibility

Built against WCAG 2.2 AA: semantic landmarks, a skip link, visible focus rings, labelled controls
and icon buttons, form errors tied to their field, `aria-current` on active navigation, tables with
proper headers, 44 px touch targets across the parent and pupil portals, and a global
`prefers-reduced-motion` override that disables every animation.

## What is deliberately stubbed

Clearly marked in the UI where it appears:

- File downloads (report cards, receipts, documents) — a live deployment streams these from
  private storage through short-lived signed URLs.
- Content authoring screens for news, events and gallery are read-only in this build; the data
  model behind them supports draft / scheduled / published / archived.

## Email and scheduled jobs

Every notice appears in the portal. Some kinds are also emailed to parents and staff (never pupils)
through [Resend](https://resend.com): the list is in `lib/school/email-notifications.ts`. Set these in
the Convex dashboard (Settings → Environment Variables); until they are set, notices stay in the portal only:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | API key from Resend |
| `RESEND_FROM` | Sender on a domain verified in Resend, e.g. `El-Bethel International Academy <notifications@elbethel.edu.ng>` |
| `SITE_URL` | Optional — where links in emails point (defaults to the live site) |

Every email is logged on **Admin → Notifications**, which also has a "send me a test" button.

`convex/crons.ts` runs two daily jobs: library due/overdue reminders, and the house-points
recalculation used by pupil stars.

## Demo clock

The app runs against a fixed date, **28 September 2026** (First Term of the 2026/2027 session), so
that dashboards are populated and server and client rendering always agree. It is a single
constant: `DEMO_TODAY` in `lib/school/seed.ts`.
