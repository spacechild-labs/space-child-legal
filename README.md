# Space Child Legal

**AI-powered Legal Case Tracking and Management**

> *"Justice is the interest of the weaker."* — Platonic Justice

## Mission

Space Child Legal exists to deliver justice using the full power of AI alignment — not as a replacement for human lawyers, but as the force multiplier that gives individuals a fighting chance against organizations, governments, and systems that hold structural power over them.

### Guiding Principles

1. **Platonic Justice** — Justice serves the weaker party. The individual human is almost always weaker than the organization. We fight for the individual.
2. **Peace-first** — Built for humanity's benefit. Aligned with peaceful purpose. Used to defend, not oppress.
3. **Reality-accepted** — We don't pretend the world is simple. Self-defense is critical. Power structures exist. We navigate the fog of war.
4. **Radical transparency** — With the client. Never against them.
5. **Self-accountability** — We don't claim innocence. We claim humanity. People make mistakes. The system's job is justice, not punishment beyond proportion.

## Architecture

```
space-child-legal/
├── cases/                  # Case files (encrypted at rest)
│   ├── SC-001-ip/         # Space Child IP Protection
├── legal/                  # Legal research and frameworks
│   ├── space-child-license/ # Custom Space Child License
│   └── research/          # Case law, statutes, precedents
├── docs/                   # Documentation
│   ├── PRD.md             # Product Requirements
│   └── architecture.md    # System design
├── schema/                 # case.schema.json — the case file contract
├── rules/                  # deadlines.json — statutory clocks with authorities (all unverified)
├── src/                    # Application source (TypeScript, no runtime deps)
│   ├── case-manager/      # types, validator, loader
│   ├── deadline-engine/   # triggers × rules → due dates
│   ├── document-pipeline/ # classification, provenance, OCR providers
│   ├── safety-rails/      # output classifier, gate, audit log, kill switch
│   ├── timeline/          # case timeline builder
│   ├── dashboard/         # static HTML dashboard
│   └── cli.ts             # sclegal
├── evidence/               # Evidence management (gitcrypted)
└── LICENSE                 # Space Child License v1.0
```

## Active Cases

| Case ID | Matter | Status | Priority |
|---------|--------|--------|----------|
| SC-001 | Space Child IP Protection & Licensing | Active | High |

## Phase 1 — the file clerk (shipped 2026-09-09)

```
npm install && npm test          # build + node:test (runs against the real case files too)
node dist/cli.js cases           # every matter: posture, representation, next deadline
node dist/cli.js validate        # case.json against schema/case.schema.json + file-clerk rules
node dist/cli.js deadlines       # recorded + computed deadlines, with authority and verified flag
node dist/cli.js timeline SC-002 # the timeline as markdown
node dist/cli.js classify <file> # what kind of document, how sure, which cues
node dist/cli.js ingest SC-003 <file> --source "court e-filing"   # hash + classify; prints the record to add
node dist/cli.js check "<text>"  # run text through the safety rails
node dist/cli.js dashboard       # build/dashboard.html (gitignored — it contains case data)
```

What it is: `cases/<slug>/case.json` (schema in `schema/`), a deadline engine over
`rules/deadlines.json` (every rule cites its authority and is `verified:false` until a lawyer
confirms it; a court-set date always outranks a computed one), a rule-based document classifier
with sha256 provenance, the safety-rail gate every AI output must pass (organizational /
informational-with-disclaimer / blocked, append-only audit log, `SCLEGAL_AI_DISABLED=1` kill
switch), a timeline builder, and a static dashboard that puts "find a lawyer" first on any matter
without retained counsel. Design notes: `docs/architecture.md`. No runtime dependencies.

## Documentation Viewer

A clean, responsive web interface for viewing legal documents:

📖 **View online**: Open `docs/index.html` in your browser
🚀 **Local development**: Run `npx serve docs` or `python -m http.server` from the docs/ directory

The viewer includes:
- Privacy Policy
- Terms of Service  
- Cookie Policy
- Space Child License v1.0

Built with vanilla HTML/CSS/JS and dark mode aesthetic matching Space Child branding.

## The Space Child License

A source-available, peace-conditional license designed for humanity's benefit (not "open source" by the OSI's definition, and we do not call it that):
- **Free to use** for peaceful, humanitarian purposes
- **Encouraged** for projects benefiting humanity
- **Violations** include use in warfare, oppression, or harm
- **Government/military use** requires paid licensing for offensive operations
- **Self-defense** explicitly permitted
- Legally credible. Not MIT. Not Apache. Something new.
- **v1.1 draft for counsel review:** `legal/space-child-license/SPACE-CHILD-LICENSE-v1.1-DRAFT.md` — with `v1.1-REDLINE-AND-COUNSEL-BRIEF.md` (what changed, what a lawyer must decide) and `tools/scl-audit.mjs` (does every repo declare it consistently?)

## Privacy & Security

This repository is **private**. It contains sensitive legal information.
- Case files are encrypted at rest
- No sensitive data in commit messages
- Evidence stored with git-crypt or equivalent
- Attorney-client privilege considerations apply once counsel is engaged

## Technology Stack

- **AI**: Anthropic Claude, OpenAI (alignment-focused usage)
- **Search**: Google, Brave (legal research)
- **Email**: Gmail integration (case correspondence tracking)
- **Storage**: Git (encrypted), local-first
- **State**: Flux (optional, for cross-agent coordination)

---

*Built by Nick Flach and Kannaka. Part of the Space Child ecosystem.*
*Stress-tested on real cases. Because the best way to build justice is to need it.*
