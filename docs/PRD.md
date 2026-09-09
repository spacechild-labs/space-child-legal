# Space Child Legal — Product Requirements Document

**Version:** 1.0  
**Date:** March 2, 2026  
**Author:** Nick Flach  
**License:** Space Child License v1.0  
**Status:** Draft  

---

## 1. Vision

**"Justice is the interest of the weaker."** — Plato, *Republic* (Thrasymachus's challenge, inverted)

Space Child Legal is an AI-powered legal case management platform that empowers people facing structural power imbalances in the legal system — not by replacing lawyers, but by giving every person the organizational tools, deadline awareness, and procedural scaffolding to *not lose by default*.

The legal system is an adversarial bureaucracy. Those with resources hire teams to manage documents, track deadlines, organize evidence, and file timely responses. Those without resources lose — often not on the merits, but because they missed a filing deadline, didn't respond to a complaint, or couldn't organize their own evidence coherently enough for a lawyer to evaluate their case.

Space Child Legal closes that gap. It is a **case management and procedural empowerment platform**, not an AI lawyer. It helps people survive the system long enough to find real legal help.

**Long-term ambition:** A platform serving thousands of people facing debt collection, employment disputes, housing actions, consumer fraud, and other cases where institutional power routinely overwhelms individual capacity.

---

## 2. Problem Statement

### The Default Judgment Crisis

Millions of Americans receive lawsuits — debt collection, eviction, employment — and never respond. Not because they have no defense, but because they don't know how, can't afford a lawyer, and are overwhelmed by the system. Default judgments are entered. Wages are garnished. Homes are lost. The merits are never examined.

### The AI Snake Oil Problem

Existing "AI legal" platforms promise to identify defenses, generate legal arguments, and draft motions. This causes measurable harm:

- **AI identifies losing defenses** that a human attorney would immediately discard, giving people false confidence
- **Wrong legal arguments create bad case law** — a single bad appeal on an incorrect statute of limitations theory can damage consumer rights for everyone
- **AI hallucinations fabricate case citations** — lawyers have lost their licenses filing AI-generated documents with nonexistent cases
- **Template documents lack legal sufficiency** — an affidavit without case-specific facts is worthless
- **Consumers believe they have defenses they don't**, delaying the point at which they seek real legal help or negotiate

As consumer attorney a consumer attorney (30+ years of practice) put it: these platforms are *"a computer practicing law without a license, backed by an individual doing the same"* and they *"do more harm than good."*

### The Actual Gap

What people actually need is not an AI lawyer. They need:

1. **A decent answer filed so they don't default** while they search for real legal help
2. **Their documents organized** so when they find a lawyer, that lawyer can quickly evaluate their case
3. **Their deadlines tracked** so they don't lose on procedure
4. **Their evidence preserved and indexed** so nothing is lost
5. **Connection to actual attorneys** who serve underserved populations

---

## 3. User Personas

### 3.1 Maria — Pro Se Litigant (Debt Collection)

- 34, single mother, served with a debt collection lawsuit for $8,400
- Cannot afford an attorney ($2,000–5,000 retainer)
- Has 21 days to respond or a default judgment is entered
- Doesn't know what an "Answer" is, let alone how to file one
- **Needs:** File a timely general denial, organize her payment records, find a legal aid attorney
- **Risk:** An AI platform tells her she has a "statute of limitations defense" that doesn't actually apply. She believes she's won. She stops looking for a lawyer. The defense fails. Bad case law is created.

### 3.2 James — Pro Se Litigant (Employment)

- 52, terminated from a manufacturing job after 18 years
- Believes termination was retaliatory (filed OSHA complaint 3 months prior)
- Has boxes of emails, photos, and documents — no organization
- EEOC filing deadline is 180 days (or 300 in deferral states)
- **Needs:** Evidence organization, deadline tracking, timeline construction, attorney referral
- **Risk:** AI drafts an EEOC charge with hallucinated legal theories. Filing a bad charge can limit future claims.

### 3.3 Sarah — Legal Aid Attorney

- Public defender / legal aid, carries 80+ cases
- Clients come in with grocery bags of unsorted documents
- Spends 40% of her time on case organization, not legal work
- **Needs:** Rapid case intake, document OCR and indexing, timeline generation, deadline management
- **Risk:** Minimal — she's the legal expert. She needs *organizational* AI, not *legal* AI.

### 3.4 David — Solo Practitioner (Consumer Law)

- Takes pro bono / low-fee consumer cases
- Doesn't have a paralegal team
- Needs efficient case management to keep his practice viable
- **Needs:** Full case management, client intake pipeline, document management, court deadline tracking
- **Risk:** Low — professional user who understands the tool's boundaries.

---

## 4. Core Features

### 4.1 Case Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Case creation & intake | Structured case file creation with type classification | P0 |
| Multi-case dashboard | Overview of all active cases, status, next deadlines | P0 |
| Case timeline | Chronological event reconstruction from documents and user input | P0 |
| Case status tracking | Procedural posture tracking (pre-filing, answer due, discovery, etc.) | P0 |
| Attorney assignment | Link cases to attorney team members | P1 |
| Case sharing | Securely share organized case files with attorneys | P1 |

### 4.2 Document Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Document OCR pipeline | Ingest scanned documents, extract text with provenance | P0 |
| Evidence photo ingestion | Photograph documents/evidence, AI-assisted metadata extraction | P0 |
| Document classification | Auto-classify (complaint, answer, motion, correspondence, evidence) | P0 |
| Document search | Full-text search across all case documents | P1 |
| Provenance tracking | Chain of custody for all documents — when ingested, source, OCR confidence | P0 |

### 4.3 Deadline & Calendar Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Jurisdiction-aware deadlines | Calculate response deadlines based on jurisdiction and case type | P0 |
| Multi-channel alerts | Email, SMS, push notifications for approaching deadlines | P0 |
| Court calendar integration | Track hearing dates, filing deadlines, discovery cutoffs | P1 |
| Statute of limitations tracker | Track SOL dates WITH EXPLICIT DISCLAIMER that AI cannot determine applicable SOL | P1 |

### 4.4 Communication Hub

| Feature | Description | Priority |
|---------|-------------|----------|
| Email ingestion | IMAP/SMTP integration for case-related correspondence | P0 |
| Email-to-case routing | Auto-associate inbound emails with cases | P1 |
| Attorney communication | Secure messaging between platform users and assigned attorneys | P2 |
| Court e-filing integration | Integration with state e-filing systems (long-term) | P3 |

### 4.5 Procedural Guidance (NOT Legal Advice)

| Feature | Description | Priority |
|---------|-------------|----------|
| Answer scaffolding | Help users construct a general denial / basic answer to avoid default | P1 |
| Procedural checklists | "You've been served — here's what to do" step-by-step guidance | P0 |
| Attorney finder | Integration with legal aid directories, bar association referrals | P1 |
| Form identification | Identify which court forms are needed for a given action | P1 |

### 4.6 AI-Assisted Research & Analysis (With Safety Rails)

| Feature | Description | Priority |
|---------|-------------|----------|
| Case timeline construction | AI reads documents and builds chronological timeline | P0 |
| Evidence organization | AI categorizes and indexes evidence with suggested relevance | P1 |
| Document summarization | Summarize lengthy filings into digestible overviews | P1 |
| Case research (READ-ONLY) | Surface potentially relevant statutes/rules — clearly marked as informational, not advice | P2 |

---

## 5. Architecture (High-Level)

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│  Web App (React/Next.js) │ Mobile (PWA) │ CLI/API   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   API GATEWAY                        │
│         Authentication │ Rate Limiting │ Audit Log   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 CORE SERVICES                        │
│                                                      │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐           │
│  │  Case    │ │ Document │ │  Deadline  │           │
│  │ Manager  │ │ Pipeline │ │  Engine    │           │
│  └─────────┘ └──────────┘ └────────────┘           │
│                                                      │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐           │
│  │  Email   │ │ Attorney │ │  Safety    │           │
│  │ Ingestion│ │ Referral │ │  Rails     │           │
│  └─────────┘ └──────────┘ └────────────┘           │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                  AI LAYER                            │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │         SAFETY RAIL GATEWAY          │           │
│  │  All AI output passes through here   │           │
│  │  before reaching users               │           │
│  └──────────────────────────────────────┘           │
│                                                      │
│  OCR Engine │ Document Classifier │ Timeline Builder │
│  Evidence Analyzer │ Summarizer │ Research (read-only)│
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                DATA LAYER                            │
│  PostgreSQL │ Vector Store │ Document Store (S3)     │
│  Audit Log (append-only) │ Encrypted at rest        │
└─────────────────────────────────────────────────────┘
```

### Current Infrastructure (Already Built)
- **OCR-Provenance:** Docker container on port 3100, 141 MCP tools
- **Email:** IMAP/SMTP Gmail integration
- **Case Files:** Local file-based case management (4 active cases)
- **Legal Team:** LEGAL-TEAM.md attorney management

### Target Infrastructure
- Containerized microservices (Docker Compose → Kubernetes)
- Multi-tenant architecture with strict data isolation
- End-to-end encryption for all case data
- HIPAA-adjacent security posture (legal data is equally sensitive)

---

## 6. Safety Rails

**This is the most critical section of this document.** Every design decision must be filtered through the lens of: *"Will this cause harm to someone who doesn't know what they don't know?"*

### 6.1 The a consumer attorney Principles

Derived from feedback by a 30+ year consumer attorney, these are non-negotiable:

| Principle | Implementation |
|-----------|---------------|
| **AI must not identify legal defenses** | The platform NEVER tells a user "you may have a defense." It organizes facts. Humans identify defenses. |
| **AI must not generate legal arguments** | No AI-drafted motions, briefs, or legal memoranda. Ever. |
| **AI must not create case citations** | No case law citation by AI. Period. Hallucinated citations destroy lives and careers. |
| **AI must not draft affidavits** | Template affidavits without case-specific facts are legally insufficient and misleading. |
| **Wrong arguments create bad case law** | The platform must actively discourage users from filing AI-suggested legal theories. |
| **The goal is to avoid default, not win** | Success = user filed a timely answer AND found a real lawyer. Not "AI won my case." |

### 6.2 Technical Safety Rails

#### Output Classification System
Every piece of AI output is classified:

- **🟢 ORGANIZATIONAL** — Document classification, timeline ordering, deadline calculation, evidence indexing. Safe to present directly.
- **🟡 INFORMATIONAL** — General procedural information ("In Wisconsin, the answer deadline for a civil complaint is typically 20 days"). Presented with disclaimer.
- **🔴 LEGAL ANALYSIS** — Anything that identifies defenses, evaluates claims, suggests arguments, or cites cases. **BLOCKED. Not presented to users.**

#### Mandatory Disclaimers
Every screen, every output, every interaction includes:

```
⚠️ Space Child Legal is a case management tool, not a lawyer.
Nothing on this platform constitutes legal advice.
AI-generated content may contain errors.
Consult a licensed attorney for legal advice.
```

#### Anti-Hallucination Measures

1. **No case citation generation** — AI is never asked to find or cite cases
2. **No legal argument generation** — AI is never prompted to construct legal arguments
3. **Source attribution required** — Every AI-generated summary links to the source document
4. **Confidence scoring** — OCR and classification output includes confidence scores; low-confidence results are flagged
5. **Human-in-the-loop for all filings** — The platform NEVER auto-generates a filing-ready document. It provides structure; the human (or their attorney) fills in the substance.

#### The "Find a Lawyer" Imperative

The platform's primary conversion metric is: **Did this person connect with an attorney?**

- Every case dashboard prominently displays attorney referral resources
- After filing a basic answer, the platform immediately surfaces: *"You've bought yourself time. Now find a lawyer."*
- Legal aid directories, bar association referral services, and pro bono listings are first-class features, not afterthoughts
- The platform tracks whether users have attorney representation and adjusts messaging accordingly

#### Scope Boundaries (Hard Limits)

The platform **WILL NOT**:
- Draft motions, briefs, or legal memoranda
- Identify or suggest legal defenses or claims
- Generate case law citations
- Provide jurisdiction-specific legal analysis
- Create affidavits or declarations
- Predict case outcomes
- Recommend legal strategies

The platform **WILL**:
- Organize documents and evidence
- Track deadlines and send reminders
- Help construct basic procedural filings (general denial answers)
- Build chronological timelines from documents
- Summarize documents in plain language
- Connect users with licensed attorneys
- Provide general procedural information (not advice)

### 6.3 Audit & Accountability

- **Append-only audit log** for all AI interactions
- **User action logging** — what the user did with AI output
- **Outcome tracking** — did the user find an attorney? What happened to the case?
- **Regular safety review** — quarterly review of AI outputs for scope creep
- **Kill switch** — ability to instantly disable any AI feature that is causing harm

---

## 7. Roadmap

### Phase 1: Foundation (Current → Q2 2026)
*"Make what exists solid."*

- [x] Stabilize existing case management for personal use (4 active cases) — `cases/*/case.json`, validated; missing trigger dates named per case (2026-09-09)
- [ ] Harden OCR-Provenance pipeline — provider interface + HTTP adapter exist (`src/document-pipeline/ocr.ts`); the service's contract is still unverified
- [x] Implement structured case file format (JSON schema) — `schema/case.schema.json` (2026-09-09)
- [x] Build deadline engine with jurisdiction-aware calculations — `rules/deadlines.json` (IA, WI, federal) + `src/deadline-engine`; every rule `verified:false` until counsel confirms (2026-09-09)
- [x] Document classification pipeline — rule-based, cues + confidence + sha256 provenance (2026-09-09)
- [x] Safety rail framework (output classification system) — `src/safety-rails`: gate, audit log, kill switch (2026-09-09)
- [x] Basic web UI for case dashboard — static `build/dashboard.html` via `sclegal dashboard` (2026-09-09)

### Phase 2: Pro Se MVP (Q3–Q4 2026)
*"Help one person not default."*

- [ ] Answer scaffolding for common case types (debt collection, eviction)
- [ ] Procedural checklists by case type and jurisdiction (Wisconsin first)
- [ ] Attorney referral directory integration
- [ ] Multi-channel deadline alerts (email + SMS)
- [ ] User authentication and data encryption
- [ ] Onboarding flow: "I was just served a lawsuit. What do I do?"
- [ ] Beta testing with legal aid organizations

### Phase 3: Attorney Platform (Q1–Q2 2027)
*"Make Sarah's life easier."*

- [ ] Multi-tenant architecture
- [ ] Attorney dashboard and case sharing
- [ ] Client intake pipeline
- [ ] Bulk document ingestion and organization
- [ ] Court calendar management
- [ ] Integration with legal aid case management systems
- [ ] Attorney-verified procedural templates

### Phase 4: Scale (Q3 2027+)
*"Serve thousands."*

- [ ] Multi-jurisdiction expansion (beyond Wisconsin)
- [ ] Court e-filing integration
- [ ] Community features (attorney matching, legal aid coordination)
- [ ] API for third-party legal aid tools
- [ ] Mobile-first experience
- [ ] Outcome data collection (anonymized) for systemic advocacy

---

## 8. Success Metrics

### Primary Metrics (The Only Ones That Matter)

| Metric | Target | Why |
|--------|--------|-----|
| **Default judgments prevented** | Track per user | The core mission. Did the person file a timely answer? |
| **Attorney connections made** | Track per case | Did the platform help them find real legal help? |
| **Time to organized case file** | < 1 hour from intake | When a user meets an attorney, is the case ready to evaluate? |

### Secondary Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Deadline compliance rate | > 95% | Are reminders working? |
| Document OCR accuracy | > 98% | Is the pipeline reliable? |
| User satisfaction (attorney users) | > 4/5 | Are professionals finding value? |
| Platform uptime | > 99.5% | Legal deadlines don't wait |
| Safety rail trigger rate | Monitor trend | How often does AI try to cross scope boundaries? |

### Anti-Metrics (Things We Explicitly Do NOT Optimize)

| Anti-Metric | Why |
|-------------|-----|
| "Cases won" | We don't win cases. Lawyers win cases. |
| "AI legal arguments generated" | This number should be ZERO. |
| "User engagement time" | People should get organized, find a lawyer, and leave. We're not building addiction. |
| "AI accuracy on legal analysis" | We don't do legal analysis. There's nothing to measure. |

---

## 9. Open Questions

### Legal & Ethical
1. **UPL risk:** At what point does procedural guidance become unauthorized practice of law? Need formal legal opinion on platform boundaries per jurisdiction.
2. **Liability:** If a user relies on a deadline calculation that's wrong, what's the liability exposure? Need E&O analysis.
3. **Attorney ethics:** Can attorneys ethically use AI-organized case files? Need state bar guidance (varies by jurisdiction).
4. **Data retention:** How long do we keep case data? What are destruction obligations?

### Product
5. **Answer scaffolding scope:** How far can we go with answer templates without crossing into UPL? General denial only, or can we include common affirmative defenses as checkboxes (with heavy disclaimers)?
6. **Jurisdiction priority:** Wisconsin first (home jurisdiction), but what's the expansion order? By user demand? By legal aid partnership interest?
7. **Revenue model:** Free for pro se users? Freemium for attorneys? Grant-funded? This affects architecture decisions.
8. **Open source scope:** The platform is under Space Child License v1.0. How much of the AI safety rail system should be open for community audit vs. kept proprietary to prevent circumvention?

### Technical
9. **LLM selection:** Which models for which tasks? Cost vs. accuracy tradeoffs for OCR, classification, summarization.
10. **Offline capability:** Pro se users may have limited internet access. Can core features work offline/low-bandwidth?
11. **Accessibility:** WCAG compliance level? Multi-language support timeline? (Many underserved litigants are ESL.)
12. **Integration standards:** Should we build toward Legal Services Corporation (LSC) data standards for legal aid interoperability?

### Community & Partnerships
13. **Legal aid partnerships:** Which organizations to approach first? Wisconsin Judicare? Legal Action of Wisconsin?
14. **Law school clinics:** Can this serve as a teaching tool? Clinical programs could provide supervised attorney review.
15. **The practitioner's challenge:** He said AI legal platforms do more harm than good. Can we prove him wrong by building one that explicitly *doesn't* do what the harmful ones do? Or does he have a point that the mere existence of the platform creates false confidence?

---

## Appendix A: The a consumer attorney Test

Before shipping any feature, apply this test:

1. **Would a practicing attorney say this is practicing law?** → If yes, don't ship it.
2. **Could this give a user false confidence?** → If yes, add friction (disclaimers, "find a lawyer" prompts, mandatory acknowledgments).
3. **Could a wrong AI output here create bad case law?** → If yes, remove the AI from this workflow entirely.
4. **Does this help the user find a real lawyer faster?** → If no, deprioritize it.
5. **Is the AI doing something a file clerk would do, or something a lawyer would do?** → File clerk work = good. Lawyer work = out of scope.

---

## Appendix B: Space Child License v1.0

This platform is governed by the Space Child License v1.0, a novel peace-conditional open source license. The license reflects the same values as the platform: technology should serve human flourishing, not extraction.

Key license provisions relevant to this PRD:
- Peace-conditional: The software may not be used for military applications or weapons systems
- Open source: The community can audit, improve, and extend the platform
- Attribution required: Derivative works must credit the original

---

*"The arc of the moral universe is long, but it bends toward justice — if someone files the damn answer on time."*

— Space Child Legal design philosophy
