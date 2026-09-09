# Space Child Legal — architecture

This repository is the Space Child **software licensing** program: the Space Child License, the
research behind it, the counsel brief, and the tooling that applies and audits the license across
the organisation's repositories. It also carries a small, generic matter-tracking engine (a file
clerk, not a lawyer) that the program uses for its own single matter and that other Space Child
software can reuse. No personal legal matter lives here.

```
legal/space-child-license/  the license (v1.0 in effect, v1.1 draft), rationale, counsel brief, audits
cases/SC-001-ip/            the licensing matter itself: IP audit, research, case.json
licensing/                  canonical full text, NOTICE template, manifest.json (hashes, SPDX id, URL), contributor terms
tools/lib/scl.mjs           the library: read, audit, check, apply, plan
tools/scl-{audit,check,apply,plan}.mjs   thin CLIs over it; .github/workflows/scl-check.yml is the reusable CI gate
schema/case.schema.json     the generic matter record (organizational fields only)
rules/deadlines.json        statutory clocks with authorities, all verified:false
src/
  case-manager/             types, dependency-free JSON-Schema validator, loader
  deadline-engine/          triggers × rules → due dates; holiday rolling; court dates outrank computed ones
  document-pipeline/        classification with named cues and confidence; sha256 provenance; OCR provider interface
  safety-rails/             ORGANIZATIONAL / INFORMATIONAL / LEGAL_ANALYSIS classifier; gate; append-only audit; kill switch
  timeline/                 events + triggers + deadlines + dated documents, ordered, sourced
  dashboard/                one static HTML page from the case files (build/, never committed)
  cli.ts                    sclegal cases | validate | deadlines | timeline | classify | ingest | check | dashboard
  tests/                    node:test, invented fixtures only
```

## The licensing program

1. **Text.** `SPACE-CHILD-LICENSE-v1.0.md` governs every repository that carries it today.
   `SPACE-CHILD-LICENSE-v1.1-DRAFT.md` is the redraft for counsel; `v1.1-REDLINE-AND-COUNSEL-BRIEF.md`
   lists what changed and the questions only a lawyer can answer.
2. **Consistency.** `tools/scl-audit.mjs --root <checkouts>` reads LICENSE, package.json, Cargo.toml,
   pyproject.toml and README per repository and names every contradiction; `--fix` rewrites only the
   manifest line so registries advertise the license the LICENSE file grants. Changes go out as pull
   requests because they change the terms on which a repository is offered.
3. **Application.** Which repositories carry the license, which must not (forks), and how a
   previously MIT-licensed repository transitions, follows the IP audit's migration plan.
4. **Legitimacy.** Counsel review → Licensor entity → public canonical text at a stable URL →
   SPDX identifier → trademark filings. The brief tracks each.

## The engine

`case.json` holds who, where, which dates started which clocks, what happened, which documents
exist. It has no field for a legal theory. `sclegal deadlines` computes statutory clocks from
recorded trigger dates and never guesses a missing one; every computed date carries its authority,
`verified:false`, and the disclaimer. `gate()` is the only path by which AI-produced text reaches a
person: green passes, yellow carries the mandatory disclaimer, red is withheld with the reason,
and every call is one append-only audit line holding a hash of the input. `SCLEGAL_AI_DISABLED=1`
withholds everything. There is no model behind the gate yet; the gate exists first.

## What is deliberately absent

- Any personal legal matter. The tracked matter is the licensing program.
- Any legal conclusion, defense, argument, or citation produced by software.
- Case data outside `case.json` and the committed research: the dashboard and the audit log are
  generated into gitignored directories.
