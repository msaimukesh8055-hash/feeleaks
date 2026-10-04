# FeeLeaks — Product Brief (v2)

Oct 4, 2026 · @saimukesh

## Objective

Expose the high fees demanded by educational institutions across India: schools, colleges, universities and tuition centres. Parents and students share what they were actually asked to pay, so others know before they walk into an admission office.

## Problem

- **Hidden:** the real fee is only revealed at the admission office and negotiated family by family
- **Ambiguous:** admission fees, development funds, donations, capitation, transport and extras sit on top of tuition
- **Rising fast:** parents report 10–30% yearly hikes. LocalCircles' April 2026 survey: 7 in 10 parents say school fees rose 30–80% in 3 years
- Frustration today is scattered across WhatsApp groups, Reddit threads, parent associations and protests, and none of it becomes searchable data

## How it works

1. **Anyone writes a report in plain English:** which institution, what they were asked to pay, for which year and class/course, and anything else they want to say
2. **Optional evidence:** photos or documents (fee receipts, circulars, messages)
3. **AI structures it:** institution name, type, city, year, class/course, fee components and amounts, total. The reporter sees the structured version and can correct it before publishing
4. **Published instantly** under a random funny username (e.g. "SleepyRickshaw_17"), the same name for all reports from that device
5. **Anyone can email it** to journalists, MPs and MLAs from their own Gmail (recipient lists added later)

## Decisions (Oct 4, 2026)

| Topic | Decision |
| --- | --- |
| Name | FeeLeaks |
| Coverage | Any educational institution anywhere in India: schools, colleges, universities, tuition centres |
| Reporter identity | Anonymous. Random funny username per device, Reddit-style. No login |
| Input | Free text in English + optional evidence. No pick lists |
| AI use | **Only** to structure reports and power the dashboard. Not used for safety or moderation until you say so |
| Visibility | Individual reports (story + structured breakdown + evidence) **and** totals per institution |
| Minimum reports | None. A report shows as soon as it's posted |
| Moderation | None. No "report a problem" button |
| X / Twitter | Removed: it would expose the reporter |
| Journalists, MPs, MLAs | Email via the user's own Gmail (pre-filled). Recipient addresses added later |
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
| Class / course | Grade 1, B.Tech CSE, NEET coaching… |
| Admission type | New admission / continuing / management quota… |
| Fee components | Tuition, admission, development fund, donation / capitation, transport, books & uniform, hostel, other — each with ₹ amount |
| Total | ₹ (as reported, or the sum of components) |
| Hike | % vs last year, if mentioned |
| Original text | Shown as written |

## Pages

- **Home:** "Leak a fee" button, search, latest reports, headline stats
- **Write a report:** text box, evidence upload, AI-structured preview with edit, publish
- **Institution page:** every report for it, fee range by class/course and year, hike trend, evidence count
- **Dashboard:** most expensive institutions, steepest hikes, by city and type, totals reported
- **Search:** by institution name or city
- **About / disclaimer:** "reports are submitted by users and not verified by FeeLeaks"

## Deliberately not in this version

- Moderation of any kind (human or AI)
- Takedown / complaint inbox
- Sending email from a FeeLeaks address (planned: keeps reporters anonymous to recipients)
- X / Twitter sharing
- Login, domain, languages other than English

## Known risks (accepted for now)

- **Legal notices:** institutions may demand removal or threaten defamation action against the site owner. A takedown route is normally needed to keep a platform's legal protection under India's IT rules
- **Fake or wrong reports:** nothing stops false numbers or a rival posting against an institution
- **Personal data in evidence:** photos may show a child's name or a parent's phone number. Uploaders get a clear warning to cover these
- **Gmail emails reveal the sender:** the journalist / MP / MLA sees the reporter's email address. The button warns about this

## Success criteria

- [ ] Writing and publishing a report takes under 2 minutes on a phone
- [ ] AI structures at least 9 in 10 test reports correctly, incl. matching the same institution written different ways
- [ ] Institution pages and dashboard update as soon as a report is published
- [ ] First 100 real reports
- [ ] Institution pages appear in Google for "<institution> fees"

## Later

- Send from a FeeLeaks address (anonymous to recipients)
- MP / MLA recipients (reuse OnRecord's sourced MLA directory) and journalist list
- AI safety checks, a report button, takedown inbox (when you decide)
- Custom domain, regional languages
