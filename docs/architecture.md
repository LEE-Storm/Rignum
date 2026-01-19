# Architecture Overview

## Purpose
This document describes the high-level technical architecture and project structure.

The project is designed as a minimal-cost MVP focused on indexing publicly available market discussions while enforcing strict content, legal, and safety boundaries.

---

## Tech Stack
- Framework: Next.js (App Router)
- Runtime: Node.js
- Hosting: Vercel (Free tier)
- Database: TBD (PostgreSQL-based)
- AI: External LLM used strictly for classification (JSON-only output)

---

## Project Structure
rignum/
├─ app/
│ ├─ api/
│ │ └─ cron/
│ ├─ disclaimer/
│ ├─ terms/
│ ├─ privacy/
│ ├─ report/
│ └─ legal/
│
├─ components/
│ ├─ Feed/
│ ├─ Layout/
│ ├─ UI/
│ └─ Common/
│
├─ lib/
│ ├─ db/
│ ├─ fetcher/
│ ├─ classifier/
│ ├─ policies/
│ └─ utils/
│
├─ docs/
│ ├─ architecture.md
│ ├─ disclaimer.md
│ ├─ terms.md
│ ├─ privacy.md
│ ├─ removal-policy.md
│ └─ ai-spec.md
│
└─ scripts/


---

## Core Architectural Principles
- No third-party content is hosted or reproduced
- Only metadata and external links are stored and displayed
- All classification is automated and non-evaluative
- Content retention is limited (24 hours)
- Visibility controls are applied deterministically

---

## Data Flow (High-Level)
1. Public sources are fetched automatically
2. Content is normalized and deduplicated
3. AI performs classification into predefined categories
4. Metadata is stored with limited retention
5. UI renders metadata-only cards with external links
