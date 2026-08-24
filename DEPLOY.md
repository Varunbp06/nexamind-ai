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
`PROXY_MAX_BODY_BYTES`, `PROXY_TIMEOUT_MS`, `CHAT_TIMEOUT_MS`, `LLM_MAX_TOKENS_CAP`,
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (distributed rate limiting — see below).

### Backend environment variables

| Variable | Purpose |
|---|---|
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to call the backend directly via CORS. Default `*` (dev). **Set to your Vercel domain in production**, e.g. `https://your-app.vercel.app`. Unused in the default architecture (all browser traffic flows same-origin through the Next.js `/api/*` proxy), but enforced if you enable direct browser→backend calls. |
| `INTERNAL_API_TOKEN` | Shared secret the Vercel proxy sends as `x-internal-token`; backend rejects direct unauthenticated calls. Set identical value on Vercel (`INTERNAL_API_TOKEN` sensitive) and backend. Exempts `/health`, `/docs`, `/openapi.json`. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | *(optional, frontend)* Upstash Redis REST credentials for **global** rate limiting. When set, `frontend/proxy.ts` enforces limits via a single Upstash counter (INCR+PEXPIRE pipeline, 600 ms timeout, fallback to in-memory). When unset, rate limiting is per-instance in-memory (still effective against bursts; see Security notes). Create a free Upstash Redis → REST API → copy URL + token → add to Vercel env. |

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

### Option A — Render (recommended for free tier)

The repo ships `Dockerfile.render` optimized for Render free tier (512 MB):
CPU-only `torch`/`torchvision` from the PyTorch CPU index (avoids ~2.5 GB CUDA
wheels), `redis-server` in-container (broker for Celery), single `gunicorn` +
single Celery worker. `scripts/start-render.sh` wires it up:

```bash
# persistence redirect — zero code change
ln -sfn /data/appdata/tmp /app/tmp
ln -sfn /data/appdata/localdata /app/localdata
redis-server --daemonize yes --save "" --appendonly no
alembic upgrade head
celery -A app.worker worker --concurrency=1 --app-dir backend &
exec gunicorn -w 1 -b 0.0.0.0:$PORT -c scripts/gunicorn.conf.py app.main:app --app-dir backend
```

- `render.yaml` at repo root is a Blueprint: `runtime: docker`,
  `dockerfilePath: ./Dockerfile.render`, `healthCheckPath: /health`,
  `plan: free`, `region: oregon`. One-click: Render → New → Blueprint.
- **Env on Render:** set `ALLOWED_ORIGINS=https://<your-vercel>.vercel.app`
  and `INTERNAL_API_TOKEN` (generateValue, then copy same value to Vercel's
  `INTERNAL_API_TOKEN` sensitive var). `PORT` is injected by Render.
- **Then on Vercel:** set `NEXT_PUBLIC_BACKEND_URL=https://<render>.onrender.com` (no trailing slash).

### Option B — full Docker (VM / Railway / Fly / self-host)

Build with root `Dockerfile` (full CUDA torch, persistent services). Provide
DB/vector/broker settings from `.env.example` at repo root (`DB_TYPE`,
`VECTOR_DB_TYPE`, `MILVUS_*`, `REDIS`, etc.). Set CORS to allow the Vercel
domain only if direct browser→backend calls are enabled (default is same-origin
via the Next.js `/api/*` proxy, which avoids CORS).

### Persistence

- **App paths are relative:** `./tmp/sqlite/chroma` (Chroma spawn),
  `./tmp/sqlite` ↔ `./localdata/sqlite` (SQLite sync), and uploads live under
  project-relative dirs. The code does **not** read `LOCALDATA_DIR`/`CHROMA_PATH`
  env — hence the symlink redirect rather than env wiring.
- **Render free tier:** no persistent disk — data under `/data/appdata/*`
  behaves as ephemeral (plain dirs). App still works; KBs/uploads reset on
  restart. This is the documented free-tier limitation.
- **Paid Render (disk):** attach a disk mounted at `/data` (e.g. 1 GB) — no
  code or env change required. `start-render.sh` symlinks `/app/tmp` and
  `/app/localdata` onto `/data/appdata/*` so SQLite/Chroma/uploads survive
  restarts.
- **External Postgres (alternative, recommended for production):** set
  `DB_TYPE=postgres` + `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`
  (or `DATABASE_URL`) to point at a managed Postgres (Neon, Supabase, RDS,
  Render Postgres). Vector store and file metadata then survive even without a
  disk. Same envs work locally and on Render.

### Distributed rate limiting (optional)

`frontend/proxy.ts` implements a fixed-window limiter (GENERAL 240/min,
CHAT 30/min). Without Upstash it is **per-instance in-memory** — on Vercel
serverless each isolate maintains its own bucket, so still effective against
per-instance bursts but not a global quota. To enforce a global quota: create a
free Upstash Redis → enable REST API → add `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` to Vercel env → redeploy. The edge proxy then uses
a single `INCR`/`PTTL`/`PEXPIRE NX` pipeline (600 ms timeout) and falls back to
in-memory if Upstash is unreachable. No code change or dependency addition
required beyond the two env vars.

## Security notes

- Secrets are read server-side only (`process.env` in route handlers/middleware);
  none are embedded in client bundles (verified by bundle scan of 21 client chunks).
- Security headers (CSP, X-Frame-Options DENY, nosniff, Referrer-Policy,
  Permissions-Policy, HSTS) ship via `next.config.mjs` + edge middleware
  (`frontend/proxy.ts` sets `Content-Security-Policy` with
  `connect-src` limited to `NEXT_PUBLIC_BACKEND_URL`).
- `INTERNAL_API_TOKEN` guard (`backend/app/internal_token_middleware.py`)
  rejects all direct backend calls without `x-internal-token` matching the
  shared secret; `/health`, `/docs`, `/openapi.json` are exempt for probes.
  Admin gating for `/config` is via SSO session in the same edge proxy
  (`ADMIN_EMAILS` allowlist; CSRF origin check on mutating requests).
- Rate limiting: per-instance sliding window by default (GENERAL 240/min,
  CHAT 30/min); global distributed mode activates automatically when
  `UPSTASH_REDIS_REST_URL`+`UPSTASH_REDIS_REST_TOKEN` are set (see above).
  Distributed path uses Upstash REST pipeline with 600 ms abort + fallback to
  in-memory on failure, so Upstash downtime never blocks requests.
