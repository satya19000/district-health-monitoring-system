# District Health Monitoring System (DHMS)

A production-ready **React + TypeScript + Vite** frontend for a District Health
Monitoring System, wired to an **InsForge** backend (auth, Postgres database,
object storage, and the AI gateway).

It provides authentication with role-based access control, a multi-format file
upload pipeline, AI-powered analysis of uploaded health data, role-scoped
dashboards for key health indicators, and PDF / Excel / Word report export.

---

## 1. Features

| Area | What's included |
|------|-----------------|
| **Auth** | Login, registration, forgot/reset password (code- **and** link-based flows), email verification, session restore. |
| **RBAC** | Six roles — State Admin, District Admin, Programme Officer, Medical Officer, ANM, ASHA — with level-based capabilities and dashboard scoping. |
| **Uploads** | Drag-and-drop for Excel, CSV, PDF, DOCX, images and ZIP. Files are routed to the correct storage bucket and recorded in the DB. |
| **AI analysis** | Auto-reads a file (Excel/CSV/DOCX parsed locally; PDF/image read by the AI gateway) → summary, findings, poor indicators, best indicators, recommendations, action plan. |
| **Dashboards** | State, District, Programme, Facility, ANM — each scope-filtered against `dashboard_metrics`. |
| **Indicators** | MMR, IMR, U5MR, ANC, PNC, Immunization, TB, NCD, IDSP, Maternal Health, Child Health (with targets + good/warn/bad classification). |
| **Reports** | Export any analysis to **PDF**, **Excel** or **Word**; saved reports are listed and re-exportable. |
| **Security** | Only the **public anon key** is shipped to the browser. No provider/admin secret is ever in frontend code. |

---

## 2. Tech stack

- React 18, TypeScript, Vite 5
- `react-router-dom` v6 (routing + guards)
- `recharts` (charts), `lucide-react` (icons)
- `@insforge/sdk` (auth, database, storage, AI)
- `xlsx` (Excel/CSV parse + Excel export), `mammoth` (DOCX parse),
  `jspdf` + `jspdf-autotable` (PDF), `docx` + `file-saver` (Word)
- Hand-crafted CSS design system (no Tailwind) — deep-teal "command center" theme

---

## 3. Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    then edit .env and paste your InsForge anon key

# 3. Run the dev server
npm run dev          # http://localhost:5173

# 4. Production build
npm run build        # type-checks, then outputs to dist/
npm run preview      # serve the production build locally
```

### Environment variables (`.env`)

All frontend env vars **must** be prefixed with `VITE_` to be exposed to the app.

| Variable | Purpose |
|----------|---------|
| `VITE_INSFORGE_URL` | Your InsForge project base URL. |
| `VITE_INSFORGE_ANON_KEY` | **Public** anon key (safe for the browser). |
| `VITE_AI_MODEL` | Model slug enabled in your InsForge AI gateway (e.g. `openai/gpt-4o-mini`). |
| `VITE_DEFAULT_ROLE` | Role assigned to self-registered users (default `ASHA`). |

> **Never** put an admin/secret API key in `.env` or anywhere in `src/`.
> Anything prefixed with `VITE_` is bundled into the public JavaScript.

---

## 4. Security model (requirement #10)

- The InsForge **anon key** is a *public* key (conceptually like a Supabase anon
  key). It is meant to be shipped in frontend code and only grants what your
  **Row-Level Security (RLS)** policies allow. Lock down each table with RLS.
- **AI calls** go through `insforge.ai.chat.completions.create(...)` using the
  **authenticated client**. The actual AI provider key lives inside the InsForge
  gateway, server-side — it is never exposed to the browser.
- The admin/secret `apiKey` and `createAdminClient` are **server-only** and are
  not imported anywhere in this frontend.
- An optional server-side edge function (`insforge-functions/ai-analyze/`) is
  included if you'd rather run analysis entirely on the backend.

---

## 5. Expected database schema

The frontend reads/writes the tables below. Column names are centralised in
`src/services/databaseService.ts` (the `TABLES` map) and the type definitions live in
`src/types/index.ts` — adjust them in one place if your columns differ.

> Add appropriate **RLS policies** to every table. A typical pattern: a user can
> read rows scoped to their district/facility, State Admins can read everything,
> and only `manage_users`-capable roles can update `users_profile.role`.

**`users_profile`**
| column | type | notes |
|--------|------|-------|
| `user_id` | uuid/text | FK to the auth user id; used as the lookup key. |
| `full_name` | text | |
| `role` | text | One of `STATE_ADMIN`, `DISTRICT_ADMIN`, `PROGRAMME_OFFICER`, `MEDICAL_OFFICER`, `ANM`, `ASHA` (label-style values are tolerated and normalised). |
| `district_id` | uuid/text null | optional scoping |
| `facility_id` | uuid/text null | optional scoping |

**`uploaded_files`**
| column | type | notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `name` | text | original filename |
| `bucket` | text | storage bucket the object landed in |
| `object_key` | text | storage key/path |
| `url` | text | public/temporary URL |
| `size` | int8 | bytes |
| `mime_type` | text | |
| `category` | text | `excel \| csv \| pdf \| docx \| image \| zip \| other` |
| `uploaded_by` | uuid/text | user id |
| `status` | text | `uploaded \| analyzing \| analyzed \| failed` |
| `created_at` | timestamptz | defaults to now() |

**`ai_analysis_reports`**
| column | type | notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `file_id` | uuid/text null | link to `uploaded_files.id` |
| `file_name` | text | |
| `model` | text | model slug used |
| `summary` | text | |
| `findings` | jsonb | array of strings |
| `poor_indicators` | jsonb | array of `{indicator,value,note}` |
| `best_indicators` | jsonb | array of `{indicator,value,note}` |
| `recommendations` | jsonb | array of strings |
| `action_plan` | jsonb | array of `{action,owner,timeframe}` |
| `raw` | text null | raw model output |
| `created_by` | uuid/text | user id |
| `created_at` | timestamptz | defaults to now() |

**`dashboard_metrics`**
| column | type | notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `scope` | text | `state \| district \| programme \| facility \| anm` |
| `indicator` | text | indicator key/label (e.g. `IMR`, `ANC`, `Immunization`) |
| `value` | numeric | the measured value |
| `period` | text | e.g. `2025-Q1` or `2025-03` |
| `district_id` / `facility_id` / `programme_id` | uuid/text null | optional scoping |

**Reference tables** (`roles`, `districts`, `mandals`, `facilities`,
`programmes`) are read as-is; `roles` may store the canonical role rows, but the
frontend keys RBAC off the string `role` value on `users_profile`.

### Storage buckets

`uploads`, `reports`, `excel-files`, `pdf-files`, `images`, `documents`.
File routing (see `src/lib/fileParser.ts`):

| category | bucket |
|----------|--------|
| excel / csv | `excel-files` |
| pdf | `pdf-files` |
| docx | `documents` |
| image | `images` |
| zip / other | `uploads` |

---

## 6. AI gateway setup

In your InsForge dashboard, enable an AI model in the AI gateway and set its slug
as `VITE_AI_MODEL` (e.g. `openai/gpt-4o-mini`). For PDF analysis the app requests
the gateway's file parser (`mistral-ocr`); make sure file parsing is available on
your plan, otherwise upload PDFs as images or pre-convert them to Excel/CSV.

---

## 7. Project structure

```
src/
  services/       backend service layer (one module per concern):
                    authService.ts      — auth API (sign in/up/out, reset, verify)
                    databaseService.ts  — typed DB access for every table
                    storageService.ts   — uploads, bucket routing, list/remove/URL
                    aiService.ts         — AI analysis workflow via the gateway
  lib/            insforge client config, roles/RBAC, indicators,
                  file parsing helpers, report export (PDF/Excel/Word)
  context/        AuthContext (session state, consumes authService)
  components/     AppLayout, ProtectedRoute, Charts, FileUpload, UI primitives
  pages/
    auth/         Login, Register, ForgotPassword, ResetPassword
    dashboards/   Dashboard (scope-driven: state/district/programme/facility/anm)
    Uploads.tsx   Analysis.tsx   Reports.tsx   Admin.tsx
    Unauthorized.tsx   NotFound.tsx
  App.tsx         routes + guards
  main.tsx        app bootstrap
insforge-functions/ai-analyze/   optional server-side analysis function
```

---

## 8. Deployment

The app is a static SPA — host the contents of `dist/` on any static host. Set
the `VITE_*` environment variables in your host's dashboard and add a SPA
rewrite so client-side routes resolve to `index.html`.

### Vercel
1. Import the repo. Framework preset: **Vite**.
2. Build command `npm run build`, output directory `dist`.
3. Add the `VITE_*` env vars in **Project → Settings → Environment Variables**.
4. `vercel.json` for SPA routing:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

### Netlify
1. Build command `npm run build`, publish directory `dist`.
2. Add the `VITE_*` env vars in **Site settings → Environment variables**.
3. Add `public/_redirects` (or a `netlify.toml` redirect):
   ```
   /*  /index.html  200
   ```

> After deploying, make sure your InsForge auth **redirect URLs** include your
> production domain (for email verification and password-reset links), and that
> CORS / allowed origins include it too.

---

## 9. Notes & assumptions

- `noUnusedLocals` / `noUnusedParameters` are relaxed to keep iteration smooth.
- Dashboards and lists degrade gracefully to empty states when a table is empty,
  so you can deploy first and populate data incrementally.
- Role strings are normalised (`normalizeRole`) so both `STATE_ADMIN` and
  `State Admin`-style values work.
- If you change table/column names, edit `src/services/databaseService.ts` and `src/types/index.ts`.
