<div align="center">

# NexaMind AI

### Enterprise Agentic RAG Workspace

Chat with your documents. Build AI agents. Evaluate answers. All in one workspace.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.1.0-009688)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

</div>

## About

**NexaMind AI** is a full-stack Agentic RAG (Retrieval-Augmented Generation) workspace:

- 💬 **AI Chat Workspace** — streaming conversations with reasoning traces, file attachments, and model controls
- 🧩 **Apps** — create chatbot applications bound to knowledge bases, MCP tools, and guardrails
- 📚 **Knowledge Bases** — upload documents (PDF/DOCX/TXT/MD), parse, chunk, and index for retrieval
- 📊 **Evaluation** — datasets, run configs, and experiment benchmarking for answer quality
- 🛠 **Tools & MCP** — connect Model Context Protocol servers and external tools
- ⚙️ **Admin Config** — LLMs, embeddings, rerankers, vector databases, tracing, and RBAC roles
- 🔐 **Authentication** — Google & GitHub SSO via NextAuth, with secure JWT sessions

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS 4, Radix UI, assistant-ui |
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite/PostgreSQL, Chroma/Milvus vector stores, Redis |
| Auth | NextAuth v4 (Google + GitHub OAuth, JWT sessions) |
| LLM | Any OpenAI-compatible provider (default: NVIDIA NIM) |

## Project Structure

```
├── frontend/        # Next.js 16 application (Vercel-ready)
│   ├── app/         # App Router pages + API routes
│   ├── components/  # UI components
│   └── lib/         # Auth config, i18n, utilities
├── backend/         # FastAPI RAG service (persistent services)
├── docs/            # Architecture documentation
└── DEPLOY.md        # Deployment guide (Vercel + backend)
```

## Quick Start

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in auth + backend values (see DEPLOY.md)
npm run dev                  # http://localhost:3000
```

### Backend

```bash
poetry install
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8682 --app-dir backend
# Swagger UI: http://localhost:8682/docs
```

Full environment-variable reference, Vercel configuration, and OAuth callback
setup: **[DEPLOY.md](DEPLOY.md)**.

## Security

Secrets are environment-only (never committed; `.env*` is gitignored). The
frontend ships CSP and hardened security headers, CSRF origin checks, rate
limiting, upload validation, and SSRF/path-traversal protection on its API
proxy. See `DEPLOY.md` for production configuration.

## License & Attribution

This project is released under the [MIT License](LICENSE).

Built on top of the open-source **PAI-RAG** project by
[aigc-apps](https://github.com/aigc-apps/PAI-RAG) (MIT). Original backend RAG
architecture and agent capabilities credit the PAI-RAG contributors; the
NexaMind AI frontend experience, branding, and deployment configuration were
built on that foundation.
