# FeeLeaks — Build Plan

Status (Oct 5, 2026): **Steps 1–8 built** on top of a demo store. Waiting on: Supabase (data that lasts), an Anthropic API key (AI structuring), VAPID keys (follow notifications), and Step 9 launch prep. Plan updated Oct 5, 2026 for PRD v3 (accountability features).

## Stack

| Part | Choice | Cost |
| --- | --- | --- |
| Website | Next.js + TypeScript + Tailwind, dark theme, mobile-first | Free |
| Hosting | Vercel free tier (`feeleaks.vercel.app` if available) | Free |
| Database + evidence files | Supabase free tier (Postgres + storage). Until it's connected, a demo store keeps data in a local file | Free |
| Anonymous identity | Signed private browser cookie (random device ID + funny usernames). The device ID is never stored next to reports | Free |
| AI structuring + flags + dashboard | Claude Haiku 4.5, called from the server only (key never in the browser) | Fraction of a rupee per report |
| Emailing | Gmail compose link, pre-filled | Free |
| Letters / RTI | Generated in the browser, downloaded by the parent | Free |
| Follow notifications | Standard browser Web Push (own VAPID keys, no third-party service) | Free |

## Build steps (each ends with how you run and test it)

**Step 0 — Setup**
- Git repo, Next.js app, dark theme, `.env.example` ✅
- Supabase project, deploy a placeholder to Vercel
- Test: open the live link on your phone

**Step 1 — Database and usernames**
- Tables: institutions (name, other spellings, type, city, state, board), reports (username, original text, structured fields, flags, created date), fee components, evidence files, "me too" confirmations (one per device per report)
- Accountability data, **empty until filled from verified sources**: rules, authorities, declared fees, inflation and email recipients. Kept as reviewed files in `src/data/` (every entry needs an official source link), so each change can be checked before it goes live
- Database schema for Supabase in `supabase/schema.sql`
- First visit creates a hidden anonymous ID and a funny username, kept on that browser. A device can hold more than one username (for "post under a fresh name")
- Test: open the site, see your username; open in another browser, get a different one

**Step 2 — Write a report**
- Text box with prompts ("which institution, what year, what class/course, what did they ask you to pay?") + evidence upload with a warning to cover names, roll numbers and phone numbers
- Identifying-details warning before publishing (section, siblings, joining date, child's name)
- "Post under a fresh name" option
- Test: write a report with a photo; it saves; post a second one under a fresh name and check the two names differ

**Step 3 — AI structuring and flags**
- Haiku turns the text into the structured fields and matches the institution to an existing page (or creates a new one). Class only, never section
- Haiku flags questionable fee items (donation / capitation, cash only / no receipt, forced purchase of books or uniform, fee on an RTE-EWS seat, refund refused). Flags link to a rule only when a verified rule exists for that state/board
- Preview screen: the reporter checks and edits the structured version and flags, then publishes
- Test: ~20 sample reports (schools, colleges, tuition centres, different spellings of the same institution, some with donation / no-receipt demands); you check the results

**Step 4 — Reports, institution pages and credibility**
- Each report: username, date, original text, fee breakdown, flags ("may be questionable — here's why"), evidence and evidence badges, "Me too" button and count
- Institution page: all its reports, fee range and median by class/course and year, all-in year-one cost, hidden-extras share, hike %, declared vs reported fee (when a declared fee exists), report / evidence / "Me too" counts
- Home: latest reports, headline stats
- Test: publish a few reports, tap "Me too" from another browser, see pages update

**Step 5 — Search and dashboard**
- Search by institution or city
- Dashboard: most expensive, steepest hikes (vs inflation once CPI figures are added), most flagged, by city and type, total reports and "Me too" confirmations
- Test: browse and filter on your phone

**Step 6 — Take action**
- "Your options" box on reports and institution pages: authority for that state/board with official link (shows "not added yet" until a verified entry exists)
- Letter generator: complaint to the authority, RTI application, request to the institution for the fee breakdown in writing. Pre-filled from the report, editable, downloaded as PDF / text. FeeLeaks sends nothing
- "Email this report" opens Gmail pre-filled (subject, summary, link). Recipient lists start empty. Warning: "this sends from your own Gmail, so the recipient will see your email address"
- Test: generate each letter from a report on your phone; tap the email button and check the Gmail draft

**Step 7 — Follow an institution**
- "Follow" button subscribes the browser to push notifications for that institution. No email or phone collected
- A new report on a followed institution sends a notification
- Test: follow an institution on your phone, publish a report for it from another browser, receive the notification

**Step 8 — Finish and share**
- About / disclaimer page, including how rules and declared fees are sourced
- Page titles and WhatsApp share previews per institution and report
- Test: share an institution link on WhatsApp and check the preview

**Step 9 — Launch prep**
- You choose 1–2 launch cities
- Fill rules, authorities and inflation figures for those states from official sources (I research and draft with links, you approve)
- Add declared fees with sources for well-known institutions in those cities
- Timed for just before school admission season
- Test: walk through the site as a parent in a launch city; every rule, authority and declared fee shows a working source link

Rough effort: Steps 0–5 give a usable site in about 2–3 weeks; Steps 6–9 about 1–2 more weeks.

## What I need from you

- Step 0: free Supabase and Vercel accounts (I'll walk you through it), and a GitHub account
- Step 3: an Anthropic API key (stored as a server secret, never in the code)
- Step 9: launch cities, and approval of each sourced rule / authority / declared fee before it goes live

## Defaults I've assumed (say if you want them different)

- Evidence photos are shown publicly on the report, with an upload warning to hide personal details
- A reporter can edit or delete their own reports from the same browser
- Losing the browser (cleared data or a new phone) means losing that username; reports stay published
- "Me too" is one tap per browser per report, anonymous, and can be undone
- Flag wording always says "may be questionable", never "illegal"
