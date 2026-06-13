# Environment Variables

Reference for `.env.local` (local) and production deployment. Copy from `.env.example`:

```bash
cp .env.example .env.local
```

**Never commit `.env.local` or real API keys.**

---

## Variable groups

### Application URLs

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Yes | API base for client (often same host `/api`) |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | BFF base URL used by watsonx client |

---

### IBM watsonx Orchestrate — public (client)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WATSONX_SERVICE_URL` | Recommended | Orchestrate instance URL (informational) |
| `NEXT_PUBLIC_WATSONX_ASSISTANT_ID` | Optional | Default assistant ID |
| `NEXT_PUBLIC_WATSONX_USE_MOCK` | Yes | `true` = mock adapters; `false` = live BFF |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | Optional | Request timeout (default `30000`) |

---

### IBM watsonx Orchestrate — server only

**Do not use `NEXT_PUBLIC_` prefix for secrets.**

| Variable | Required | Description |
|----------|----------|-------------|
| `WATSONX_API_KEY` | Yes (live) | IBM Cloud API key for Orchestrate |
| `WATSONX_INSTANCE_URL` | Yes (live) | Service instance URL |
| `WATSONX_API_URL` | Optional | Legacy alias for instance URL |
| `WATSONX_PROJECT_ID` | Optional | watsonx project ID |
| `WATSONX_AGENT_ID` | Yes (live) | Interview Trainer Agent ID |
| `WATSONX_AGENT_ENVIRONMENT_ID` | Yes (live) | Published environment ID |
| `WATSONX_AGENT_ENVIRONMENT_NAME` | Optional | `live` or `draft` (default `live`) |
| `WATSONX_LLM_TEMPERATURE` | Optional | `0` for deterministic responses |
| `WATSONX_LLM_RANDOM_SEED` | Optional | Fixed seed for reproducibility |

---

### Authentication (NextAuth)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_URL` | Yes | Canonical app URL for callbacks |
| `NEXTAUTH_SECRET` | Yes | Session encryption secret |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth |

Generate secret: `npm run generate:secrets`

---

### Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |

Local Docker example:

```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/ai_interview_trainer
```

---

### Voice (IBM Watson Speech)

| Variable | Required | Description |
|----------|----------|-------------|
| `WATSON_STT_API_KEY` | For voice | Speech-to-Text API key |
| `WATSON_TTS_API_KEY` | For voice | Text-to-Speech API key |
| `WATSON_STT_URL` | Optional | STT service URL override |
| `WATSON_TTS_URL` | Optional | TTS service URL override |
| `WATSON_STT_MODEL` | Optional | e.g. `en-IN_Multimedia` |
| `WATSON_TTS_VOICE` | Optional | e.g. `en-US_EthanNatural` |
| `NEXT_PUBLIC_ENABLE_VOICE` | Optional | UI voice features (default `true`) |
| `NEXT_PUBLIC_ENABLE_VIDEO` | Optional | Video features (default `false`) |

---

### Email (SMTP)

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | For email | SMTP server |
| `SMTP_PORT` | For email | Usually `587` |
| `SMTP_USER` | For email | Sender account |
| `SMTP_PASSWORD` | For email | App password |
| `SMTP_FROM` | For email | From header |
| `CONTACT_EMAIL` | Optional | Contact form inbox |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional | Public contact display |
| `LINKEDIN_PROFILE_URL` | Optional | Server-only LinkedIn redirect |

---

### Rate limiting (production / Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Prod recommended | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Prod recommended | Upstash token |
| `RATE_LIMIT_RELAXED` | Optional | 10× limits (staging) |
| `RATE_LIMIT_DISABLED` | Optional | Disable limits (testing only) |

Default limits (production): auth 5/h, chat 30/min, voice 20/min, upload 10/h per IP or user.

---

### Storage & analytics (optional)

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | S3 file storage |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking |

---

## Environment matrix

| Scenario | Key settings |
|----------|--------------|
| **Local UI only** | `NEXT_PUBLIC_WATSONX_USE_MOCK=true`, `DATABASE_URL` |
| **Local + live IBM** | Mock `false`, all `WATSONX_*` server vars, agent Live |
| **Production** | All secrets in host env, Upstash Redis, `verify:production-env` |

---

## Verification

Before production deploy:

```bash
npm run verify:production-env
```

See also: [GETTING_STARTED.md](./GETTING_STARTED.md) · [SETUP_GUIDE.md](./SETUP_GUIDE.md)
