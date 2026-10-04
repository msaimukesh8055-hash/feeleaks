# FeeLeaks — Build Plan

Status: **awaiting your "go ahead".** No code written.

## Stack

| Part | Choice | Cost |
| --- | --- | --- |
| Website | Next.js + TypeScript + Tailwind, dark theme, mobile-first | Free |
| Hosting | Vercel free tier (`feeleaks.vercel.app` if available) | Free |
| Database + evidence files | Supabase free tier (Postgres + storage) | Free |
| Anonymous identity | Supabase anonymous sign-in per browser + random funny username | Free |
| AI structuring + dashboard | Claude Haiku 4.5, called from the server only (key never in the browser) | Fraction of a rupee per report |
| Emailing | Gmail compose link, pre-filled | Free |

## Build steps (each ends with how you run and test it)

**Step 0 — Setup**
- Git repo, Next.js app, dark theme, `.env.example`, Supabase project, deploy a placeholder to Vercel
- Test: open the live link on your phone

**Step 1 — Database and usernames**
- Tables: institutions (name, other spellings, type, city, state), reports (username, original text, structured fields, created date), fee components, evidence files
- First visit creates a hidden anonymous ID and a funny username, kept on that browser
- Test: open the site, see your username; open in another browser, get a different one

**Step 2 — Write a report**
- Text box with prompts ("which institution, what year, what class/course, what did they ask you to pay?") + evidence upload with a warning to cover names and phone numbers
- Test: write a report with a photo; it saves

**Step 3 — AI structuring**
- Haiku turns the text into the structured fields and matches the institution to an existing page (or creates a new one)
- Preview screen: the reporter checks and edits the structured version, then publishes
- Test: ~15 sample reports (schools, colleges, tuition centres, different spellings of the same institution); you check the results

**Step 4 — Institution pages and report feed**
- Each report: username, date, original text, fee breakdown, evidence
- Institution page: all its reports, fee range by class/course and year, hike %
- Home: latest reports
- Test: publish a few reports and see pages update

**Step 5 — Search and dashboard**
- Search by institution or city
- Dashboard: most expensive, steepest hikes, by city and type, total reports
- Test: browse and filter on your phone

**Step 6 — Email to journalists / MPs / MLAs**
- "Email this report" opens Gmail pre-filled (subject, summary, link to the report)
- Recipient lists start empty, ready for addresses you provide later
- Clear warning: "this sends from your own Gmail, so the recipient will see your email address"
- Test: tap the button and check the Gmail draft

**Step 7 — Finish and share**
- About / disclaimer page; page titles and WhatsApp share previews per institution
- Test: share an institution link on WhatsApp and check the preview

Rough effort: Steps 0–5 give a usable site in about 1–2 weeks.

## What I need from you

- Step 0: free Supabase and Vercel accounts (I'll walk you through it), and a GitHub account
- Step 3: an Anthropic API key (stored as a server secret, never in the code)

## Defaults I've assumed (say if you want them different)

- Evidence photos are shown publicly on the report, with an upload warning to hide personal details
- A reporter can edit or delete their own reports from the same browser
- Losing the browser (cleared data or a new phone) means losing that username; reports stay published
