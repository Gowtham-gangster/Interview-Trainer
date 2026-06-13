# Documentation

All project documentation is in this folder. Start with the [root README](../README.md) for an overview, then use the guides below.

---

## Setup & configuration

| Document | Description |
|----------|-------------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Full-stack local setup |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Environment variables reference |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | IBM watsonx Orchestrate agent deployment |

---

## Architecture & design

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, workflows, data flow |
| [AGENT_DESIGN.md](./AGENT_DESIGN.md) | Multi-agent roles, I/O, interaction flows |
| [KNOWLEDGE_BASE_DESIGN.md](./KNOWLEDGE_BASE_DESIGN.md) | RAG architecture, content format, and upload guidance |

---

## Quality & contribution

| Document | Description |
|----------|-------------|
| [TESTING_REPORT.md](./TESTING_REPORT.md) | Functional test scenarios and results |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |

---

## Knowledge base

Interview content for RAG is maintained privately in the **Interview Knowledge Base** on IBM watsonx Orchestrate — it is not stored in this repository.

For architecture, structured entry format, and upload workflow, see [KNOWLEDGE_BASE_DESIGN.md](./KNOWLEDGE_BASE_DESIGN.md) and [SETUP_GUIDE.md](./SETUP_GUIDE.md#step-4-upload-knowledge-files).

---

## Agent quick reference

```text
Interview Trainer Agent (orchestrator)
├── Resume Analyzer Agent
├── Technical Interview RAG Agent  ←→  Interview Knowledge Base
├── Question Generator Agent       (fallback when KB lacks content)
├── HR Coach Agent
├── Soft Skills Coach Agent
├── Answer Evaluation Agent
└── Feedback Agent
```
