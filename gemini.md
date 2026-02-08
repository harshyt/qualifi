# Technical Implementation Plan: AI Resume Screener MVP

## 1. Stack Overview

- **Frontend:** Next.js 14 (App Router) + Material UI (MUI).
- **Backend:** Next.js Server Actions (Serverless).
- **Database:** Supabase (for storing candidate history and Job Descriptions).
- **PDF Parsing:** `pdf-parse` (Local node library).
- **AI Engine:** Google Gemini Pro 2.5 API (Free Tier).
- **Email Integration:** `node-imap` and `nodemailer` (via Personal Outlook IMAP/SMTP).

## 2. Phase-by-Phase Execution

### Phase 1: Foundation & Auth

- Initialize Next.js with MUI `ThemeProvider` using the `ui-guidelines.md` colors.
- Create a mock login page.
- Set up a protected Layout with a clean sidebar (Inbox, Job Library, Settings).

### Phase 2: AI Analysis Engine (The Core)

- **Step A:** Build a `/api/analyze` route that accepts a PDF file and a Job Description string.
- **Step B:** Extract text from PDF using `pdf-parse`.
- **Step C:** Feed the text to Gemini with a system prompt:
  "Act as a Senior Recruiter. Compare the Resume vs JD.
  Return ONLY JSON: { 'score': 0-100, 'summary': '', 'strengths': [], 'gaps': [], 'verdict': 'SHORTLIST'|'REJECT' }"

### Phase 3: The Dashboard & Detail View

- Build a main Dashboard table showing candidates fetched from Supabase.
- Create a 'Split-Screen' detail view:
  - Left: Plain text resume preview.
  - Right: AI Verdict cards with Soft Azure score gauges.

### Phase 4: Email Automation (Personal Outlook)

- Create a "Sync Inbox" Server Action:
  - Connect to personal Outlook via IMAP.
  - Find unread emails with PDF attachments.
  - For each: Parse PDF -> Run AI Analysis -> Save to Supabase.
- Implement "One-Click Reply":
  - Clicking 'Reject' or 'Accept' triggers `nodemailer` to send a pre-filled template back to the recruiter.

## 3. Deployment Instruction

- Deploy to Vercel.
- Ensure Environment Variables for `GEMINI_API_KEY`, `IMAP_USER`, `IMAP_PASSWORD`, and `SUPABASE_URL` are configured.
