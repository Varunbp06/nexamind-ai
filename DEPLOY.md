# Deployment & Environment Guide

## Repository

https://github.com/Varunbp06/nexamind-ai

## Architecture

```
┌──────────────────────────────┐        ┌─────────────────────────────┐
│  Vercel (Next.js frontend)   │ HTTPS  │  Backend (FastAPI + RAG)    │
│  root directory: /frontend   │──────▶ │  Deploy on VM/Container     │
│  - UI, SSR, API routes       │        │  (Railway/Render/Fly/Docker)│
│  - standalone chat via LLM   │        │  - Postgres/SQLite, Redis   │
│    provider (serverless)     │        │  - Chroma/Milvus, MinIO/OSS │
└──────────────────────────────┘        └─────────────────────────────┘
```

- **Frontend → Vercel**: the Next.js app in `frontend/` is fully Vercel-compatible
  (App Router, edge middleware, streaming serverless functions).
- **Backend → NOT Vercel**: FastAPI + SQLite/Postgres + Chroma + Redis are
  persistent services. Deploy with `Dockerfile` on Railway / Render / Fly.io /
  a VM. Do not point production at localhost.

## Frontend deploy (Vercel)

1. Import the repo, set **Root Directory = `frontend`**.
2. Framework preset auto-detects **Next.js**; build command `next build`,
   install `npm ci`. No custom settings required.
3. Configure environment variables (below), including OAuth callback URLs.

### Required environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Base URL of your deployed FastAPI backend (e.g. `https://api.yourdomain.com`). Server-side proxy and chat routes forward `/api/*` traffic here. **No trailing slash.** |
| `NEXTAUTH_URL` | Public URL of the Vercel site (e.g. `https://yourapp.vercel.app`). Required for SSO callbacks in production. |
| `NEXTAUTH_SECRET` | JWT signing secret for sessions. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (Google Cloud Console → Credentials). Authorized redirect URI: `https://<NEXTAUTH_URL-domain>/api/auth/callback/google` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_ID` | GitHub OAuth App client ID (github.com/settings/developers). Callback: `https://<NEXTAUTH_URL-domain>/api/auth/callback/github` |
| `GITHUB_SECRET` | GitHub OAuth App client secret |
| `LLM_BASE_URL` | *(optional)* OpenAI-compatible endpoint for standalone chat mode. Default: NVIDIA NIM (`https://integrate.api.nvidia.com/v1`) |
| `LLM_API_KEY` | *(optional)* Provider API key. Enables standalone chat without the RAG backend. Keep secret — server-side only, never bundled to the client. |
| `LLM_MODEL` | *(optional)* Model id used when the app doesn't specify one. |

Optional tuning: `RATE_LIMIT_CHAT_PER_MIN`, `RATE_LIMIT_GENERAL_PER_MIN`,
`PROXY_MAX_BODY_BYTES`, `PROXY_TIMEOUT_MS`, `CHAT_TIMEOUT_MS`, `LLM_MAX_TOKENS_CAP`.

### Backend environment variables

| Variable | Purpose |
|---|---|
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to call the backend directly via CORS. Default `*` (dev). **Set to your Vercel domain in production**, e.g. `https://your-app.vercel.app`. Unused in the default architecture (all browser traffic flows same-origin through the Next.js `/api/*` proxy), but enforced if you enable direct browser→backend calls. |

### Upload size note (Vercel platform limit)

Vercel serverless functions accept request bodies up to **4.5 MB**. File
uploads travel through the Next.js `/api/*` proxy, so documents larger than
4.5 MB will be rejected on Vercel regardless of `PROXY_MAX_BODY_BYTES`. For
large-document workflows, either upload directly against the deployed backend
(requires adding its origin to `ALLOWED_ORIGINS`) or keep heavy ingestion on
the backend host. Chat streaming is unaffected (responses stream out, and
`maxDuration = 300` is already set).

### SSO behavior

- If `GOOGLE_CLIENT_*` / `GITHUB_*` variables are set, login/signup buttons run
  real OAuth automatically.
- If left unset, buttons perform a local demo sign-in so the UI remains usable.
  No code change is needed when you later add real credentials — just set the
  vars and redeploy.
- Never commit real credentials. `.env` and `.env.*` are gitignored;
  only `.env.example` templates are tracked.

## Backend deploy

- Build with root `Dockerfile` (FastAPI). Provide DB/vector/broker settings from
  `.env.example` at repo root (DB_TYPE, VECTOR_DB_TYPE, MILVUS_*, REDIS, etc.).
- Set CORS on the backend to allow the Vercel domain if any direct browser
  calls are enabled; by default all browser traffic flows through the Next.js
  `/api/*` proxy (same-origin), which avoids CORS entirely.
- Then set `NEXT_PUBLIC_BACKEND_URL` on Vercel to the backend's public URL.

## Security notes

- Secrets are read server-side only (`process.env` in route handlers/middleware);
  none are embedded in client bundles (verified by bundle scan).
- Security headers (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy,
  Permissions-Policy) ship via `next.config.mjs` + edge middleware.
- Rate limiting uses an in-process sliding window; on serverless it applies
  per-instance (still effective against bursts). Use a shared store if you need
  a global quota.
