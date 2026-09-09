#!/usr/bin/env node
// scl-audit.mjs — does every repository that carries the Space Child License say so consistently?
//
//   node tools/scl-audit.mjs --root <dir>           scan <dir>/<owner>/<name> checkouts, print a table
//   node tools/scl-audit.mjs --repo <path> [...]    scan specific checkouts
//   node tools/scl-audit.mjs ... --json             machine-readable (feeds scl-plan)
//   node tools/scl-audit.mjs ... --fix              rewrite manifest license lines to point at the LICENSE file
//
// LICENSE form: "full" = the canonical text, "reference" = the 17-line notice stub pointing at
// legal.spacechild.love (59 of 62 repos on 2026-09-09). --fix touches manifests only; use
// scl-apply to upgrade a stub or put a repository under the license.
import { readdirSync, statSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { audit, fixManifests } from "./lib/scl.mjs";

const args = process.argv.slice(2);
const has = (k) => args.includes(k);
const vals = (k) => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));

const targets = [];
for (const r of vals("--repo")) targets.push({ dir: r, label: basename(dirname(r)) + "/" + basename(r) });
for (const root of vals("--root")) {
  for (const owner of readdirSync(root)) {
    const od = join(root, owner);
    if (!statSync(od).isDirectory()) continue;
    for (const name of readdirSync(od)) {
      const d = join(od, name);
      if (statSync(d).isDirectory()) targets.push({ dir: d, label: `${owner}/${name}` });
    }
  }
}
if (!targets.length) { console.error("give --root <dir> or --repo <path>"); process.exit(2); }

const rows = targets.map((t) => audit(t.dir, t.label));
const scl = rows.filter((r) => r.license && r.license.kind === "SCL");
const bad = scl.filter((r) => r.contradictions.length);
const stubs = scl.filter((r) => r.license.form === "reference");
const wording = scl.filter((r) => r.readme.callsItOpenSource);

if (has("--fix")) for (const r of bad) console.log(`fixed ${r.repo}: ${fixManifests(r.dir, r).join(", ")}`);

if (has("--json")) {
  console.log(JSON.stringify({ scanned: rows.length, scl: scl.length, contradicting: bad.length, reference_only: stubs.length, rows }, null, 1));
} else {
  const w = Math.max(...rows.map((r) => r.repo.length), 10);
  for (const r of scl) {
    const decls = r.manifests.map((m) => `${m.file}=${m.decl === null ? "-" : m.decl}`).join("  ");
    const flag = r.contradictions.length ? "CONTRADICTS" : r.license.form === "reference" ? "stub       " : r.readme.callsItOpenSource ? "wording    " : "ok         ";
    const drift = r.license.drift.length ? ` [${r.license.drift.join(",")}]` : "";
    console.log(`${flag} ${r.repo.padEnd(w)}  ${r.license.file} v${r.license.version || "?"} ${r.license.form}${drift}  ${decls}`);
  }
  console.log(`\n${rows.length} scanned; ${scl.length} carry the Space Child License (${stubs.length} as the notice stub, ${scl.length - stubs.length} full text); ` +
    `${bad.length} manifest contradiction(s); ${wording.length} README(s) call it open source.`);
  const noLicense = rows.filter((r) => !r.license);
  if (noLicense.length) console.log(`${noLicense.length} have no LICENSE file at all.`);
}
process.exit(has("--fix") ? 0 : bad.length ? 1 : 0);
