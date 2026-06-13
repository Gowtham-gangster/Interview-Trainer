# Contributing

Thank you for contributing to **AI Interview Trainer**. This project combines a Next.js frontend/BFF with IBM watsonx Orchestrate multi-agent backend documentation.

---

## Development setup

1. Fork and clone the repository
2. Follow [GETTING_STARTED.md](./GETTING_STARTED.md)
3. Use `NEXT_PUBLIC_WATSONX_USE_MOCK=true` if you do not have IBM credentials
4. Run `npm run dev` and verify changes locally

---

## Branch workflow

```bash
git checkout -b feature/your-feature-name
# make changes
npm run lint
npm run type-check
npm run test
git commit -m "Describe your change clearly"
git push origin feature/your-feature-name
```

Open a pull request against the default branch with a clear description and test notes.

---

## Code guidelines

### TypeScript / React

- Use TypeScript for all new code
- Follow existing patterns in `src/components`, `src/lib`, and `src/features`
- Match ESLint and Prettier configuration (`npm run lint`, `npm run format`)
- Keep components accessible (ARIA, keyboard navigation)
- Test responsive layouts (mobile, tablet, desktop)

### API & watsonx integration

- Server secrets stay in server-only env vars (no `NEXT_PUBLIC_` prefix)
- Route IBM calls through existing BFF patterns in `src/app/api/` and `src/lib/server/`
- Do not commit API keys or `.env.local`

### Knowledge base

Interview content is maintained privately in IBM watsonx Orchestrate, not in this repository. When adding or updating knowledge sources:

- Follow the structured format in [KNOWLEDGE_BASE_DESIGN.md](./KNOWLEDGE_BASE_DESIGN.md)
- Upload TXT files via watsonx Orchestrate **Knowledge → Interview Knowledge Base**
- Document any new test scenarios in [TESTING_REPORT.md](./TESTING_REPORT.md) if retrieval behavior changes

### Backend agent docs

When changing agent behavior in IBM Orchestrate, update relevant docs:

- [AGENT_DESIGN.md](./AGENT_DESIGN.md) — agent roles and flows
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) — deployment steps
- [TESTING_REPORT.md](./TESTING_REPORT.md) — new test scenarios

---

## Commit messages

Use clear, imperative summaries:

```text
Add structured interview content to IBM Knowledge Base
Fix watsonx stream timeout handling
Update mock interview workflow in Setup Guide
```

---

## Testing

```bash
npm run test              # Jest unit tests
npm run test:security     # Security headers check
npm run verify:production-env
```

For IBM agent changes, document manual test cases in [TESTING_REPORT.md](./TESTING_REPORT.md).

---

## Questions

Refer to [README.md](./README.md) for the documentation index.
