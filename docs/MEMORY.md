# FeeLeaks — Project memory

Saved Oct 5, 2026. Everything decided and built so far, so any new session can pick up without the old conversation. Read with CLAUDE.md, docs/PRD.md (v3) and docs/BUILD_PLAN.md.

## Where things are

- **Live site:** https://feeleaks.vercel.app (Vercel deploys `main`)
- **Repo:** github.com/msaimukesh8055-hash/feeleaks
- **Working branch:** `ccr-f9c790ba-0gw5o8`. Workflow: commit after each step (owner said yes), push the branch, open a PR, merge to `main`
- **Last merged:** PR #5 "Reddit-style votes and comments, region-only filter, dashboard panel" (merge `f50ea24`). Checked live: dashboard shows the panel, the Delhi filter shows 3 stories, `/cases/31` loads

## What the owner wants (in their words, summarised)

- An anonymous site where parents and students expose real fees at Indian schools, colleges, universities and tuition centres
- Built for **accountability**, not just prices: what institutions demand vs declare vs are allowed to charge, and what parents can do about it. The owner said to build every accountability feature proposed (now PRD v3)
- Build as much as possible on the existing Vercel site; **Supabase later**, set up by the owner
- **"In parents' words"** (owner likes this heading): real cases from news, Reddit and other sources, shown with **named institutions as they are**, and **only the parents' own words**. No "built from public sources" label. Source links stay in the backend (docs/research) and are given on request
- Region filter must be strict: picking Delhi shows Delhi only
- Cases should look and work like Reddit: upvotes, downvotes, comments, replies
- The dashboard must never look empty

## Decisions and lines not to cross

- Never invent anything: no made-up institutions, fees, contacts, or quotes. When the owner asked for stories rewritten in the first person, only verbatim quotes that a news source printed were used; nothing was paraphrased into a parent's mouth
- Never copy a child's or parent's name from an article
- Reporters stay anonymous: random funny username per browser, option for a fresh name, no login, no email or phone collected
- AI (Claude Haiku 4.5, `claude-haiku-4-5`) only structures reports and powers the dashboard, server-side only. Without `ANTHROPIC_API_KEY` the site falls back to manual entry. The key is paid per use, so get the owner's OK first
- Rules, authorities, declared fees, inflation figures and recipient lists (`src/data/`) stay empty until each entry has an official source. Journalist, MP and MLA lists stay empty until the owner provides them
- Not in this version: moderation (incl. auto-blur), report button, takedown inbox, sending from a FeeLeaks address, X/Twitter, login, domain, other languages, ads, money from institutions or edtech
- Free for everyone. Funding later via donations and grants

## Built so far (BUILD_PLAN Steps 1–8)

- **Leak a fee** (`/leak`): free text and optional evidence. Evidence is compressed in the browser to JPEG, which strips EXIF; the server accepts JPEG or PDF only and strips JPEG metadata. Then an AI-structured preview you can edit, questionable-item flags, an identifying-details warning, an optional fresh name, and publish
- **Report page:** story, breakdown, flags, evidence badges, Me too, edit or delete by the owner's browser, "Your options", letters (complaint, RTI, fee-breakdown request), email via own Gmail (with warning), share, OG image
- **Institution page:** all reports, declared vs reported, year-one cost by class, hidden-extras share, hike history vs inflation, Follow (web push), OG image
- **Dashboard:** opens with "In parents' words", then parents' reports (most expensive, steepest hikes, most flagged, by city and type, totals)
- **Search:** institutions and published cases
- **In parents' words** (`/cases`, `/cases/N`): region chips (`?region=slug`), sort (`?sort=top|discussed`), Reddit-style cards with votes, story page with threaded comments under anonymous names
- About and disclaimer, sitemap, robots, manifest, icons
- Tests: 21 vitest tests (`npm test`)

## How it works (technical)

- Next.js 16.3.8 App Router (async params, `proxy.ts`, Server Actions, `after()`), React 19.2, Tailwind v4 dark theme (`--background #0b0d10`, `--accent #f5b301`), TypeScript. Run `npx next typegen` if `PageProps` types go missing
- **Identity:** signed httpOnly cookie `fl_id` (HMAC with `IDENTITY_SECRET`) holding device ID and usernames. Keys per target (owner, metoo, vote, comment) are HMACs, so actions can't be linked across reports
- **Storage:** `Store` interface (`src/lib/store/`). `DemoStore` writes a JSON file (`.data/` locally, `/tmp` on Vercel). `SupabaseStore` is used when `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are set. On Vercel without Supabase, `canSaveReports()` is false, so publishing, Me too, Follow, votes and comments are switched off (this fixed the 404 after publish)
- **Cases pipeline:** `docs/research/public-fee-cases.md` (36 cases, 53 named institutions, with sources) → `npm run cases` → `src/data/public-cases.ts` → `src/data/published-cases.ts` (only the 11 cases with verbatim parent quotes, words only, no sources)
- **Database:** `supabase/schema.sql` (full schema incl. votes and comments, private `evidence` bucket, RLS on with no public policies), plus `supabase/migrations/002_votes_comments.sql`
- **Env vars** (`.env.example`): `IDENTITY_SECRET`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_SITE_URL`, `FEELEAKS_DATA_DIR`

## Next steps (when the owner says go)

1. **Supabase:** create a project (Mumbai region), run `supabase/schema.sql` in the SQL editor, and add `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `IDENTITY_SECRET` in Vercel for all environments. Then redeploy and check publishing, Me too, votes and comments on the live site
2. Optional: `ANTHROPIC_API_KEY` (paid, needs the owner's OK) and VAPID keys for Follow
3. **More cases:** Reddit and some big newspapers block automated reading. The owner can paste links or text to add more
4. **Step 9, launch prep:** choose 1–2 launch cities; add sourced rules, authorities and declared fees for them; time the launch before admission season (about Nov–Mar)

## Open questions

- **Legal risk:** institutions may send takedown or defamation notices, and a takedown route is normally needed to keep platform protection under India's IT rules. Decide this before promoting the site widely
- Whether the owner wants PRs watched for CI and review comments
