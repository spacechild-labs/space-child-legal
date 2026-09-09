/**
 * The case dashboard (PRD §7 Phase 1 "basic web UI for case dashboard"). One static HTML file:
 * every active case, its posture, whether the client has a lawyer, the next deadlines with their
 * source and whether they are verified, and each case's timeline. No script, no network, no
 * framework — it is generated from case.json files and can be opened from disk. It contains
 * case data, so it is written to build/ (gitignored), never committed.
 *
 * The "find a lawyer" imperative (PRD §6.2) is not a footnote: a case without retained counsel
 * shows it at the top of its card.
 */
import type { CaseFile } from "../case-manager/types.js";
import type { DeadlineView } from "../deadline-engine/engine.js";
import type { Timeline } from "../timeline/build.js";
import { MANDATORY_DISCLAIMER } from "../safety-rails/gate.js";

export interface DashboardCase {
  file: CaseFile;
  deadlines: DeadlineView[];
  missing: Array<{ rule: string; trigger: string; label: string }>;
  timeline: Timeline;
  violations: Array<{ path: string; message: string }>;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));

function daysLabel(n: number): string {
  if (n === 0) return "today";
  if (n < 0) return `${-n} day${n === -1 ? "" : "s"} ago`;
  return `in ${n} day${n === 1 ? "" : "s"}`;
}

function urgency(d: DeadlineView): string {
  if (d.status !== "open") return "done";
  if (d.days_left < 0) return "overdue";
  if (d.days_left <= 7) return "soon";
  if (d.days_left <= 30) return "near";
  return "later";
}

export function renderDashboard(cases: DashboardCase[], today: string): string {
  const active = cases.filter((c) => c.file.status !== "closed");
  const allDeadlines = active.flatMap((c) => c.deadlines.filter((d) => d.status === "open").map((d) => ({ c: c.file, d })))
    .sort((a, b) => a.d.due.localeCompare(b.d.due)).slice(0, 8);
  const needLawyer = active.filter((c) => c.file.representation.status !== "retained" && c.file.representation.status !== "not_needed");

  const cards = active.map((c) => {
    const f = c.file;
    const rep = f.representation;
    const lawyerBlock = rep.status === "retained"
      ? `<p class="rep ok">Represented: ${esc(rep.attorney)}${rep.firm ? `, ${esc(rep.firm)}` : ""}${rep.since ? ` (since ${esc(rep.since)})` : ""}</p>`
      : rep.status === "not_needed" ? ""
      : `<p class="rep need"><strong>You do not have a lawyer on this matter yet.</strong> Organizing the file buys time; a licensed attorney is the next step.${f.attorney_finder?.sources?.length ? ` Start with: ${f.attorney_finder.sources.map(esc).join("; ")}.` : ""}</p>`;
    const dl = c.deadlines.length
      ? `<table><thead><tr><th>Due</th><th></th><th>What</th><th>Source</th></tr></thead><tbody>${c.deadlines.map((d) => `
        <tr class="${urgency(d)}"><td>${esc(d.due)}</td><td>${esc(daysLabel(d.days_left))}</td><td>${esc(d.label)}${d.notes ? `<div class="note">${esc(d.notes)}</div>` : ""}</td><td>${esc(d.source)}${d.verified ? "" : ' <span class="unverified" title="Computed from a rule table; confirm with the court or counsel">unverified</span>'}${d.authority ? `<div class="note">${esc(d.authority)}</div>` : ""}</td></tr>`).join("")}</tbody></table>`
      : `<p class="muted">No deadlines recorded.</p>`;
    const missing = c.missing.length
      ? `<p class="missing">Clocks that cannot run yet: ${c.missing.map((m) => `<code>${esc(m.trigger)}</code> for ${esc(m.label)}`).join("; ")}. Recording that date lets the engine compute the deadline.</p>`
      : "";
    const tl = c.timeline.entries.length
      ? `<details><summary>Timeline (${c.timeline.entries.length})</summary><table class="tl"><tbody>${c.timeline.entries.map((e) => `<tr class="${e.future ? "future" : ""}"><td>${esc(e.date)}</td><td>${esc(e.label)}</td><td class="muted">${esc(e.kind)}</td></tr>`).join("")}</tbody></table>${c.timeline.undated_documents.length ? `<p class="muted">Undated documents: ${c.timeline.undated_documents.map((d) => esc(d.path)).join(", ")}</p>` : ""}</details>`
      : "";
    const viol = c.violations.length ? `<p class="violations">case.json has ${c.violations.length} problem(s): ${c.violations.slice(0, 3).map((v) => `${esc(v.path)} ${esc(v.message)}`).join("; ")}</p>` : "";
    const j = f.jurisdiction;
    return `<section class="case ${esc(f.priority)}">
      <h2>${esc(f.id)} · ${esc(f.title)}</h2>
      <p class="meta">${esc(f.matter_type.replace(/_/g, " "))} · ${esc(f.posture.replace(/_/g, " "))} · ${esc(f.priority)} priority · ${esc(j.state)}${j.court ? ` · ${esc(j.court)}` : ""}${j.case_number ? ` · ${esc(j.case_number)}` : ""}</p>
      ${lawyerBlock}${viol}
      <h3>Deadlines</h3>${dl}${missing}
      ${tl}
    </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Space Child Legal — case dashboard</title>
<style>
  :root{--bg:#0b0d12;--panel:#12161f;--ink:#e8e8ef;--muted:#8b90a0;--line:#232838;--accent:#8ab4ff;--warn:#ffb347;--bad:#ff6b6b;--ok:#7bd88f}
  body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  header,main{max-width:1000px;margin:0 auto;padding:20px}
  header h1{margin:0 0 6px;font-size:22px} header p{margin:0;color:var(--muted)}
  .disclaimer{background:#1c1a12;border:1px solid #4a4020;color:#f1d99a;padding:10px 14px;border-radius:8px;margin:14px 0}
  .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:16px 0}
  .box{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
  .box h3{margin:0 0 8px;font-size:14px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
  .case{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;padding:14px 16px;margin:14px 0}
  .case.critical{border-left-color:var(--bad)} .case.high{border-left-color:var(--warn)}
  .case h2{margin:0;font-size:18px} .meta{color:var(--muted);margin:4px 0 10px}
  .rep{padding:8px 10px;border-radius:6px} .rep.ok{background:#0f1f15;color:var(--ok)} .rep.need{background:#2a1414;color:#ffd0d0;border:1px solid #5a2323}
  h3{font-size:14px;color:var(--muted);margin:14px 0 6px;text-transform:uppercase;letter-spacing:.04em}
  table{width:100%;border-collapse:collapse} td,th{padding:6px 8px;border-top:1px solid var(--line);vertical-align:top;text-align:left} th{color:var(--muted);font-weight:500}
  tr.overdue td:first-child{color:var(--bad);font-weight:600} tr.soon td:first-child{color:var(--warn);font-weight:600} tr.done{opacity:.55} tr.future td{color:var(--accent)}
  .unverified{font-size:11px;color:var(--warn);border:1px solid var(--warn);border-radius:4px;padding:0 4px}
  .note{color:var(--muted);font-size:12.5px} .muted{color:var(--muted)} .missing{color:var(--muted);font-size:13px} .violations{color:var(--bad);font-size:13px}
  details summary{cursor:pointer;color:var(--accent);margin-top:10px} .tl td{font-size:13.5px}
  footer{max-width:1000px;margin:20px auto;padding:0 20px 30px;color:var(--muted);font-size:12.5px}
</style></head><body>
<header>
  <h1>Space Child Legal — case dashboard</h1>
  <p>Generated ${esc(today)} · ${active.length} active matter${active.length === 1 ? "" : "s"} · a file clerk, not a lawyer</p>
  <div class="disclaimer">${esc(MANDATORY_DISCLAIMER)}</div>
  <div class="summary">
    <div class="box"><h3>Next deadlines</h3>${allDeadlines.length ? `<table><tbody>${allDeadlines.map(({ c, d }) => `<tr class="${urgency(d)}"><td>${esc(d.due)}</td><td>${esc(daysLabel(d.days_left))}</td><td>${esc(c.id)} · ${esc(d.label)}${d.verified ? "" : ' <span class="unverified">unverified</span>'}</td></tr>`).join("")}</tbody></table>` : '<p class="muted">None recorded.</p>'}</div>
    <div class="box"><h3>Representation</h3>${needLawyer.length ? `<p><strong>${needLawyer.length}</strong> matter${needLawyer.length === 1 ? "" : "s"} without a retained attorney: ${needLawyer.map((c) => esc(c.file.id)).join(", ")}. The platform's job is to get that number to zero.</p>` : '<p class="muted">Every active matter has counsel.</p>'}</div>
  </div>
</header>
<main>${cards}</main>
<footer>Deadlines marked <em>unverified</em> come from <code>rules/deadlines.json</code>, a table of statutory clocks with citations that no attorney has yet confirmed for these matters. Court-set and counsel-set dates are shown as recorded. This page is generated by <code>sclegal dashboard</code> from the case files and contains case data; it lives in <code>build/</code> and is not committed.</footer>
</body></html>
`;
}
