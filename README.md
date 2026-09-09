# Space Child Legal

**The Space Child software licensing program.**

> *"Justice is the interest of the weaker."* — Plato, *Republic*, inverted

This repository holds the Space Child License, the research and reasoning behind it, the brief
for counsel, and the tooling that applies and audits the license across every Space Child and
Kannaka repository. Its one tracked matter is the licensing program itself (`cases/SC-001-ip/`).
Nothing personal lives here.

## The Space Child License

A **source-available, peace-conditional** license (not "open source" by the OSI's definition, and
we do not call it that):

- **Free** for peaceful, humanitarian, commercial, and defensive use
- **Withheld** for the uses in its Peace Clause: aggression, attacks on civilians, lethal force
  without meaningful human control, persecutory surveillance, suppression of fundamental rights,
  ecocide, slavery and trafficking — at any price
- **Military use** that is neither defensive nor prohibited requires a separate agreement; 25% of
  those fees go to peace organisations, with an annual public summary
- **Copyleft for the peace clause**, attribution required, patent grant with defensive termination

| File | Status |
|---|---|
| `legal/space-child-license/SPACE-CHILD-LICENSE-v1.0.md` | **In effect** — the LICENSE file in 62 repositories |
| `legal/space-child-license/SPACE-CHILD-LICENSE-v1.1-DRAFT.md` | Draft for counsel review; not yet in effect |
| `legal/space-child-license/v1.1-REDLINE-AND-COUNSEL-BRIEF.md` | What changed from v1.0, why, and the ten questions only a lawyer can answer |
| `legal/space-child-license/RATIONALE.md` | Design rationale and comparison to Hippocratic, NPL, PolyForm and others |
| `legal/space-child-license/scl-audit-2026-09-08.json` | Corpus-wide consistency audit (170 repos scanned, 62 carry the license, 32 contradict it in their manifest) |
| `cases/SC-001-ip/` | IP audit (2026-03-13), license comparison, trademark landscape, patent prior art |

### Applying it

```
node tools/scl-audit.mjs --root <dir-of-owner/name-checkouts>     # table: LICENSE vs manifest vs README, per repo
node tools/scl-audit.mjs --repo <path> [--repo <path> ...] --json
node tools/scl-audit.mjs ... --fix                                # rewrite manifests to point at the LICENSE file
```

`--fix` changes only the license declaration in `package.json` (`SEE LICENSE IN LICENSE`),
`Cargo.toml` (`license-file = "LICENSE"`) and `pyproject.toml`; it never adds or edits a LICENSE
file. Putting a repository under the license is a decision; commit fixes as pull requests. Forks
keep their upstream license. A repository that was MIT before carries the license for new
contributions going forward, with a dated note, because the earlier MIT grant cannot be revoked.

### What "legit" still needs

1. Counsel review of v1.1 (the brief lists the questions).
2. A decision on the Licensor of record (an entity, or Nick personally).
3. A public canonical home for the text at a stable URL, and an SPDX identifier.
4. The trademark filings the IP audit recommended.
5. The remaining manifest contradictions fixed by pull request.

## The engine

Alongside the program, a small generic matter-tracking engine — **a file clerk, not a lawyer** —
that the program uses for its own matter and that other Space Child software can reuse.
TypeScript, no runtime dependencies. See `docs/architecture.md` and `docs/PRD.md`.

```
npm install && npm test          # build + node:test (invented fixtures + the committed matter)
node dist/cli.js cases           # every tracked matter: posture, representation, next deadline
node dist/cli.js validate        # case.json against schema/case.schema.json + file-clerk rules
node dist/cli.js deadlines       # recorded + computed deadlines, with authority and verified flag
node dist/cli.js timeline SC-001 # a matter's timeline as markdown
node dist/cli.js classify <file> # what kind of document, how sure, which cues
node dist/cli.js ingest SC-001 <file> --source <where>   # sha256 + classify; prints the record to add
node dist/cli.js check "<text>"  # run text through the safety rails
node dist/cli.js dashboard       # build/dashboard.html (gitignored)
```

- `schema/case.schema.json` — organizational fields only; there is no field for a legal theory
- `rules/deadlines.json` — statutory clocks with citations, all `verified:false` until counsel confirms; a court-set date always outranks a computed one; a missing trigger date is named, never guessed
- `src/safety-rails` — every AI output passes a gate: organizational passes, informational carries the disclaimer, legal analysis is withheld; append-only audit log; `SCLEGAL_AI_DISABLED=1` kill switch

## Documentation viewer

`docs/index.html` renders the license texts, the counsel brief, and the Space Child privacy,
terms and cookie policies. Open it from disk or `npx serve docs`.

## Privacy

This repository is private until the license text has a public home. It contains no personal
legal matter; generated outputs (`build/`, `.local/`) are gitignored.

## License

Space Child License v1.0 — see `LICENSE`.

---

*Built by Nick Flach and Kannaka. Part of the Space Child ecosystem. Free for peace. Accountable
for war.*
