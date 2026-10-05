# FeeLeaks

Anonymous, parent- and student-reported fees for Indian schools, colleges, universities and tuition centres.

- Product brief: [docs/PRD.md](docs/PRD.md)
- Build plan: [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md)

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in values (all optional for a first look)
npm run dev
```

Open http://localhost:3000.

Without a database the site runs in **demo mode**: data is kept in `.data/demo.json` (delete the folder to start fresh).
On Vercel, demo mode can't share data between pages, so publishing is switched off there until Supabase is connected.

To connect Supabase: run `supabase/schema.sql` once in the Supabase SQL editor, then set `SUPABASE_URL` and
`SUPABASE_SECRET_KEY`.
Without `ANTHROPIC_API_KEY`, reporters fill in the fee breakdown by hand.
Without VAPID keys, the "Follow" button is hidden.

## Checks

```bash
npm test         # unit tests (fee maths, matching, letters, evidence, push)
npm run lint
npx tsc --noEmit
npm run build
```

## Where things live

| Path | What |
| --- | --- |
| `src/app/leak` | Write a report → AI structuring → review → publish |
| `src/app/report/[id]` | Report page, edit, "Take action" letters |
| `src/app/institution/[slug]` | Institution page, follow |
| `src/app/dashboard`, `src/app/search` | Dashboard and search |
| `src/lib/ai/structure.ts` | Claude Haiku 4.5 structuring (server only) |
| `src/lib/store` | Storage interface; demo file store today, Supabase later |
| `src/lib/identity` | Anonymous browser identity and funny usernames |
| `src/data` | Sourced rules, authorities, declared fees, inflation, recipients — empty until verified |
| `supabase/schema.sql` | Database schema to run when Supabase is set up |
