@AGENTS.md

# FeeLeaks

Anonymous fee-reporting website for Indian educational institutions. Spec: docs/PRD.md. Plan: docs/BUILD_PLAN.md.

## Standing rules
- Follow docs/BUILD_PLAN.md one step at a time. After each step, say how to run and test it.
- Do not build anything the PRD lists as "deliberately not in this version" (moderation, AI safety checks, report button, takedown inbox, X/Twitter, login, send-from-FeeLeaks email) until the owner asks.
- AI (Claude Haiku 4.5) is used only to structure reports and power the dashboard. Call it server-side only.
- Never invent data: no made-up institutions, fees, or journalist/MP/MLA contacts. Recipient lists stay empty until the owner provides them.
- Reporters are anonymous: never store or display real names, emails or phone numbers of reporters.
- Ask before adding any paid service or recurring cost.
- Secrets only in environment variables; keep .env.example current.
- TypeScript only, dark theme, mobile-first. Named functions for event handlers (no anonymous inline handlers in JSX). File path comment at the top of every source file.
- Never commit or push without asking.
