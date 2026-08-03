# Production Code Auditor — Execution Checklist

**Scope:** Engineering Execution Workflow

---

## Step 1: Pre-Execution

- [x] Environment variable verification (`LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- [x] Database migration applied (`supabase/migrations`).

## Step 2: Build & Bundle

- [x] Clean install of node modules (`bun install` / `npm install`).
- [x] Production build bundle check (`npm run build`).
- [x] Static type check (`tsc`).

## Step 3: Deployment Verification

- [x] Staging deployment smoke tests.
- [x] Real sample code audit execution test.
- [x] PDF / CSV / JSON export validation.
- [x] Public token link sharing test.
