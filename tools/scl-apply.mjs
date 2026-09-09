#!/usr/bin/env node
// scl-apply.mjs — put a repository under the Space Child License, or bring one that already
// carries it to canonical form: full-text LICENSE, NOTICE with holder and years, manifest license
// lines pointing at the file, a README license section, optional SPDX headers.
//
//   node tools/scl-apply.mjs <path> --dry-run                  print the plan, change nothing
//   node tools/scl-apply.mjs <path> [--holder "Name"] [--year 2025] [--headers] [--no-upgrade-stub]
//   node tools/scl-apply.mjs <path> --fork                     refuse (a fork keeps its upstream license)
//
// Refuses copyleft-licensed repositories and substantive LICENSE text differences: those are
// decisions. A previously permissive LICENSE is kept as LICENSE-<kind>-prior beside a dated
// RELICENSING.md, because that earlier grant cannot be revoked. Commit the result as a pull
// request: it changes the terms on which the repository is offered.
import { resolve } from "node:path";
import { apply } from "./lib/scl.mjs";

const args = process.argv.slice(2);
const has = (k) => args.includes(k);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const target = resolve(args.find((a) => !a.startsWith("--") && a !== opt("--holder") && a !== opt("--year")) || ".");

const res = apply(target, {
  holder: opt("--holder") || "Nick Flach",
  year: opt("--year") || null,
  headers: has("--headers"),
  upgradeStub: !has("--no-upgrade-stub"),
  fork: has("--fork"),
  dryRun: has("--dry-run"),
});

console.log(`scl-apply ${target}${has("--dry-run") ? " (dry run)" : ""}`);
if (res.blocked) { console.log(`  BLOCKED: ${res.blocked}`); process.exit(3); }
if (!res.actions.length) console.log("  already canonical; nothing to do");
for (const a of res.actions) console.log(`  ${a.kind.padEnd(7)} ${a.file.padEnd(28)} ${a.detail}`);
if (!has("--dry-run") && res.actions.length) console.log("\nReview the diff and open a pull request; do not push a license change straight to the default branch.");
