# ZS Events CRM: Runbook

Everyday jobs, in plain commands. Run them from this folder (`D:\ZSEventsCRM-live`) in PowerShell.

## Where everything lives

| Thing | Where |
|---|---|
| CRM (live) | https://crm.zsevents.in (Vercel team `zs-events`, project `zs-crm`) |
| Website (live) | https://zsevents.in (project `floworist-web`, source `D:\tmp\zs-web-edit`) |
| Database + logins | Supabase project `dzghfcqijwlqwxrjhvpr` (Tokyo) |
| Source code | GitHub `zsevents/ZS-crm` (CRM) and `zsevents/floworist-web` (website) |
| Errors | Sentry, project `zs-crm`, org `zs-events` |
| Android app | `D:\ZSEventsApp`. It only opens crm.zsevents.in, so CRM deploys reach it automatically |

Never deploy from the old `D:\ZSEventsCRM` folder: it has no database connection.

## Check that everything is healthy (30 seconds)

```powershell
npm run health
```

Checks both sites, certificates, the CRM API, the sign-in wall and the enquiry endpoint. GitHub also runs a version of this automatically and emails you if it fails.

## Ship a change

```powershell
git add -A
git commit -m "What changed"
git push origin main
npm run deploy
```

`npm run deploy` runs the type check, dead-code check, tests and build, deploys to production, then runs the health check. It stops if anything fails, so a broken build never goes live. Commits must be authored as zs.events62@gmail.com or Vercel will block the deploy.

## Undo a bad deploy

```powershell
vercel rollback --scope zs-events
```

On the free Hobby plan this only goes back one version. To go back further, find the older deployment's URL with `vercel ls zs-crm --scope zs-events` and run:

```powershell
vercel promote <that-url> --scope zs-events --yes
```

## Give someone CRM access

1. Supabase dashboard, Authentication, Users, then "Invite user" (or they sign up and you approve).
2. Supabase, SQL Editor, run (change the email and role):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"crm_access": true, "crm_role": "staff"}'
where email = 'person@example.com';
```

Roles: `admin` (everything, and the default if none is set), `staff`, `viewer` (read-only). Remove access by setting `"crm_access": false`.

## The CRM stopped working

1. Run `npm run health` to see what failed.
2. Supabase pauses free projects after a week without use. Open the Supabase dashboard and click **Restore project** if you see a paused banner.
3. Errors are in Sentry. Server logs: `vercel logs --scope zs-events --since 1h --no-follow`.

## Back up the data

The free Supabase plan has no automatic backups. At least monthly: Supabase dashboard, Table Editor, open each table (leads, customers, projects, quotations, invoices, payments), and export as CSV. Keep the files somewhere other than this computer. Supabase Pro adds daily backups.

## Secrets (set in Vercel, never in code)

`vercel env ls --scope zs-events` lists the names. Add or change one with `vercel env add NAME production --scope zs-events`, then redeploy.

| Name | What it does |
|---|---|
| `SMTP_PASS` | Gmail App Password. Without it, website enquiries are saved but no email is sent |
| `SENTRY_DSN` | Where server errors are reported |
| `SUPABASE_*`, `POSTGRES_*` | Database connection |
| `ALLOWED_ORIGINS` (optional) | Extra websites allowed to call the API, comma separated |

## Free-plan limits to watch

- **Vercel Hobby:** 100 GB traffic and 1 million function calls a month. Free for non-commercial use only; use Pro for client work.
- **Supabase Free:** 500 MB database, 5 GB traffic, pauses after 1 week idle, no backups.
- **GitHub Actions:** free for public repos. The private website repo gets 2,000 minutes a month, so its uptime check runs every 30 minutes.
- **Sentry free:** a few thousand errors a month.
