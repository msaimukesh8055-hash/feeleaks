# FeeLeaks — Product Brief (v3)

Oct 5, 2026 · @saimukesh

## Objective

Expose the high fees demanded by educational institutions across India: schools, colleges, universities and tuition centres. Parents and students share what they were actually asked to pay, so others know before they walk into an admission office.

Beyond publishing prices, FeeLeaks is an **accountability tool**: it shows the gap between what institutions *demand* and what they *declare* or are *allowed* to charge, and helps parents act on it.

## Problem

- **Hidden:** the real fee is only revealed at the admission office and negotiated family by family
- **Ambiguous:** admission fees, development funds, donations, capitation, transport and extras sit on top of tuition
- **Rising fast:** parents report 10–30% yearly hikes. LocalCircles' April 2026 survey: 7 in 10 parents say school fees rose 30–80% in 3 years
- **Rules exist but aren't enforced:** capitation bans, the RTE 25% quota, mandatory fee disclosure, state fee-regulation laws and hike caps. Parents rarely know them or how to use them
- Frustration today is scattered across WhatsApp groups, Reddit threads, parent associations and protests, and none of it becomes searchable data

## Who it's for

| User | When they come | What they need |
| --- | --- | --- |
| Parent choosing a school | Admission season (≈ Nov–Mar for schools) | The real all-in year-one cost, extras included |
| Parent already enrolled | When the hike circular arrives | Is this hike normal? Is it allowed? Are others pushing back? |
| Student (college / coaching) | Counselling and admission time | All-in cost, hostel, refund terms, management-quota "donations" |
| Journalist | Any time, peaks in admission season | Patterns across many reports, evidence, quotable numbers |
| Parent association / PTA | During a dispute | Proof the problem is widespread, not one family's complaint |

Parents choosing and enrolled parents bring the volume; journalists and parent associations bring the impact.

## How it works

1. **Anyone writes a report in plain English:** which institution, what they were asked to pay, for which year and class/course, and anything else they want to say
2. **Optional evidence:** photos or documents (fee receipts, circulars, messages)
3. **AI structures it:** institution name, type, city, year, class/course, fee components and amounts, total, and **flags** for fee items that may break existing rules. The reporter sees the structured version and can correct it before publishing
4. **Before publishing, the reporter is warned about identifying details** (section, sibling details, child's name) and can choose to post under a **fresh username**
5. **Published instantly** under a random funny username (e.g. "SleepyRickshaw_17"), by default the same name for all reports from that device
6. **Other parents tap "Me too"** to confirm they were asked the same, without writing their own report
7. **Parents act on it:** a "Your options" box shows who to complain to for that state and board, with ready-to-use complaint, RTI and fee-breakdown request letters the parent downloads and sends themselves
8. **Anyone can email it** to journalists, MPs and MLAs from their own Gmail (recipient lists added later)

## Decisions

| Topic | Decision |
| --- | --- |
| Name | FeeLeaks |
| Coverage | Any educational institution anywhere in India: schools, colleges, universities, tuition centres |
| Reporter identity | Anonymous. Random funny username per device, Reddit-style. No login. Option to post a report under a fresh name so reports can't be linked |
| Input | Free text in English + optional evidence. No pick lists |
| AI use | **Only** to structure reports (including flagging questionable fee items) and power the dashboard. Not used for safety or moderation until you say so |
| Visibility | Individual reports (story + structured breakdown + evidence) **and** totals per institution |
| Minimum reports | None. A report shows as soon as it's posted |
| Moderation | None. No "report a problem" button |
| Credibility | Built without moderation: "Me too" counts, evidence badges, report counts, and range + median instead of averages |
| Accountability | Demanded vs declared vs allowed. Every rule, authority and declared fee shown on the site carries an official source link. Nothing is shown without a source |
| X / Twitter | Removed: it would expose the reporter |
| Journalists, MPs, MLAs | Email via the user's own Gmail (pre-filled). Recipient addresses added later |
| Letters and RTI | Generated on the site, downloaded and sent by the parent. FeeLeaks sends nothing |
| Follow an institution | Browser push notifications only (no email or phone collected) |
| Money | Free for everyone. Never take money from reported institutions or edtech companies. No ads |
| Launch | 1–2 cities first, timed just before admission season |
| Domain | None for now. Free `*.vercel.app` address |
| Language | English only |

## What a structured report contains

| Field | Example |
| --- | --- |
| Institution | Name as the AI recognises it, matched to an existing page or a new one |
| Type | School / college / university / tuition centre / other |
| City, state | Bengaluru, Karnataka |
| Board / affiliation | ICSE, IB, CBSE, state board, university name (if mentioned) |
| Academic year | 2026-27 |
| Class / course | Grade 1, B.Tech CSE, NEET coaching… (class only, never section) |
| Admission type | New admission / continuing / management quota / RTE-EWS seat… |
| Fee components | Tuition, admission, development fund, donation / capitation, transport, books & uniform, hostel, other — each with ₹ amount |
| Total | ₹ (as reported, or the sum of components) |
| Hike | % vs last year, if mentioned |
| Flags | e.g. "donation / capitation demanded", "cash only, no receipt", "must buy books/uniform from school", "fee charged on an RTE-EWS seat", "refund refused". Each links to the rule it may break |
| Original text | Shown as written |

## Accountability features

**Demanded vs declared vs allowed**
- **Questionable-item flags** (from AI structuring): shown on the report as "may be questionable — here's why", with the rule and its official source
- **Declared fee:** the institution's own published fee (e.g. CBSE mandatory public disclosure) entered with a source link and date, labelled "declared by institution", shown next to what parents report
- **Rules library:** state and board rules (capitation bans, RTE section 13 and 12(1)(c), state fee-regulation laws and hike caps, forced-purchase rules, UGC refund rules). Every entry has an official source. Entries are added only once verified

**"What will I really pay?"**
- All-in year-one cost per institution and class (tuition + admission + development + transport + books & uniform…)
- Hidden-extras share: how much of the total is not tuition
- Fee range by class, comparable with the same class at other institutions in the city

**"Is this hike normal?"**
- Hike history per institution, combining all reports
- Hike compared with inflation (official CPI figures, sourced) and with same-type institutions in the same city

**"Am I alone?"**
- "Me too" button on every report, one per device per report
- Evidence badges: "receipt attached", "circular attached"

**"What can I do about it?"**
- "Your options" box per state and board: the authority to complain to (district education officer, state fee committee, board regional office, university…) with official links
- Letter generator: complaint to the authority, RTI application (e.g. for the institution's fee approval), and a request to the institution for the fee breakdown in writing. Filled in from the report, downloaded, sent by the parent

**"Tell me when something changes"**
- Follow an institution with browser push notifications. No email or phone number collected

## Reporter protection

- Warning before publishing about details that identify a family (section, joining date, siblings, child's name). The structured fields hold class only, never section
- "Post under a fresh name" option so several reports can't be linked to one person
- Evidence upload warning to cover names, roll numbers and phone numbers
- Gmail email button warns that the recipient will see the sender's address

## Pages

- **Home:** "Leak a fee" button, search, latest reports, headline stats
- **Write a report:** text box, evidence upload, AI-structured preview with edit and flags, identifying-details warning, fresh-name option, publish
- **Report:** story, breakdown, flags, evidence, "Me too", email button, "Your options"
- **Institution page:** every report, declared vs reported fee, all-in year-one cost by class/course and year, hidden-extras share, hike trend vs inflation, evidence and "Me too" counts, follow button, "Your options"
- **Take action:** letter and RTI generator
- **Dashboard:** most expensive, steepest hikes vs inflation, most flagged (capitation, no receipt…), by city and type, totals reported
- **Search:** by institution name or city
- **About / disclaimer:** "reports are submitted by users and not verified by FeeLeaks"; how rules and declared fees are sourced

## Business model

- Free for everyone. Running costs stay near zero (free tiers + a fraction of a rupee per report for AI)
- Funding options, in order: donations; civic-tech and education-transparency grants; partnerships with parent associations; later, aggregated anonymised data for journalists and researchers (free with attribution first)
- Never: money from reported institutions or edtech companies, ads, paid features for parents

## Launch

- Start in 1–2 cities (to be chosen) so institution pages fill up
- Launch just before school admission season
- Seed through parent WhatsApp groups, city subreddits and existing fee-protest parent associations
- Add declared fees (with sources) for well-known institutions in the launch cities so their pages aren't empty

## Deliberately not in this version

- Moderation of any kind (human or AI), including automatic blurring of evidence
- Takedown / complaint inbox
- Sending email or letters from a FeeLeaks address (planned: keeps reporters anonymous to recipients)
- X / Twitter sharing
- Login, domain, languages other than English
- Ads, paid features, money from institutions or edtech

## Known risks (accepted for now)

- **Legal notices:** institutions may demand removal or threaten defamation action against the site owner. A takedown route is normally needed to keep a platform's legal protection under India's IT rules. **Revisit before promoting the site widely**
- **Fake or wrong reports:** nothing stops false numbers or a rival posting against an institution. Partly offset by "Me too" counts, evidence badges and median-based figures
- **Retaliation against reporters:** a family whose child is still enrolled can be identified from details. Offset by the identifying-details warning and fresh-name option
- **Personal data in evidence:** photos may show a child's name or a parent's phone number. Uploaders get a clear warning to cover these
- **Gmail emails reveal the sender:** the journalist / MP / MLA sees the reporter's email address. The button warns about this
- **Wrong legal information:** a mis-stated rule could mislead parents. Every rule shows its official source and wording says "may be questionable", never "illegal"

## Success criteria

- [ ] Writing and publishing a report takes under 2 minutes on a phone
- [ ] AI structures at least 9 in 10 test reports correctly, incl. matching the same institution written different ways and flagging questionable items
- [ ] Institution pages and dashboard update as soon as a report is published
- [ ] First 100 real reports in the launch cities
- [ ] Reports with "Me too" confirmations from other parents
- [ ] Parents downloading complaint / RTI letters
- [ ] A news story citing FeeLeaks data
- [ ] Institution pages appear in Google for "<institution> fees"

## Later

- Send from a FeeLeaks address (anonymous to recipients)
- MP / MLA recipients (reuse OnRecord's sourced MLA directory) and journalist list
- AI safety checks (incl. automatic blurring of evidence), a report button, takedown inbox (when you decide)
- Aggregated data downloads for journalists and researchers
- Custom domain, regional languages
