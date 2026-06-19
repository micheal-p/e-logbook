# Caleb University E-Logbook

A SIWES-style electronic logbook: daily task entries, monthly summaries, and
supervisor sign-offs, with five roles each restricted to what they're allowed
to see and do. Built with **Nuxt 4** (Vue 3, `<script setup>`), `@nuxtjs/supabase`,
Tailwind CSS, and Supabase (Postgres + Auth + Storage + RLS).

## Roles
| Role | Can do |
|------|--------|
| `student` | CRUD their own daily entries + monthly summaries, upload images, read supervisor comments/approvals |
| `company_supervisor` | Read + approve + comment on assigned students' daily tasks |
| `supervisor` (academic) | Read everything for assigned students; comment, approve, **grade** (no edit/delete) |
| `admin` (school board) | See all students/supervisors + progress; assign students; promote users to roles |
| `super_admin` (IT) | Full read; apply the final stamp on entries/summaries |

Permissions are enforced by **Supabase Row Level Security**, not just the UI.

---

## First-time setup

### 1. Environment
`.env` (already gitignored) holds the **publishable** key — never the secret key:
```
SUPABASE_URL=https://YOURPROJECT.supabase.co
SUPABASE_KEY=sb_publishable_xxxxxxxx
```

### 2. Install + run
```bash
npm install
npm run dev      # http://localhost:3000
```

### 3. Database
In the Supabase dashboard → **SQL Editor**, run these two files in order:
1. `supabase/migrations/0001_init.sql` — tables, RLS policies, triggers
2. `supabase/migrations/0002_storage.sql` — the `logbook-media` storage bucket + policies

Confirm under **Table Editor** that RLS shows "enabled" on every table.

### 4. Branding (already included)
The real Caleb University logo (`public/caleb-logo.png`) and campus images
(`campus-gate.webp`, `campus-event.jpg`, `campus-tech.jpg`) are bundled, and the
Tailwind theme uses the real brand palette: navy `#021E40`, cyan `#00AFEF`,
green `#00A859`. There are public marketing pages at `/` (home), `/about`
(Caleb), and `/siwes` (SIWES) that don't require login. Swap the images in
`public/` to update them.

### 5. Seed the non-student accounts
Students self-register. Create the others manually:
1. **Authentication → Users → Add user** — create the IT (super admin) and
   school-board (admin) accounts. This fires the trigger and makes a `student`
   profile for each.
2. Promote them: easiest is to log in as the **admin** and use the role
   dropdown on the Overview page. (To bootstrap the very first admin, set its
   `role` to `admin` directly in **Table Editor → profiles**.)
3. Supervisors: have them sign up, then the admin promotes them to
   `supervisor` / `company_supervisor`.

### 6. Auth URLs (for email links + production)
**Authentication → URL Configuration** → set Site URL and add your Vercel URL
to the redirect allow-list. The password-reset link returns to `/update-password`.

---

## RLS sanity check
Log in as a supervisor and try to edit a student's entry via the browser
console / network tab — the database must reject it. There is **no** UPDATE/DELETE
policy on `entries`/`summaries` for any role except the owning student, so
supervisors and admins physically cannot edit student content.

## Deploy (Vercel)
1. Push to GitHub (verify `.env` is **not** committed).
2. Import the repo into Vercel (auto-detects Nuxt).
3. Add `SUPABASE_URL`, `SUPABASE_KEY` (publishable), and `SUPABASE_SERVICE_KEY`
   (secret, server-only — for admin account-creation) as environment variables.
   Do NOT add `SUPABASE_DB_URL` (local migrations only).
4. Deploy, then do step 6 above with the live URL.

## Project layout
```
app/
  components/   AppLogo, StatusPill, EntryForm, EntryCard, EntryFeedback,
                StudentLogbook, AssignedStudents
  composables/  useProfile (role + cached profile)
  middleware/   role.global.ts (role-based routing; RLS is the real guard)
  layouts/      default (dashboard shell), auth (login pages)
  pages/        login, signup, reset-password, update-password, confirm,
                student/, company/, supervisor/, admin/, super-admin/
supabase/migrations/  0001_init.sql, 0002_storage.sql
```
