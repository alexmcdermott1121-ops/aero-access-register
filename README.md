# AERO Key & Access Register

Private Netlify-ready React app for AERO Apartments committee and building management governance.

It tracks approved access arrangements, safe key/fob/remote labels, inspection access, contractor access, conditions, approval source, status, expiry dates, returned or revoked access, and audit notes.

Important: do not store actual passcodes, alarm codes, lockbox codes, safe codes, sensitive key cuts, or similar secrets in this app. Use labels such as "Common area key", "Garage remote", "Contractor access set 01", or "Fire services contractor access".

## What is included

- Vite + React + TypeScript
- Supabase Auth login
- Supabase database tables and Row Level Security
- Admin and viewer roles through `allowed_users`
- Dashboard, register, add/edit form, detail page, audit log, reports, print view, and CSV export
- Safe demo/setup mode when Supabase is not configured
- Netlify build settings in `netlify.toml`

## 1. Create a Supabase project

1. Go to [Supabase](https://supabase.com/).
2. Create an account or sign in.
3. Choose **New project**.
4. Enter a project name, choose a password, and select a region close to your users.
5. Wait for Supabase to finish creating the project.

## 2. Run `schema.sql`

1. In Supabase, open your project.
2. Go to **SQL Editor**.
3. Choose **New query**.
4. Open `supabase/schema.sql` from this project.
5. Paste the full SQL into the Supabase SQL editor.
6. Click **Run**.

This creates:

- `allowed_users`
- `access_register`
- `access_audit_log`
- Row Level Security policies
- a placeholder admin user: `alexmcdermott1121@gmail.com`
- safe sample records

## 3. Find your Supabase URL and anon key

1. In Supabase, go to **Project Settings**.
2. Open **API**.
3. Copy the **Project URL**.
4. Copy the **anon public** key.

Do not copy the `service_role` key into this React app.

## 4. Add a local `.env` file

Create a file named `.env` in the project root:

```bash
VITE_SUPABASE_URL=https://grwtavpmxmxjeecmfrjj.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Only these two frontend variables are needed.

## 5. Run locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open the local URL shown in your terminal.

## 6. Add login users

1. In Supabase, go to **Authentication**.
2. Add or invite a user with the same email listed in `allowed_users`.
3. To add more allowed users, open the `allowed_users` table and add their email.
4. Use role `admin` for create/edit/delete access.
5. Use role `viewer` for read-only access.

## 7. Deploy on Netlify

Recommended beginner method: connect this project to GitHub, then let Netlify build it.

1. Create a GitHub repository for this project.
2. Upload or push all project files to that repository.
3. In [Netlify](https://www.netlify.com/), choose **Add new site**.
4. Choose **Import an existing project**.
5. Connect GitHub and select the repository.
6. Netlify should detect:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Deploy the site.

## 8. Add Netlify environment variables

1. In Netlify, open your site.
2. Go to **Site configuration**.
3. Open **Environment variables**.
4. Add:
   - `VITE_SUPABASE_URL` = `https://grwtavpmxmxjeecmfrjj.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your Supabase publishable anon key
5. Redeploy the site.

## Security warning

Never expose the Supabase `service_role` key in the frontend, Netlify public variables, or browser code. This app only uses:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The database security is enforced with Supabase Auth and Row Level Security.
