# JS Quest

A learning-focused React application with a 100-question JavaScript fundamentals quiz, immediate explanations, saved progress, pass/fail results, and unlimited attempt history.

The app is deliberately written in plain JavaScript so a Flutter developer can learn React concepts before migrating to TypeScript. When Supabase is not configured, it runs as a fully interactive three-question browser demo.

## 1. Run the local demo

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Enter any 2–40 character name and complete the three-question preview.

## 2. Connect Supabase

The Supabase project must have **Anonymous Sign-Ins** enabled:

1. Open your Supabase project.
2. Go to **Authentication → Providers → Anonymous Sign-Ins**.
3. Enable anonymous sign-ins and save.
4. Open **SQL Editor**, paste `supabase/setup.sql`, and run it.
5. Paste `supabase/seed_questions.sql` into a new query and run it.
6. Open the project's **Connect** dialog and copy the Project URL and publishable key.
7. Replace the placeholders in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

Restart `npm run dev` after changing environment variables. The purple demo banner disappears when the configuration is valid.

The publishable key is expected to be visible in browser code. Row Level Security and the database functions protect private data. Never put a `service_role` key in this project.

## 3. Quality checks

```bash
npm run lint
npm test
npm run build
npm run preview
```

## 4. Deploy with GitHub and Vercel

1. Create an empty GitHub repository named `js-basics-quiz`.
2. Commit this project and push its `main` branch to GitHub.
3. In Vercel, select **Add New → Project** and import the repository.
4. Keep the detected Vite build settings (`npm run build`, output directory `dist`).
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to Production and Preview environment variables.
6. Deploy, then test `/`, `/dashboard`, and a refreshed quiz URL. `vercel.json` sends SPA routes to `index.html`.

Supabase hosts Auth, Postgres, and the Data API. Vercel hosts the React files.

## Project map

```text
src/
├── components/     Reusable UI pieces (like small Flutter widgets)
├── context/        Shared session state (similar to Provider)
├── data/           Three-question offline demo data
├── hooks/          Reusable React behavior
├── lib/            Supabase client initialization
├── pages/          Route-level screens
├── services/       Data operations, separate from UI
└── utils/          Pure validation and scoring helpers
supabase/
├── setup.sql       Tables, RLS policies, and secure RPC functions
└── seed_questions.sql
```

Read [LEARNING_GUIDE.md](LEARNING_GUIDE.md) for the Flutter-to-React explanation and TypeScript migration path.

## Identity limitation

The name screen creates an anonymous Supabase user. The session survives refreshes and future visits in the same browser, but it cannot be recovered after clearing browser data or moving to another device. Names are display-only and do not need to be unique.
