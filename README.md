# Internship Tracker

Track internship applications, deadlines, interview rounds, recruiter
contacts, and follow-ups, with conversion analytics by stage.

Stack: React (Vite), Supabase (Auth + PostgreSQL), Chart.js.

## First-time setup

You need Node.js 22.22 or newer (the current LTS from nodejs.org works).

### 1. Create the database

1. Sign in at supabase.com and create a new project. Save the database
   password it asks for somewhere safe.
2. In the left sidebar open **SQL Editor**, click **New query**.
3. Open `supabase/schema.sql` from this folder, copy everything, paste
   it into the editor, and click **Run**. You should see "Success".
4. Open **Table Editor**. You should see five tables: companies,
   applications, interview_rounds, contacts, stage_events.

### 2. Connect the app to your project

1. In Supabase click **Connect** at the top of the dashboard and find
   your **Project URL** and **Publishable key**.
2. In this folder, make a copy of `.env.example` named `.env.local`.
3. Paste the two values into `.env.local` and save.

### 3. Run the app

Open a terminal in this folder and run:

    npm install
    npm run dev

Open the address it prints (usually http://localhost:5173).

### 4. Check that everything works

1. Click "Create an account" and sign up with your email.
2. Open the confirmation email from Supabase and click the link.
3. Sign in. The Applications page should say
   "Database connected. You have 0 companies saved."

## Project map

    supabase/schema.sql          tables, security rules, analytics view
    src/main.jsx                 app starting point
    src/App.jsx                  which URL shows which page
    src/lib/supabase.js          the connection to Supabase
    src/context/AuthContext.jsx  who is logged in
    src/components/              shared pieces (layout, route guard)
    src/pages/                   one file per screen
    src/index.css                all styling

## Build order

- [x] Database schema and security policies
- [x] Sign up, sign in, protected pages
- [ ] Companies: list, add, edit, delete
- [ ] Applications: list, add, edit, delete, change stage
- [ ] Interview rounds and contacts
- [ ] Upcoming deadlines and follow-ups
- [ ] Conversion chart (Chart.js)
- [ ] Deploy
