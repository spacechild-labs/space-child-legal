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
├── src/                    # Application source
│   ├── case-manager/      # Case tracking engine
│   ├── email-ingestion/   # Gmail integration
│   ├── research-agent/    # AI legal research
│   └── timeline/          # Case timeline builder
├── evidence/               # Evidence management (gitcrypted)
└── LICENSE                 # Space Child License v1.0
```

## Active Cases

| Case ID | Matter | Status | Priority |
|---------|--------|--------|----------|
| SC-001 | Space Child IP Protection & Licensing | Active | High |

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
