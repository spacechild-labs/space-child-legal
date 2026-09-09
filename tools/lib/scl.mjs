// scl.mjs — the one library behind scl-audit, scl-check, scl-apply and scl-plan.
//
// Facts it enforces, measured on 2026-09-09 across 170 checkouts:
//   - 62 repositories carried the Space Child License; 59 of them as a 17-line NOTICE-style stub
//     pointing at https://legal.spacechild.love, not the license text. A reference-only LICENSE
//     depends on that URL staying up. The canonical LICENSE is the full text; the stub is the
//     NOTICE that accompanies it.
//   - 32 of the 62 declared MIT or ISC in their manifest. Registries read the manifest.
//   - The deployed stubs differed only by BOM, trailing newline, year and holder; comparisons are
//     made on normalised bytes with those fields masked.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ---------------------------------------------------------------- canonical artifacts

let manifestCache = null;
export function manifest() {
  if (!manifestCache) manifestCache = JSON.parse(readFileSync(join(REPO_ROOT, "licensing", "manifest.json"), "utf8"));
  return manifestCache;
}

/** The canonical text, notice template, SPDX id and URL for a version that is in effect. */
export function canonical(version = "1.0") {
  const v = manifest().versions.find((x) => x.version === version);
  if (!v) throw new Error(`no such license version ${version}`);
  if (v.status !== "in-effect") throw new Error(`version ${version} is ${v.status}; only an in-effect version may be applied`);
  const text = normalize(readFileSync(join(REPO_ROOT, v.full_text), "utf8"));
  const notice = normalize(readFileSync(join(REPO_ROOT, v.notice_template), "utf8"));
  return { version, text, sha256: sha256(text), notice, spdx: v.spdx, url: manifest().canonical_url };
}

export function normalize(text) {
  return text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n*$/, "") + "\n";
}
export function sha256(text) { return createHash("sha256").update(text).digest("hex"); }

/** A NOTICE/stub with its year and holder masked, so any repo's copy compares against the template. */
export function maskNotice(text) {
  return normalize(text).replace(/Copyright \(c\) [^\n]*/i, "Copyright (c) [YEAR] [COPYRIGHT HOLDER]")
    .replace(/https:\/\/legal\.spacechild\.love(?:\/license)?\/?/g, "https://legal.spacechild.love/license");
}

// ---------------------------------------------------------------- reading a repository

export const LICENSE_NAMES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "LICENCE", "LICENCE.md", "COPYING"];
export const ACCEPTED_DECLS = new Set([
  "SEE LICENSE IN LICENSE", "SEE LICENSE IN LICENSE.md", "SEE LICENSE IN LICENSE.txt",
  "LicenseRef-SpaceChild-1.0", "LicenseRef-SpaceChild-1.1", "Space Child License v1.0", "Space Child License v1.1", "SpaceChild-1.0",
]);

export function licenseKind(text) {
  const h = text.slice(0, 1200).toLowerCase();
  if (h.includes("space child")) return "SCL";
  if (h.includes("mit license") || h.includes("permission is hereby granted")) return "MIT";
  if (h.includes("apache license")) return "Apache-2.0";
  if (h.includes("gnu affero")) return "AGPL";
  if (h.includes("gnu lesser")) return "LGPL";
  if (h.includes("gnu general public")) return "GPL";
  if (h.includes("mozilla public")) return "MPL";
  if (h.includes("isc license")) return "ISC";
  if (h.includes("bsd")) return "BSD";
  return "other";
}

/**
 * What the LICENSE file is. form: "full" (the canonical text, possibly with drift), "reference"
 * (the NOTICE-style stub), "other" (mentions the license but is neither), or null when absent.
 */
export function readLicense(dir) {
  for (const n of LICENSE_NAMES) {
    const p = join(dir, n);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, "utf8");
    const kind = licenseKind(raw);
    const out = { file: n, kind, form: null, version: (raw.match(/version\s+(\d+\.\d+)/i) || [])[1] || null, canonical: false, drift: [] };
    if (kind !== "SCL") return out;
    const drift = [];
    if (raw.startsWith("﻿")) drift.push("bom");
    // CRLF in the working copy is drift only if the committed blob has it. On a Windows checkout
    // with core.autocrlf=true every LF file reads back as CRLF (2026-09-09: 28 freshly merged,
    // byte-identical LICENSE files "failed" strict mode that way). Ask the index.
    if (/\r\n/.test(raw) && indexEol(dir, n) !== "lf") drift.push("crlf");
    if (!raw.endsWith("\n") || /\n\n$/.test(raw)) drift.push("trailing-newline");
    const norm = normalize(raw);
    let canon = null;
    try { canon = canonical(out.version || "1.0"); } catch { /* unknown or draft version */ }
    if (canon && sha256(norm) === canon.sha256) { out.form = "full"; out.canonical = drift.length === 0; }
    else if (canon && maskNotice(norm) === maskNotice(canon.notice)) { out.form = "reference"; }
    else if (norm.split("\n").length < 40) { out.form = "reference"; drift.push("notice-text-differs"); }
    else { out.form = "full"; drift.push("content-differs"); }
    out.drift = drift;
    return out;
  }
  return null;
}

/** "lf" | "crlf" | "mixed" | null — the line endings of the file as committed, from `git ls-files --eol`. */
export function indexEol(dir, file) {
  try {
    const out = execFileSync("git", ["ls-files", "--eol", "--", file], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const m = out.match(/^i\/(lf|crlf|mixed|none)/);
    return m ? (m[1] === "none" ? null : m[1]) : null;
  } catch { return null; }
}

export function readNotice(dir) {
  const p = join(dir, "NOTICE");
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf8");
  return { present: true, isSCL: /space child license/i.test(raw), holder: (raw.match(/Copyright \(c\) (\d{4}(?:[-–]\d{4})?) (.+)/i) || []).slice(1) };
}

export function manifests(dir) {
  const out = [];
  const pj = join(dir, "package.json");
  if (existsSync(pj)) {
    try { const d = JSON.parse(readFileSync(pj, "utf8")); out.push({ file: "package.json", decl: d.license === undefined ? null : String(d.license) }); }
    catch { out.push({ file: "package.json", decl: "<unparseable>" }); }
  }
  const ct = join(dir, "Cargo.toml");
  if (existsSync(ct)) {
    const m = readFileSync(ct, "utf8").match(/^license(-file)?\s*=\s*"([^"]+)"/m);
    out.push({ file: "Cargo.toml", decl: m ? (m[1] ? `file:${m[2]}` : m[2]) : null });
  }
  const pp = join(dir, "pyproject.toml");
  if (existsSync(pp)) {
    const m = readFileSync(pp, "utf8").match(/^license\s*=\s*(?:"([^"]+)"|\{\s*(?:text\s*=\s*"([^"]+)"|file\s*=\s*"([^"]+)")\s*\})/m);
    out.push({ file: "pyproject.toml", decl: m ? (m[3] ? `file:${m[3]}` : (m[1] || m[2])) : null });
  }
  return out;
}

export function declOk(decl) {
  if (decl === null) return true;
  if (decl.startsWith("file:")) return true;
  return ACCEPTED_DECLS.has(decl);
}

export function readmePath(dir) {
  return ["README.md", "readme.md", "README", "README.rst"].map((n) => join(dir, n)).find(existsSync) || null;
}
export function readmeClaims(dir) {
  const p = readmePath(dir);
  if (!p) return { present: false, mentionsSCL: false, callsItOpenSource: false, hasLicenseSection: false };
  const t = readFileSync(p, "utf8");
  const mentionsSCL = /space child license/i.test(t);
  return {
    present: true, mentionsSCL,
    // "open source" near the license name is the wording to retire — unless the sentence is the
    // denial itself ('not "open source" by the OSI's definition'), which is the wording we want.
    callsItOpenSource: mentionsSCL && [...t.matchAll(/open[- ]source[^\n]{0,80}license|license[^\n]{0,80}open[- ]source/gi)]
      .some((m) => !/\bnot\s+(?:an?\s+)?["“']?open[- ]source|open[- ]source["”']?\s+by the OSI|not\s+open[- ]source/i.test(t.slice(Math.max(0, m.index - 12), m.index + m[0].length + 24))),
    hasLicenseSection: /^#{1,3}\s*licen[cs]e\b/im.test(t),
  };
}

export function audit(dir, label = basename(dir)) {
  const lic = readLicense(dir);
  const ms = manifests(dir);
  const readme = readmeClaims(dir);
  const notice = readNotice(dir);
  const contradictions = lic && lic.kind === "SCL" ? ms.filter((m) => !declOk(m.decl)) : [];
  return { repo: label, dir, license: lic, notice, manifests: ms, readme, contradictions };
}

// ---------------------------------------------------------------- fixing manifests

/** Rewrite only the license declaration line; never re-serialise (a JSON round-trip made 300-line diffs once). */
export function fixManifests(dir, row = audit(dir), { dryRun = false } = {}) {
  const changed = [];
  for (const m of row.contradictions) {
    const p = join(dir, m.file);
    const raw = readFileSync(p, "utf8");
    let next = raw;
    if (m.file === "package.json") next = raw.replace(/("license"\s*:\s*)"[^"]*"/, '$1"SEE LICENSE IN LICENSE"');
    else if (m.file === "Cargo.toml") next = raw.replace(/^license\s*=\s*"[^"]+"/m, 'license-file = "LICENSE"');
    else if (m.file === "pyproject.toml") next = raw.replace(/^license\s*=\s*(?:"[^"]+"|\{[^}]*\})/m, 'license = { file = "LICENSE" }');
    if (next === raw) continue;
    if (!dryRun) writeFileSync(p, next);
    changed.push(m.file);
  }
  return changed;
}

// ---------------------------------------------------------------- checking (CI gate)

/**
 * Problems, each with a code and a severity. "error" fails the check; "warn" is reported.
 * --strict promotes reference-only LICENSE and drift to errors.
 */
export function check(dir, { strict = false, requireNotice = false } = {}) {
  const row = audit(dir);
  const problems = [];
  const P = (code, message, severity = "error") => problems.push({ code, message, severity });
  if (!row.license) P("no-license", "no LICENSE file");
  else if (row.license.kind !== "SCL") P("other-license", `LICENSE is ${row.license.kind}, not the Space Child License`);
  else {
    if (row.license.form === "reference") P("reference-only", `LICENSE is the short notice pointing at ${manifest().canonical_url}; the full text should be the LICENSE file`, strict ? "error" : "warn");
    if (row.license.drift.includes("content-differs")) P("text-differs", "LICENSE text does not match the canonical text for its version");
    const cosmetic = row.license.drift.filter((d) => ["bom", "crlf", "trailing-newline"].includes(d));
    if (cosmetic.length) P("drift", `LICENSE differs from canonical only by ${cosmetic.join(", ")}`, strict ? "error" : "warn");
    if (row.license.version && row.license.version !== "1.0") P("version", `LICENSE claims version ${row.license.version}; 1.0 is the version in effect`);
  }
  for (const m of row.contradictions) P("manifest", `${m.file} declares ${JSON.stringify(m.decl)}; it must point at the LICENSE file`);
  if (row.readme.callsItOpenSource) P("wording", "README calls the Space Child License \"open source\"; say source-available, peace-conditional", "warn");
  if (requireNotice && !(row.notice && row.notice.isSCL)) P("notice", "no NOTICE file naming the license and the copyright holder", strict ? "error" : "warn");
  return { ok: !problems.some((p) => p.severity === "error"), problems, row };
}

// ---------------------------------------------------------------- applying

const HEADER_STYLES = {
  ".js": "//", ".mjs": "//", ".cjs": "//", ".ts": "//", ".tsx": "//", ".jsx": "//", ".rs": "//", ".go": "//", ".java": "//", ".kt": "//", ".swift": "//", ".c": "//", ".h": "//", ".cpp": "//", ".hpp": "//", ".cs": "//",
  ".py": "#", ".sh": "#", ".rb": "#", ".toml": "#", ".yml": "#", ".yaml": "#",
};
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "target", "vendor", ".git", ".next", "out", "coverage", "__pycache__", ".venv", "venv"]);

function firstCommitYear(dir) {
  try {
    const out = execFileSync("git", ["log", "--reverse", "--format=%ad", "--date=format:%Y"], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const y = out.trim().split("\n")[0];
    return /^\d{4}$/.test(y) ? y : null;
  } catch { return null; }
}

function* sourceFiles(dir, root = dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) yield* sourceFiles(p, root);
    else if (HEADER_STYLES[extname(name)]) yield p;
  }
}

/**
 * Put a repository under the license, or bring one that already carries it up to canonical form.
 * Returns the actions taken (or planned, with dryRun). Refuses forks and copyleft-licensed
 * repositories: those are decisions, not fixes.
 */
export function apply(dir, opts = {}) {
  const { holder = "Nick Flach", year = null, version = "1.0", upgradeStub = true, headers = false, fork = false, dryRun = false, now = new Date() } = opts;
  const c = canonical(version);
  const row = audit(dir);
  const actions = [];
  const act = (kind, file, detail) => actions.push({ kind, file, detail });
  if (fork) return { blocked: "fork: a fork keeps its upstream license", actions, row };
  const prior = row.license;
  if (prior && ["GPL", "AGPL", "LGPL", "MPL"].includes(prior.kind)) {
    return { blocked: `${prior.kind}: relicensing copyleft code needs a decision and every contributor's consent`, actions, row };
  }
  const thisYear = String(now.getUTCFullYear());
  const fromYear = year || firstCommitYear(dir) || thisYear;
  const years = fromYear === thisYear ? thisYear : `${fromYear}-${thisYear}`;

  // 1. LICENSE
  const licensePath = join(dir, prior ? prior.file : "LICENSE");
  if (!prior) { act("write", "LICENSE", "full canonical text"); if (!dryRun) writeFileSync(join(dir, "LICENSE"), c.text); }
  else if (prior.kind !== "SCL") {
    // keep the previous permissive grant on record: it cannot be revoked for what was already received
    const keep = `LICENSE-${prior.kind.replace(/[^A-Za-z0-9.-]/g, "")}-prior`;
    act("rename", `${prior.file} -> ${keep}`, "previous permissive license kept for the versions it covered");
    if (!dryRun) writeFileSync(join(dir, keep), readFileSync(licensePath, "utf8"));
    act("write", "LICENSE", "full canonical text");
    if (!dryRun) writeFileSync(join(dir, "LICENSE"), c.text);
    if (prior.file !== "LICENSE") { act("delete", prior.file, "replaced by LICENSE"); if (!dryRun) writeFileSync(licensePath, c.text); }
    const note = relicensingNote({ prior: prior.kind, date: now.toISOString().slice(0, 10), url: c.url });
    act("write", "RELICENSING.md", `dated note: ${prior.kind} grant persists for prior versions`);
    if (!dryRun) writeFileSync(join(dir, "RELICENSING.md"), note);
  } else if (prior.form === "reference" && upgradeStub) {
    act("write", prior.file, "upgrade notice-only stub to the full canonical text (the stub becomes NOTICE)");
    if (!dryRun) writeFileSync(licensePath, c.text);
  } else if (prior.form === "full" && prior.drift.length && !prior.drift.includes("content-differs")) {
    act("write", prior.file, `normalise ${prior.drift.join(", ")}`);
    if (!dryRun) writeFileSync(licensePath, c.text);
  } else if (prior.form === "full" && prior.drift.includes("content-differs")) {
    return { blocked: "LICENSE text differs from canonical in substance; inspect before overwriting", actions, row };
  }

  // 2. NOTICE
  const noticePath = join(dir, "NOTICE");
  if (!(row.notice && row.notice.isSCL)) {
    const text = c.notice.replace("[YEAR]", years).replace("[COPYRIGHT HOLDER]", holder);
    act("write", "NOTICE", `Copyright (c) ${years} ${holder}`);
    if (!dryRun) writeFileSync(noticePath, text);
  }

  // 3. manifests
  for (const f of fixManifests(dir, audit(dir), { dryRun })) act("edit", f, "license declaration points at the LICENSE file");

  // 4. README license section
  const rp = readmePath(dir);
  if (rp && !readmeClaims(dir).hasLicenseSection) {
    const section = `\n## License\n\n[Space Child License v${version}](${c.url}) — source-available and peace-conditional: free for peaceful, humanitarian, commercial and defensive use; withheld for the uses in its Peace Clause. See \`LICENSE\` and \`NOTICE\`.\n`;
    act("append", basename(rp), "License section");
    if (!dryRun) writeFileSync(rp, readFileSync(rp, "utf8").replace(/\n*$/, "\n") + section);
  }

  // 5. SPDX headers (opt-in)
  if (headers) {
    let n = 0;
    for (const f of sourceFiles(dir)) {
      const raw = readFileSync(f, "utf8");
      if (/SPDX-License-Identifier:/.test(raw.slice(0, 600))) continue;
      const style = HEADER_STYLES[extname(f)];
      const line = `${style} SPDX-License-Identifier: ${c.spdx}\n`;
      const shebang = raw.startsWith("#!") ? raw.indexOf("\n") + 1 : 0;
      if (!dryRun) writeFileSync(f, raw.slice(0, shebang) + line + raw.slice(shebang));
      n++;
    }
    if (n) act("headers", `${n} source files`, `${c.spdx}`);
  }
  return { blocked: null, actions, row };
}

export function relicensingNote({ prior, date, url }) {
  return `# Relicensing note

On ${date} this repository adopted the [Space Child License v1.0](${url}) for all new contributions.

Before that date it was offered under the ${prior} license, which is kept in this repository as
\`LICENSE-${prior}-prior\`. That earlier grant cannot be revoked: any copy of the code obtained under
it remains available under it. Versions released from this date onward, and every contribution made
after it, are under the Space Child License, which withholds permission for the uses in its Peace
Clause. If you rely on the earlier permissive terms, use a version released before ${date}.
`;
}

// ---------------------------------------------------------------- planning a rollout

/**
 * Given audit rows and GitHub metadata ({repo: {fork, archived, private, pushed_at}}), say what each
 * repository needs. The output is a table for a human to decide from, not an instruction to run.
 */
export function plan(rows, meta = {}) {
  return rows.map((r) => {
    const m = meta[r.repo] || {};
    const lic = r.license;
    let action, why;
    if (m.fork) { action = "skip-fork"; why = "forks keep their upstream license"; }
    else if (m.archived) { action = "skip-archived"; why = "archived"; }
    else if (!lic) { action = "apply"; why = "no LICENSE file"; }
    else if (lic.kind === "SCL") {
      const parts = [];
      if (lic.form === "reference") parts.push("upgrade stub to full text");
      if (r.contradictions.length) parts.push(`fix ${r.contradictions.map((c) => c.file).join(", ")}`);
      if (lic.drift.filter((d) => d !== "content-differs").length && lic.form === "full") parts.push("normalise");
      if (lic.drift.includes("content-differs")) parts.push("INSPECT: text differs");
      if (!(r.notice && r.notice.isSCL)) parts.push("add NOTICE");
      if (r.readme.callsItOpenSource) parts.push("README wording");
      action = parts.length ? "bring-to-canonical" : "ok"; why = parts.join("; ") || "canonical";
    }
    else if (["MIT", "ISC", "BSD", "Apache-2.0"].includes(lic.kind)) { action = "decide-relicense"; why = `${lic.kind} today; SCL going forward with a relicensing note, if this is original work`; }
    else if (["GPL", "AGPL", "LGPL", "MPL"].includes(lic.kind)) { action = "skip-copyleft"; why = `${lic.kind}: needs every contributor's consent`; }
    else { action = "inspect"; why = `LICENSE is ${lic.kind}`; }
    return { repo: r.repo, action, why, private: m.private ?? null, pushed_at: m.pushed_at ?? null };
  });
}

export { relative };
