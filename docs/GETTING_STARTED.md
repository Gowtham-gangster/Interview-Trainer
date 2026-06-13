# Getting Started

This guide walks through running the **AI Interview Trainer** locally: PostgreSQL, Next.js app, and connection to IBM watsonx Orchestrate agents.

For IBM agent creation and knowledge-base setup, continue with [SETUP_GUIDE.md](./SETUP_GUIDE.md) after completing the steps below.

---

## Overview

```text
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│  Browser        │────▶│  Next.js (port 3000) │────▶│  IBM watsonx Orchestrate │
│  Chat / Voice   │◀────│  BFF /api/*          │◀────│  Interview Trainer Agent │
└─────────────────┘     └──────────┬───────────┘     └─────────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  PostgreSQL     │
                            │  Auth · History │
                            └─────────────────┘
```

---

## Step 1: Prerequisites

Install:

- **Node.js** 18.17 or higher
- **Docker Desktop** (for PostgreSQL)
- **Git**

Create an **IBM Cloud** account and provision **watsonx Orchestrate** before connecting live agents.

---

## Step 2: Clone and install dependencies

```bash
git clone <repository-url>
cd ai-interview-trainer
npm install
```

---

## Step 3: Start PostgreSQL

```bash
docker compose up -d
```

The default `docker-compose.yml` exposes PostgreSQL on port `5432` with:

```text
User:     postgres
Password: root
Database: ai_interview_trainer
```

Set in `.env.local`:

```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/ai_interview_trainer
```

> Note: `.env.example` uses password `postgres`; align `DATABASE_URL` with your Docker credentials.

---

## Step 4: Environment configuration

```bash
cp .env.example .env.local
```

Generate a NextAuth secret (optional helper):

```bash
npm run generate:secrets
```

### Minimum variables for local development

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>

# Database
DATABASE_URL=postgresql://postgres:root@localhost:5432/ai_interview_trainer

# IBM watsonx Orchestrate (server-only)
WATSONX_API_KEY=<your-api-key>
WATSONX_INSTANCE_URL=https://api.REGION.watson-orchestrate.cloud.ibm.com/instances/YOUR_INSTANCE_ID
WATSONX_AGENT_ID=<interview-trainer-agent-id>
WATSONX_AGENT_ENVIRONMENT_ID=<environment-id>
WATSONX_AGENT_ENVIRONMENT_NAME=live
```

### Offline UI development (no IBM credentials)

```env
NEXT_PUBLIC_WATSONX_USE_MOCK=true
```

Mock adapters simulate chat, resume, and voice responses without calling IBM APIs.

Full variable reference: [ENVIRONMENT.md](./ENVIRONMENT.md)

---

## Step 5: Database setup

```bash
npm run db:push
npm run db:seed    # optional demo data
```

Open Prisma Studio (optional):

```bash
npm run db:studio
```

---

## Step 6: IBM watsonx Orchestrate backend

Complete these in IBM Cloud before setting live credentials:

1. **Create agents** — Interview Trainer (orchestrator) + 7 specialized agents  
   Details: [AGENT_DESIGN.md](./AGENT_DESIGN.md)

2. **Create Knowledge Base** — Name: `Interview Knowledge Base`  
   Prepare structured TXT files (format: [KNOWLEDGE_BASE_DESIGN.md](./KNOWLEDGE_BASE_DESIGN.md)) and upload them in watsonx Orchestrate

3. **Configure RAG agent** — Attach knowledge base to Technical Interview RAG Agent

4. **Configure toolset** — Add all specialized agents to Interview Trainer Agent toolset

5. **Configure instructions** — Resume, technical, HR, soft skills, mock interview, assessment workflows

6. **Publish** — Deploy in **Live** mode; copy Agent ID and Environment ID to `.env.local`

Step-by-step: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## Step 7: Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Verify IBM connection

- Sign in and open the chat interface
- Send: `Prepare me for Java Developer Interview`
- Upload a resume PDF for analysis testing

Health check (if configured): watsonx health hook in the dashboard.

---

## Step 8: Optional — Voice interviews

Enable in `.env.local`:

```env
NEXT_PUBLIC_ENABLE_VOICE=true
WATSON_STT_API_KEY=<stt-api-key>
WATSON_TTS_API_KEY=<tts-api-key>
```

Configure voice in watsonx Orchestrate: **Channels → Voice Settings** (see [SETUP_GUIDE.md](./SETUP_GUIDE.md#step-9-configure-voice-support)).

---

## Step 9: Production build verification

```bash
npm run type-check
npm run lint
npm run test
npm run verify:production-env
npm run build
npm start
```

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Database connection failed | `docker compose ps`, `DATABASE_URL` password |
| Chat returns errors | `WATSONX_*` vars, agent published in Live mode |
| Mock responses only | `NEXT_PUBLIC_WATSONX_USE_MOCK=false` |
| Auth redirect errors | `NEXTAUTH_URL` matches browser URL |
| Voice not working | STT/TTS API keys; microphone permissions |

---

## Next steps

- Run through test scenarios: [TESTING_REPORT.md](./TESTING_REPORT.md)
- Knowledge base format and upload: [KNOWLEDGE_BASE_DESIGN.md](./KNOWLEDGE_BASE_DESIGN.md)
- Contribute: [CONTRIBUTING.md](./CONTRIBUTING.md)
