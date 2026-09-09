#!/usr/bin/env node
// scl-plan.mjs — from an audit and GitHub metadata, what does each repository need? A table for a
// human to decide from ("where it makes sense"), not a script that changes anything.
//
//   node tools/scl-audit.mjs --root <dir> --json > audit.json
//   node tools/scl-plan.mjs audit.json [--gh] [--owner spacechild-labs] [--md]
//
// --gh asks GitHub (via `gh api`) whether each repo is a fork, archived, or private, so forks are
// never relicensed and archived repos are left alone. --owner filters the table. --md prints a
// markdown table suitable for a tracking issue.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { plan } from "./lib/scl.mjs";

const args = process.argv.slice(2);
const has = (k) => args.includes(k);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const file = args.find((a) => !a.startsWith("--") && a !== opt("--owner"));
if (!file) { console.error("scl-plan <audit.json> [--gh] [--owner X] [--md]"); process.exit(2); }

const auditData = JSON.parse(readFileSync(file, "utf8"));
let rows = auditData.rows;
if (opt("--owner")) rows = rows.filter((r) => r.repo.startsWith(opt("--owner") + "/"));

const meta = {};
if (has("--gh")) {
  for (const r of rows) {
    try {
      const j = JSON.parse(execFileSync("gh", ["api", `repos/${r.repo}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
      meta[r.repo] = { fork: !!j.fork, archived: !!j.archived, private: !!j.private, pushed_at: (j.pushed_at || "").slice(0, 10), full_name: j.full_name };
      if (j.full_name && j.full_name !== r.repo) meta[r.repo].moved_to = j.full_name;
    } catch { meta[r.repo] = { unreachable: true }; }
  }
}
const table = plan(rows, meta);
const counts = {};
for (const t of table) counts[t.action] = (counts[t.action] || 0) + 1;

if (has("--md")) {
  console.log("| Repository | Action | Why | Private | Last push |\n|---|---|---|---|---|");
  for (const t of table) console.log(`| ${t.repo}${meta[t.repo]?.moved_to ? ` → ${meta[t.repo].moved_to}` : ""} | ${t.action} | ${t.why} | ${t.private === null ? "" : t.private ? "yes" : "no"} | ${t.pushed_at || ""} |`);
} else {
  const w = Math.max(...table.map((t) => t.repo.length));
  for (const t of table) console.log(`${t.action.padEnd(18)} ${t.repo.padEnd(w)}  ${t.why}`);
}
console.log(`\n${table.length} repositories: ` + Object.entries(counts).sort().map(([k, v]) => `${k} ${v}`).join(", "));
