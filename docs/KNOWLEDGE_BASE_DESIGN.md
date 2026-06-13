# Knowledge Base Design Document

# AI Interview Trainer Agent

## Overview

The AI Interview Trainer Agent uses a Retrieval-Augmented Generation (RAG) architecture to provide accurate, role-specific, and skill-based interview preparation.

The knowledge base serves as the primary source of technical interview content and contains structured interview preparation material for multiple technologies and job roles.

> **Note:** Interview content is maintained privately in the **Interview Knowledge Base** on IBM watsonx Orchestrate. It is not stored in this repository. This document describes the RAG architecture, content structure, and upload format only.

Instead of relying solely on the foundation model, the Technical Interview RAG Agent retrieves relevant information from the knowledge base and uses it to generate interview preparation guidance.

---

# Purpose of the Knowledge Base

The knowledge base enables the system to:

* Retrieve technical interview questions
* Retrieve model answers
* Retrieve key concepts
* Retrieve interview tips
* Retrieve common mistakes
* Retrieve company-specific interview questions
* Generate personalized preparation plans

This improves:

* Accuracy
* Consistency
* Domain relevance
* Interview readiness

---

# RAG Architecture

```mermaid
flowchart LR

    User["Candidate"]

    ITA["Interview Trainer Agent"]

    RAG["Technical Interview RAG Agent"]

    KB["Interview Knowledge Base"]

    Response["Interview Preparation Response"]

    User --> ITA

    ITA --> RAG

    RAG --> KB

    KB --> RAG

    RAG --> ITA

    ITA --> Response

    Response --> User
```

---

# Knowledge Base Structure

The knowledge base consists of multiple TXT files uploaded to IBM watsonx Orchestrate.

Each file contains interview preparation content for a specific technology, role, or company. Organize one file per domain (e.g. a programming language, framework, company, or HR topic).

Example layout (file names are illustrative):

```text
Interview Knowledge Base (watsonx Orchestrate)
│
├── <technology>.txt      # e.g. core language or framework
├── <database>.txt        # e.g. SQL or NoSQL topics
├── <dsa>.txt             # data structures and algorithms
├── <company>.txt         # company-specific questions
└── <hr>.txt              # HR and behavioral questions
```

---

# Knowledge Categories

## Technical Knowledge

Contains:

* Core Concepts
* Interview Questions
* Expected Answers
* Key Concepts
* Common Mistakes
* Interview Tips

Examples:

* Java
* Spring Boot
* MySQL
* DSA

---

## Company-Specific Knowledge

Contains:

* Company Interview Patterns
* Frequently Asked Questions
* Interview Experiences
* Hiring Expectations

Examples:

* Infosys
* TCS
* Wipro
* Accenture

---

## HR Knowledge

Contains:

* HR Questions
* Behavioral Questions
* Career Guidance
* Salary Discussions

---

# Knowledge Base Format

Each technical question follows a structured format.

Example:

```text
Role: Java Developer

Question:
What is JVM?

Expected Answer:
JVM stands for Java Virtual Machine.
It executes Java bytecode and provides platform independence.

Difficulty:
Easy

Skill:
Java

Experience:
Fresher
```

Separate entries with `---` on its own line.

### Field guide

| Field | Purpose |
|-------|---------|
| **Role** | Target job title (e.g. Java Developer, Spring Boot Developer) |
| **Question** | Interview question text |
| **Expected Answer** | Model answer for evaluation and RAG grounding |
| **Difficulty** | Easy / Medium / Hard |
| **Skill** | Primary skill tag for retrieval |
| **Experience** | Fresher / 0-2 years / 2-5 years / Senior |

### Optional sections

For richer retrieval, add labeled sections within an entry:

```text
Key Concepts:
- Platform independence
- Bytecode execution

Common Mistakes:
- Confusing JVM with JRE or JDK

Interview Tips:
- Mention garbage collection briefly if asked to expand
```

---

# Upload Workflow

1. Prepare structured TXT files for each domain (technology, company, HR topic, etc.)
2. In watsonx Orchestrate: **Knowledge → Interview Knowledge Base → Upload**
3. Attach the knowledge base to the **Technical Interview RAG Agent**
4. Test retrieval with a role-specific prompt (e.g. `Prepare me for Java Developer Interview`)

Interview content is not stored in this repository — maintain files privately and upload them directly to IBM watsonx Orchestrate.

# Benefits of Structured Format

The structured format improves retrieval quality by allowing the RAG Agent to identify:

* Role
* Skill
* Difficulty
* Experience Level
* Question
* Answer

This enables more precise interview preparation.

---

# Retrieval Process

```mermaid
flowchart TD

    A["User Request"]
    B["Interview Trainer Agent"]
    C["Technical Interview RAG Agent"]
    D["Knowledge Base Search"]
    E["Relevant Content Retrieval"]
    F["Response Generation"]
    G["Candidate"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
```

---

# Knowledge Retrieval Workflow

Step 1:
User requests interview preparation.

Example:

```text
Prepare me for Java Developer Interview.
```

---

Step 2:
Interview Trainer Agent identifies:

* Skill = Java
* Role = Java Developer
* Experience = Fresher

---

Step 3:
Technical Interview RAG Agent searches the knowledge base for the matching skill or role domain.

---

Step 4:
Relevant interview content is retrieved.

Retrieved Information:

* Questions
* Answers
* Key Concepts
* Common Mistakes
* Interview Tips

---

Step 5:
Interview preparation response is generated.

---

# Question Generation Fallback

When the required content is not available in the knowledge base:

```mermaid
flowchart LR

    Request["Interview Request"]

    RAG["Technical Interview RAG Agent"]

    QG["Question Generator Agent"]

    Response["Generated Questions"]

    Request --> RAG

    RAG -->|Content Not Found| QG

    QG --> Response
```

The Question Generator Agent creates:

* Additional Questions
* Project-Based Questions
* Scenario-Based Questions
* Role-Specific Questions

---

# Knowledge Base Design Principles

The knowledge base was designed using the following principles:

### Accuracy

Interview questions are based on industry-standard concepts.

### Consistency

All content follows the same structured format.

### Scalability

New technologies can be added by creating additional domain-specific TXT files and uploading them to the Interview Knowledge Base in watsonx Orchestrate.

### Reusability

The same knowledge base can support:

* Preparation
* Mock Interviews
* Answer Evaluation

---

# Knowledge Source Categories

The Interview Knowledge Base supports these content categories:

| Category              | Purpose                                      |
| --------------------- | -------------------------------------------- |
| Technical skills      | Core language and framework interview prep   |
| Databases             | SQL, schema design, and query questions      |
| DSA                   | Data structures and algorithms               |
| Company-specific      | Hiring patterns and company interview FAQs   |
| HR & behavioral       | HR questions, career guidance, soft skills   |

Prepare structured TXT files for each category and upload them via **Knowledge → Create Knowledge Base** in watsonx Orchestrate. See [SETUP_GUIDE.md](./SETUP_GUIDE.md#step-4-upload-knowledge-files) for upload steps.

---

# Future Knowledge Base Expansion

Planned additions:

* Python
* AWS
* Azure
* Docker
* Kubernetes
* React
* Angular
* Microservices
* System Design
* Data Engineering

---

# Advantages of RAG-Based Design

Compared to a traditional chatbot:

### Traditional Chatbot

* Relies only on model knowledge
* Less consistent
* Limited customization

### RAG-Based Interview Trainer

* Uses curated interview content
* Provides accurate answers
* Supports company-specific preparation
* Supports role-specific preparation
* Easy to update

---

# Conclusion

The Knowledge Base is the foundation of the AI Interview Trainer Agent.

By combining structured interview content with Retrieval-Augmented Generation (RAG), the system delivers accurate, personalized, and scalable interview preparation experiences for technical, HR, and company-specific interview scenarios.
