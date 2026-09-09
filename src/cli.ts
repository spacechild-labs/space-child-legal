#!/usr/bin/env node
/**
 * sclegal — the command line for Space Child Legal.
 *
 *   sclegal cases                      every case: id, title, posture, representation, next deadline
 *   sclegal validate                   check every case.json against the schema and the file-clerk rules
 *   sclegal deadlines [SC-003]         recorded + computed deadlines, with source, authority, verified flag
 *   sclegal timeline SC-003            the case timeline as markdown
 *   sclegal classify <file>            what kind of document is this, and how sure are we
 *   sclegal ingest SC-003 <file> --source <where>   hash + classify a file and print the document record to add
 *   sclegal check "<text>"             run text through the safety rails (prints tier, reasons, gated text)
 *   sclegal dashboard [--out path]     write build/dashboard.html
 *
 * Options: --today YYYY-MM-DD (for tests and for "what did this look like on the day").
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { loadAllCases, loadCase, REPO_ROOT, todayIso } from "./case-manager/load.js";
import { computeDeadlines, deadlineView, loadRules, missingTriggers } from "./deadline-engine/engine.js";
import { buildTimeline, renderTimelineMarkdown } from "./timeline/build.js";
import { classifyDocument, LOW_CONFIDENCE } from "./document-pipeline/classify.js";
import { ingest } from "./document-pipeline/provenance.js";
import { PlainTextOcr } from "./document-pipeline/ocr.js";
import { gate } from "./safety-rails/gate.js";
import { renderDashboard, type DashboardCase } from "./dashboard/render.js";

const args = process.argv.slice(2);
const cmd = args[0] ?? "help";
const opt = (k: string): string | undefined => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.slice(1).filter((a, i, all) => !a.startsWith("--") && !(i > 0 && all[i - 1]?.startsWith("--")));
const today = opt("--today") ?? todayIso();
const AUDIT = join(REPO_ROOT, ".local", "audit", "ai-output.jsonl");

function findCase(id: string) {
  const all = loadAllCases(undefined, today);
  const hit = all.find((c) => c.file.id === id || c.file.slug === id || basename(c.dir) === id);
  if (!hit) { console.error(`no case ${id} (have: ${all.map((c) => c.file.id).join(", ")})`); process.exit(2); }
  return hit;
}

function main(): number {
  const rules = loadRules(REPO_ROOT);
  switch (cmd) {
    case "cases": {
      const all = loadAllCases(undefined, today);
      for (const c of all) {
        const f = c.file;
        const next = deadlineView(f, rules, today).filter((d) => d.status === "open")[0];
        const rep = f.representation.status === "retained" ? `counsel: ${f.representation.attorney}` : `NO COUNSEL (${f.representation.status})`;
        console.log(`${f.id}  ${f.status.padEnd(10)} ${f.priority.padEnd(8)} ${f.posture.padEnd(18)} ${rep.padEnd(40)} next: ${next ? `${next.due} ${next.label}${next.verified ? "" : " [unverified]"}` : "—"}${c.violations.length ? `  (${c.violations.length} schema problem(s))` : ""}`);
        console.log(`        ${f.title}`);
      }
      return 0;
    }
    case "validate": {
      let bad = 0;
      for (const c of loadAllCases(undefined, today)) {
        if (!c.violations.length) { console.log(`ok    ${c.file.id ?? c.dir}`); continue; }
        bad++;
        console.log(`FAIL  ${c.file.id ?? c.dir}`);
        for (const v of c.violations) console.log(`        ${v.path}: ${v.message}`);
      }
      return bad ? 1 : 0;
    }
    case "deadlines": {
      const set = positional[0] ? [findCase(positional[0])] : loadAllCases(undefined, today);
      for (const c of set) {
        console.log(`\n${c.file.id} — ${c.file.title}`);
        const view = deadlineView(c.file, rules, today);
        if (!view.length) console.log("  no deadlines recorded and no trigger dates to compute from");
        for (const d of view) {
          const left = d.days_left === 0 ? "today" : d.days_left < 0 ? `${-d.days_left}d ago` : `in ${d.days_left}d`;
          console.log(`  ${d.due}  ${left.padEnd(9)} ${d.status.padEnd(8)} ${d.label}  [${d.source}${d.verified ? "" : ", UNVERIFIED"}]${d.authority ? `  ${d.authority}` : ""}`);
        }
        const miss = missingTriggers(c.file, rules);
        for (const m of miss) console.log(`  ?           needs triggers.${m.trigger} to compute: ${m.label} (${m.rule})`);
      }
      console.log(`\n${computeDeadlines.length ? "" : ""}Computed dates are reminders to check, not filing deadlines. Confirm with the court or a licensed attorney.`);
      return 0;
    }
    case "timeline": {
      if (!positional[0]) { console.error("timeline <case-id>"); return 2; }
      const c = findCase(positional[0]);
      process.stdout.write(renderTimelineMarkdown(c.file, buildTimeline(c.file, today)));
      return 0;
    }
    case "classify": {
      const p = positional[0];
      if (!p) { console.error("classify <file>"); return 2; }
      const text = existsSync(p) && /\.(txt|md|eml|html?|json|csv)$/i.test(p) ? readFileSync(p, "utf8") : "";
      const r = classifyDocument({ filename: basename(p), text });
      console.log(`${r.type}  confidence ${r.confidence}${r.confidence < LOW_CONFIDENCE ? "  (LOW — confirm by hand)" : ""}`);
      for (const cue of r.cues) console.log(`  cue: ${cue}`);
      if (r.alternatives.length) console.log(`  also possible: ${r.alternatives.map((a) => `${a.type}(${a.score})`).join(", ")}`);
      return 0;
    }
    case "ingest": {
      const [id, file] = positional;
      const source = opt("--source") ?? "hand";
      if (!id || !file) { console.error("ingest <case-id> <file> --source <where>"); return 2; }
      const c = findCase(id);
      const abs = resolve(file);
      const rel = abs.startsWith(resolve(c.dir)) ? abs.slice(resolve(c.dir).length + 1).replace(/\\/g, "/") : basename(abs);
      const n = (c.file.documents?.length ?? 0) + 1;
      const isText = /\.(txt|md|eml|html?|json|csv)$/i.test(abs);
      return ingest({ id: `doc-${String(n).padStart(3, "0")}`, relPath: rel, absPath: abs, source, ...(isText ? { ocr: PlainTextOcr } : {}) }).then((r) => {
        console.log(JSON.stringify(r.document, null, 2));
        for (const w of r.warnings) console.log(`warning: ${w}`);
        console.log(`\nAdd the object above to documents[] in ${join(c.dir, "case.json")}. The file itself stays where it is (evidence dirs are gitignored).`);
        return 0;
      }) as unknown as number;
    }
    case "check": {
      const text = positional.join(" ");
      if (!text) { console.error('check "<text>"'); return 2; }
      const r = gate(text, { feature: "cli.check", auditPath: AUDIT });
      console.log(`${r.tier}${r.classification.reasons.length ? `  (${r.classification.reasons.join(", ")})` : ""}  audit=${r.audit_id}`);
      console.log("---");
      console.log(r.text);
      return r.allowed ? 0 : 3;
    }
    case "dashboard": {
      const out = opt("--out") ?? join(REPO_ROOT, "build", "dashboard.html");
      const cases: DashboardCase[] = loadAllCases(undefined, today).map((c) => ({
        file: c.file,
        deadlines: c.violations.length && !c.file.id ? [] : deadlineView(c.file, rules, today),
        missing: c.file.id ? missingTriggers(c.file, rules) : [],
        timeline: c.file.id ? buildTimeline(c.file, today) : { entries: [], undated_documents: [] },
        violations: c.violations,
      }));
      mkdirSync(join(out, ".."), { recursive: true });
      writeFileSync(out, renderDashboard(cases, today), "utf8");
      console.log(`wrote ${out} (${cases.length} cases)`);
      return 0;
    }
    default:
      console.log(readFileSync(new URL(import.meta.url)).toString().split("\n").slice(1, 14).map((l) => l.replace(/^ \*\s?/, "")).join("\n"));
      return cmd === "help" ? 0 : 2;
  }
}

const rc = main();
if (typeof rc === "number") process.exitCode = rc;
else (rc as Promise<number>).then((n) => { process.exitCode = n; });
