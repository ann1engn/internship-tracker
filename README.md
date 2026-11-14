# Internship Tracker

A full stack web app for tracking internship applications, with autofill from job links and a conversion funnel that shows how far applications get.

**Live site:** https://internship-tracker-liard.vercel.app

<img width="1438" height="506" alt="image" src="https://github.com/user-attachments/assets/8c97840c-7931-4f95-8769-31b017eb5d81" />

## Features

- **Accounts and private data.** Sign up and sign in with email and password. Each user sees only their own applications.
- **Application tracking.** Add, edit, and delete applications with company, role, location, job link, stage, and status.
- **Autofill from a job link.** Paste a listing URL and the app fills in the role title, company, and location.
- **Type-to-add companies.** Typing a new company name creates it. Typing an existing one reuses it, so there are no duplicates.
- **Filters.** View applications by stage, or see only rejected or withdrawn ones.
- **Conversion analytics.** A funnel chart and table show how many applications reached each stage and the conversion rate between stages.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router |
| Charts | Chart.js (react-chartjs-2) |
| Backend | Supabase: PostgreSQL, Auth, Edge Functions (Deno) |
| Hosting | Vercel, with automatic deploys from GitHub |

## How it works

```
Browser (React)
   |
   |-- Supabase Auth ............ sign up, sign in, sessions
   |-- Supabase Data API ........ reads and writes PostgreSQL, filtered by Row Level Security
   |-- Edge Function fetch-job .. fetches a job listing server-side and returns its details
```

### Data model

- `companies`: one row per company
- `applications`: one row per role applied to, linked to a company by `company_id`
- `stage_events`: a log of every stage change, written automatically by a database trigger
- `interview_rounds`, `contacts`: defined in the schema for future features
- `application_funnel`: a view that counts applications reaching each stage

The full schema, with comments, is in [`supabase/schema.sql`](supabase/schema.sql).

## Design decisions

**Security is enforced in the database, not the frontend.** Frontend code runs in the browser, where anyone can change it. Every table has Row Level Security policies that restrict rows to `user_id = auth.uid()`, so the database refuses to return another user's data no matter what the client sends.

**Stage and status are separate columns.** Stage records how far an application got (Applied through Offer). Status records whether it is still active, rejected, or withdrawn. Keeping them apart means a rejection after an interview still counts as "reached interview" in the conversion rates.

**Companies are stored once and referenced by id.** Applications point to a company through a foreign key instead of repeating its name. The form hides this with a find-or-create step, so the user just types a name.

**Analytics are calculated in PostgreSQL.** The funnel is a database view. The React page only requests the result and draws it, so the calculation could change without touching the frontend.

**Job details are fetched by a serverless function.** Browsers block a page from reading other websites (CORS), so the fetch has to happen on a server. The function tries three sources in order of reliability:

1. The public Greenhouse Job Board API, for Greenhouse-hosted listings
2. The `JobPosting` structured data embedded in the page
3. The page title, as a fallback

It only requests public http and https addresses, re-checks every redirect, and times out after 8 seconds. Fetched details fill the form for the user to review. Nothing is saved automatically.

## Known limitations

- Autofill does not work on sites that require a login or block automated requests, such as LinkedIn. Those are entered by hand.
- The funnel assumes stages happen in order, so an application at Phone screen also counts toward Assessment.
- Renaming or deleting a company is done in the database, since the app has no company management screen.

## Run it locally

Requires Node.js 22.22 or newer and a free Supabase project.

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Deploy `supabase/functions/fetch-job/index.ts` as an Edge Function named `fetch-job`.
3. Copy `.env.example` to `.env.local` and add your Supabase Project URL and publishable key.
4. Install and start:

```
npm install
npm run dev
```

## What I would add next

- Interview rounds and recruiter contacts (the tables already exist)
- Time-based analytics from the stage log, such as average days from applying to a first interview
- Autofill support for more hiring platforms
