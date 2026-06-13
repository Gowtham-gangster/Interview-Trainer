# AI Interview Trainer

An end-to-end AI-powered interview preparation platform. Candidates upload resumes, receive personalized coaching across technical, HR, and soft-skills rounds, practice mock interviews, and get scored readiness assessments — powered by **IBM watsonx Orchestrate**, a **multi-agent architecture**, and **Retrieval-Augmented Generation (RAG)**.

This repository contains:

- **Frontend & BFF** — Next.js 15 application with chat UI, voice support, auth, and PostgreSQL persistence
- **Backend agents** — Eight coordinated IBM watsonx Orchestrate agents (configured in IBM Cloud, not in this repo as source code)
- **Knowledge base** — Structured interview content (TXT files) consumed by the Technical Interview RAG Agent

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Multi-Agent System](#multi-agent-system)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Testing Summary](#testing-summary)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)

---

## Features

| Area | Capabilities |
|------|--------------|
| **Resume intelligence** | Parse PDF resumes, extract skills/projects/education, recommend roles |
| **Technical prep** | RAG-backed questions, model answers, concepts, tips, and common mistakes |
| **HR & behavioral** | Tell-me-about-yourself, strengths/weaknesses, salary, behavioral scenarios |
| **Soft skills** | Communication, leadership, teamwork, group discussion, self-introduction |
| **Mock interviews** | 5-question sessions, one question at a time, per-answer scoring (0–10) |
| **Assessment** | Aggregated scores, readiness level, strengths/weaknesses, improvement plan |
| **Frontend UX** | ChatGPT-style chat, dark/light theme, streaming responses, voice I/O |
| **Platform** | Auth (email/OAuth), session history, resume upload, rate limiting, PWA-ready |

---

## Architecture

The platform uses a **central orchestrator** pattern: the **Interview Trainer Agent** routes work to seven specialized agents and synthesizes unified responses for the user.

```mermaid
flowchart TB
    User([Candidate])

    FE["Next.js Frontend + BFF<br/>/api/* routes"]
    ITA["Interview Trainer Agent<br/>(IBM watsonx Orchestrate)"]

    RA["Resume Analyzer"]
    RAG["Technical RAG Agent"]
    QG["Question Generator"]
    HR["HR Coach"]
    SS["Soft Skills Coach"]
    AE["Answer Evaluation"]
    FB["Feedback Agent"]

    KB[("Interview Knowledge Base")]

    User --> FE
    FE --> ITA
    ITA --> RA & RAG & QG & HR & SS
    RAG <--> KB
    ITA --> AE
    AE --> FB
    FB --> FE
    FE --> User
```

**End-to-end flow**

1. Candidate uploads a resume or specifies a job role.
2. Resume Analyzer Agent builds a candidate profile.
3. Technical RAG Agent retrieves content from the knowledge base; Question Generator fills gaps.
4. HR Coach and Soft Skills Coach provide non-technical preparation.
5. Mock interview runs (5 questions, sequential evaluation).
6. Answer Evaluation Agent scores each response; Feedback Agent produces the final readiness report.

Detailed diagrams and data-flow steps: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [docs/AGENT_DESIGN.md](./docs/AGENT_DESIGN.md)

---

## Multi-Agent System

| Agent | Role | Key outputs |
|-------|------|-------------|
| **Interview Trainer Agent** | Central orchestrator, user-facing coordinator | Preparation plans, mock sessions, unified responses |
| **Resume Analyzer Agent** | Resume parsing and profiling | Skills, projects, education, experience, recommended roles |
| **Technical Interview RAG Agent** | Knowledge-base retrieval | Questions, answers, concepts, tips, company-specific content |
| **Question Generator Agent** | Fallback when KB lacks content | Role/project/scenario-based custom questions |
| **HR Coach Agent** | HR and behavioral coaching | HR questions, career guidance, salary prep |
| **Soft Skills Coach Agent** | Communication and interpersonal skills | Self-intro, GD strategy, confidence building |
| **Answer Evaluation Agent** | Per-answer scoring | Score /10, strengths, weaknesses, missing concepts |
| **Feedback Agent** | Final assessment | Overall score, readiness level, improvement plan |

Agent interaction sequence: [docs/AGENT_DESIGN.md](./docs/AGENT_DESIGN.md#agent-interaction-flow)

---

## Tech Stack

### Application (this repository)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router), React 18, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| State | Zustand, TanStack Query, React Hook Form |
| Auth | NextAuth.js, Prisma adapter |
| Database | PostgreSQL (Prisma ORM) |
| API | Next.js BFF routes → IBM watsonx Orchestrate |
| Voice | IBM Watson Speech-to-Text & Text-to-Speech |
| Rate limiting | Upstash Redis |

### IBM Cloud (configured separately)

| Component | Purpose |
|-----------|---------|
| IBM watsonx Orchestrate | Multi-agent runtime and orchestration |
| Agent Builder | Agent creation, toolsets, instructions |
| Knowledge Base | RAG source documents (TXT) |
| Watson STT / TTS | Voice interview simulation |

---

## Prerequisites

### For the web application

- Node.js **18.17+**
- npm, yarn, or pnpm
- Docker (recommended for local PostgreSQL)
- IBM Cloud account with watsonx Orchestrate access

### For IBM backend agents

- IBM Cloud account — [cloud.ibm.com](https://cloud.ibm.com)
- watsonx Orchestrate instance with Agent Builder, Knowledge Base, and Agent Tools
- Structured interview TXT files for the IBM Knowledge Base (format: [docs/KNOWLEDGE_BASE_DESIGN.md](./docs/KNOWLEDGE_BASE_DESIGN.md); content is maintained privately in watsonx Orchestrate)

---

## Quick Start

### 1. Clone and install

```bash
git clone <repository-url>
cd ai-interview-trainer
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

Default connection (adjust in `.env.local` if needed):

```text
postgresql://postgres:root@localhost:5432/ai_interview_trainer
```

### 3. Configure environment

```bash
cp .env.example .env.local
npm run generate:secrets   # optional: generate NEXTAUTH_SECRET
```

Set at minimum:

- `DATABASE_URL`
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- `WATSONX_API_KEY`, `WATSONX_INSTANCE_URL`, `WATSONX_AGENT_ID`, `WATSONX_AGENT_ENVIRONMENT_ID`

Use `NEXT_PUBLIC_WATSONX_USE_MOCK=true` only for offline UI development without IBM credentials.

Full reference: [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)

### 4. Initialize database

```bash
npm run db:push
npm run db:seed    # optional
```

### 5. Set up IBM watsonx Orchestrate backend

Follow [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) to:

1. Create the Interview Trainer Agent and seven specialized agents
2. Create the Interview Knowledge Base and upload your structured TXT files (see [docs/KNOWLEDGE_BASE_DESIGN.md](./docs/KNOWLEDGE_BASE_DESIGN.md))
3. Attach the knowledge base to the Technical Interview RAG Agent
4. Configure the orchestrator toolset and mock-interview workflow
5. Publish the agent (Live mode) and copy agent/environment IDs into `.env.local`

### 6. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Production check:

```bash
npm run verify:production-env
npm run build && npm start
```

Step-by-step guide: [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)

---

## Documentation

All project documentation lives in [`docs/`](./docs/).

| Document | Description |
|----------|-------------|
| [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) | Full-stack setup walkthrough |
| [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) | Environment variables reference |
| [docs/AGENT_DESIGN.md](./docs/AGENT_DESIGN.md) | Multi-agent roles, I/O, interaction flows |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture, workflows, data flow |
| [docs/KNOWLEDGE_BASE_DESIGN.md](./docs/KNOWLEDGE_BASE_DESIGN.md) | RAG knowledge base architecture and content format |
| [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) | IBM watsonx Orchestrate deployment steps |
| [docs/TESTING_REPORT.md](./docs/TESTING_REPORT.md) | Functional test scenarios and results |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Contribution guidelines |

---

## Testing Summary

Functional testing on IBM watsonx Orchestrate (Live deployment) validated **12 scenarios** with a **100% pass rate**:

| Test area | Status |
|-----------|--------|
| Resume analysis | PASS |
| Technical preparation (Java, Spring Boot) | PASS |
| HR preparation | PASS |
| Self-introduction & group discussion coaching | PASS |
| Soft skills coaching | PASS |
| Mock interview workflow | PASS |
| Answer evaluation (0–10 scoring) | PASS |
| Final assessment & readiness report | PASS |
| RAG knowledge retrieval | PASS |
| Question Generator fallback | PASS |

Details, inputs, and expected outputs: [docs/TESTING_REPORT.md](./docs/TESTING_REPORT.md)

Local frontend tests:

```bash
npm run test
npm run test:security
```

---

## Project Structure

```text
.
├── docs/
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── ENVIRONMENT.md
│   ├── SETUP_GUIDE.md
│   ├── ARCHITECTURE.md
│   ├── AGENT_DESIGN.md
│   ├── KNOWLEDGE_BASE_DESIGN.md
│   ├── TESTING_REPORT.md
│   └── CONTRIBUTING.md
├── prisma/
│   └── schema.prisma              # Database schema
├── public/
│   ├── icons/                     # PWA icons (svg, png)
│   └── sw.js                      # Service worker
├── scripts/
│   ├── generate-secrets.mjs
│   ├── generate-pwa-icons.mjs
│   ├── test-security-headers.mjs
│   └── verify-production-env.mjs
├── src/
│   ├── app/                       # Next.js App Router (pages, layouts, API routes)
│   ├── components/
│   │   ├── auth/                  # Login, signup, auth shell
│   │   ├── chat/                  # Chat UI and messaging
│   │   ├── common/                # Shared UI helpers
│   │   ├── forms/                 # Form components
│   │   ├── layout/                # App shell, navigation
│   │   ├── motion/                # Animation wrappers
│   │   ├── prepare/               # Interview prep UI
│   │   ├── profile/               # Profile pages
│   │   ├── providers/             # React context providers
│   │   ├── pwa/                   # PWA install/register
│   │   ├── settings/              # Settings panels
│   │   ├── theme/                 # Theme toggle
│   │   ├── ui/                    # shadcn/ui primitives
│   │   └── voice/                 # Voice interview UI
│   ├── config/                    # Site and navigation config
│   ├── features/
│   │   └── landing/               # Marketing landing page
│   ├── hooks/
│   │   └── api/                   # Data-fetching hooks
│   ├── lib/
│   │   ├── api/                   # Client API services and watsonx types
│   │   ├── auth/                  # NextAuth, sessions, OAuth
│   │   ├── db/                    # Prisma repositories
│   │   ├── email/                 # Mailer and templates
│   │   ├── server/                # BFF: watsonx proxy, resume, rate limits
│   │   ├── store/                 # Zustand stores
│   │   ├── theme/                 # Theme utilities
│   │   ├── voice/                 # STT/TTS and audio helpers
│   │   ├── pwa/                   # PWA utilities
│   │   ├── security/              # Security headers
│   │   ├── motion/                # Framer Motion variants
│   │   └── data/                  # Client storage helpers
│   ├── styles/                    # Shared style utilities
│   ├── types/                     # TypeScript definitions
│   └── middleware.ts              # Auth and route middleware
├── docker-compose.yml             # Local PostgreSQL
├── .env.example                   # Environment template (local)
├── .env.production.example        # Environment template (production)
├── .eslintrc.json                 # ESLint configuration
├── .gitignore
├── next.config.js                 # Next.js configuration
├── package.json                   # Dependencies and npm scripts
├── package-lock.json              # Locked dependency tree
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project overview (this file)
```

Generated locally (not committed): `node_modules/`, `.next/`, `.env.local`, `next-env.d.ts`, `*.tsbuildinfo`

---

## Environment Variables

Copy `.env.example` to `.env.local`. Critical groups:

| Group | Variables | Notes |
|-------|-----------|-------|
| App | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL` | Public URLs |
| IBM Orchestrate | `WATSONX_API_KEY`, `WATSONX_INSTANCE_URL`, `WATSONX_AGENT_ID`, `WATSONX_AGENT_ENVIRONMENT_ID` | Server-only secrets |
| Mock mode | `NEXT_PUBLIC_WATSONX_USE_MOCK` | `true` = offline UI without IBM |
| Auth | `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, OAuth client IDs | Required for login |
| Database | `DATABASE_URL` | PostgreSQL connection string |
| Voice | `WATSON_STT_API_KEY`, `WATSON_TTS_API_KEY` | Optional; enables voice interviews |
| Rate limits | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Required on Vercel |

Complete list: [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)

---

## Deployment

### Frontend (Vercel or Node host)

```bash
npm run build
npm start
```

Set all production environment variables. Run `npm run verify:production-env` before go-live.

### IBM watsonx Orchestrate

Publish the Interview Trainer Agent in **Live** mode after completing the [validation checklist](./docs/SETUP_GUIDE.md#validation-checklist).

### Knowledge base updates

Prepare or edit structured TXT files privately, then re-upload to the **Interview Knowledge Base** in IBM watsonx Orchestrate. Follow the format in [docs/KNOWLEDGE_BASE_DESIGN.md](./docs/KNOWLEDGE_BASE_DESIGN.md).

---

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for branch workflow, code style, and PR guidelines.

---

## Acknowledgments

- **IBM watsonx Orchestrate** — Multi-agent orchestration and RAG runtime
- [Next.js](https://nextjs.org/) · [Tailwind CSS](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/) · [Prisma](https://www.prisma.io/)

---

**Built for smarter, more confident interview preparation.**
