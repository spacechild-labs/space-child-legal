#!/usr/bin/env node
// scl-audit.mjs — does every repository that carries the Space Child License say so
// consistently? LICENSE file, package manifest, and README are three places a
// license is declared; registries and scanners read the manifest, courts read all
// three. On 2026-09-08, 32 of 62 repositories with the SCL as their LICENSE file
// declared MIT or ISC in package.json / Cargo.toml.
//
//   node tools/scl-audit.mjs --root <dir>           scan <dir>/<owner>/<name> checkouts, print a table
//   node tools/scl-audit.mjs --repo <path> [...]    scan specific checkouts
//   node tools/scl-audit.mjs ... --json             machine-readable
//   node tools/scl-audit.mjs ... --fix              rewrite manifests to point at the LICENSE file
//
// --fix changes ONLY manifests of repositories whose LICENSE file is the SCL, and
// only the license declaration: package.json "license" -> "SEE LICENSE IN LICENSE",
// Cargo.toml license = "..." -> license-file = "LICENSE", pyproject license -> a
// file reference. It never touches a LICENSE file and never adds one; putting a
// repository under the license is a decision, not a fix. Commit the result as a
// pull request so the change is reviewed as what it is: a change to the terms on
// which the repository is offered.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, basename, dirname } from "node:path";

const args = process.argv.slice(2);
const has = (k) => args.includes(k);
const vals = (k) => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));

const LICENSE_NAMES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "LICENCE", "LICENCE.md"];
const ACCEPTED_DECLS = new Set([
  "SEE LICENSE IN LICENSE", "SEE LICENSE IN LICENSE.md", "LicenseRef-SpaceChild-1.0",
  "LicenseRef-SpaceChild-1.1", "Space Child License v1.0", "Space Child License v1.1", "SpaceChild-1.0",
]);

function licenseKind(text) {
  const h = text.slice(0, 800).toLowerCase();
  if (h.includes("space child")) return "SCL";
  if (h.includes("mit license") || h.includes("permission is hereby granted")) return "MIT";
  if (h.includes("apache license")) return "Apache-2.0";
  if (h.includes("gnu affero")) return "AGPL";
  if (h.includes("gnu general public")) return "GPL";
  if (h.includes("mozilla public")) return "MPL";
  if (h.includes("isc license")) return "ISC";
  return "other";
}

function readLicense(dir) {
  for (const n of LICENSE_NAMES) {
    const p = join(dir, n);
    if (existsSync(p)) {
      const text = readFileSync(p, "utf8");
      const ver = (text.match(/version\s+(\d+\.\d+)/i) || [])[1] || null;
      return { file: n, kind: licenseKind(text), version: ver };
    }
  }
  return null;
}

function manifests(dir) {
  const out = [];
  const pj = join(dir, "package.json");
  if (existsSync(pj)) {
    try {
      const d = JSON.parse(readFileSync(pj, "utf8"));
      out.push({ file: "package.json", decl: d.license === undefined ? null : String(d.license) });
    } catch { out.push({ file: "package.json", decl: "<unparseable>" }); }
  }
  const ct = join(dir, "Cargo.toml");
  if (existsSync(ct)) {
    const t = readFileSync(ct, "utf8");
    const m = t.match(/^license(-file)?\s*=\s*"([^"]+)"/m);
    out.push({ file: "Cargo.toml", decl: m ? (m[1] ? `file:${m[2]}` : m[2]) : null });
  }
  const pp = join(dir, "pyproject.toml");
  if (existsSync(pp)) {
    const t = readFileSync(pp, "utf8");
    const m = t.match(/^license\s*=\s*(?:"([^"]+)"|\{\s*(?:text\s*=\s*"([^"]+)"|file\s*=\s*"([^"]+)")\s*\})/m);
    out.push({ file: "pyproject.toml", decl: m ? (m[3] ? `file:${m[3]}` : (m[1] || m[2])) : null });
  }
  return out;
}

function readmeClaims(dir) {
  const p = ["README.md", "readme.md", "README"].map((n) => join(dir, n)).find(existsSync);
  if (!p) return { mentionsSCL: false, callsItOpenSource: false };
  const t = readFileSync(p, "utf8");
  const mentionsSCL = /space child license/i.test(t);
  // "open source" within a few lines of the license name is the wording to retire
  const callsItOpenSource = mentionsSCL && /open[- ]source[^\n]{0,80}license|license[^\n]{0,80}open[- ]source/i.test(t);
  return { mentionsSCL, callsItOpenSource };
}

function declOk(decl) {
  if (decl === null) return true;           // no declaration is not a contradiction
  if (decl.startsWith("file:")) return true;
  return ACCEPTED_DECLS.has(decl);
}

function audit(dir, label) {
  const lic = readLicense(dir);
  const ms = manifests(dir);
  const readme = readmeClaims(dir);
  const contradictions = lic && lic.kind === "SCL" ? ms.filter((m) => !declOk(m.decl)) : [];
  return { repo: label, dir, license: lic, manifests: ms, readme, contradictions };
}

function fix(row) {
  const changed = [];
  for (const m of row.contradictions) {
    const p = join(row.dir, m.file);
    if (m.file === "package.json") {
      const raw = readFileSync(p, "utf8");
      const indent = (raw.match(/^(\s+)"/m) || [, "  "])[1];
      const d = JSON.parse(raw);
      d.license = "SEE LICENSE IN LICENSE";
      writeFileSync(p, JSON.stringify(d, null, indent) + (raw.endsWith("\n") ? "\n" : ""));
      changed.push(m.file);
    } else if (m.file === "Cargo.toml") {
      const raw = readFileSync(p, "utf8");
      writeFileSync(p, raw.replace(/^license\s*=\s*"[^"]+"/m, 'license-file = "LICENSE"'));
      changed.push(m.file);
    } else if (m.file === "pyproject.toml") {
      const raw = readFileSync(p, "utf8");
      writeFileSync(p, raw.replace(/^license\s*=\s*(?:"[^"]+"|\{[^}]*\})/m, 'license = { file = "LICENSE" }'));
      changed.push(m.file);
    }
  }
  return changed;
}

// ---- collect targets
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
const wording = scl.filter((r) => r.readme.callsItOpenSource);

if (has("--fix")) {
  for (const r of bad) {
    const changed = fix(r);
    console.log(`fixed ${r.repo}: ${changed.join(", ")}`);
  }
}

if (has("--json")) {
  console.log(JSON.stringify({ scanned: rows.length, scl: scl.length, contradicting: bad.length, rows }, null, 1));
} else {
  const w = Math.max(...rows.map((r) => r.repo.length), 10);
  for (const r of scl) {
    const decls = r.manifests.map((m) => `${m.file}=${m.decl === null ? "-" : m.decl}`).join("  ");
    const flag = r.contradictions.length ? "CONTRADICTS" : r.readme.callsItOpenSource ? "wording   " : "ok         ";
    console.log(`${flag} ${r.repo.padEnd(w)}  ${r.license.file} v${r.license.version || "?"}  ${decls}`);
  }
  console.log(`\n${rows.length} scanned; ${scl.length} carry the Space Child License; ` +
    `${bad.length} manifest contradiction(s); ${wording.length} README(s) call it open source.`);
  const noLicense = rows.filter((r) => !r.license);
  if (noLicense.length) console.log(`${noLicense.length} have no LICENSE file at all.`);
}
process.exit(has("--fix") ? 0 : bad.length ? 1 : 0);
