import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, renderTimelineMarkdown } from "../timeline/build.js";
import { renderDashboard } from "../dashboard/render.js";
import { deadlineView, loadRules, missingTriggers } from "../deadline-engine/engine.js";
import { loadAllCases, REPO_ROOT } from "../case-manager/load.js";
import type { CaseFile } from "../case-manager/types.js";

// An invented matter; nothing here describes a real case.
const c: CaseFile = {
  id: "SC-999", slug: "SC-999-example", title: "Example matter", matter_type: "consumer", status: "active", priority: "high", opened: "2026-03-01",
  jurisdiction: { country: "US", state: "IA", forum: "state_court" }, client: { name: "Example Client", role: "defendant" },
  representation: { status: "seeking" }, posture: "discovery",
  triggers: { incident_date: "2025-11-28", service_date: "2026-08-23" },
  events: [
    { date: "2026-02-05", label: "Initial appearance", kind: "hearing", source: "example" },
    { date: "2025-11-28", label: "Dispute arose", kind: "incident", source: "example" },
    { date: "2026-10-01", label: "Pretrial conference", kind: "hearing", source: "counsel" },
  ],
  deadlines: [{ id: "d1", label: "Discovery responses", due: "2026-09-20", source: "counsel", status: "open" }],
  documents: [{ id: "doc-001", path: "engagement-letter.pdf", type: "agreement", date: "2026-03-01" }, { id: "doc-002", path: "photo.jpg", type: "evidence" }],
};

test("timeline merges events, triggers, deadlines and dated documents in order; undated documents are listed, not placed", () => {
  const t = buildTimeline(c, "2026-09-09");
  assert.deepEqual(t.entries.map((e) => e.date), ["2025-11-28", "2026-02-05", "2026-03-01", "2026-08-23", "2026-09-20", "2026-10-01"]);
  assert.equal(t.entries.filter((e) => e.date === "2025-11-28").length, 1, "an incident event on the incident date is not doubled by the trigger");
  assert.equal(t.entries.find((e) => e.date === "2026-08-23")!.kind, "trigger");
  assert.equal(t.entries.find((e) => e.date === "2026-10-01")!.future, true);
  assert.deepEqual(t.undated_documents.map((d) => d.id), ["doc-002"]);
  const md = renderTimelineMarkdown(c, t);
  assert.match(md, /\| 2026-10-01 \(upcoming\) \| Pretrial conference/);
  assert.match(md, /Undated documents/);
});

test("dashboard: valid HTML, no script, shows the find-a-lawyer block for unrepresented matters and marks computed deadlines unverified", () => {
  const rules = loadRules(REPO_ROOT);
  const owi: CaseFile = { ...c, matter_type: "criminal_owi", triggers: { incident_date: "2025-11-28" } };
  const html = renderDashboard([{ file: owi, deadlines: deadlineView(owi, rules, "2026-09-09"), missing: missingTriggers(owi, rules), timeline: buildTimeline(owi, "2026-09-09"), violations: [] }], "2026-09-09");
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(!/<script/i.test(html), "no script: the page is data, opened from disk");
  assert.match(html, /You do not have a lawyer on this matter yet/);
  assert.match(html, /Space Child Legal is a case management tool, not a lawyer/);
  assert.match(html, /revocation_notice_date/, "the missing trigger is named so someone records it");
  assert.match(html, /Discovery responses/);
  const computed = renderDashboard([{ file: c, deadlines: deadlineView(c, rules, "2026-09-09"), missing: [], timeline: buildTimeline(c, "2026-09-09"), violations: [] }], "2026-09-09");
  assert.match(computed, /unverified/, "a computed deadline is marked unverified");
  // a represented case does not get the imperative
  const rep = { ...c, representation: { status: "retained" as const, attorney: "A. Lawyer" } };
  const html2 = renderDashboard([{ file: rep, deadlines: [], missing: [], timeline: buildTimeline(rep, "2026-09-09"), violations: [] }], "2026-09-09");
  assert.ok(!/You do not have a lawyer/.test(html2));
  assert.match(html2, /Represented: A\. Lawyer/);
  // escaping: a title with markup does not become markup
  const evil = { ...c, title: "<img src=x onerror=alert(1)>" };
  const html3 = renderDashboard([{ file: evil, deadlines: [], missing: [], timeline: { entries: [], undated_documents: [] }, violations: [] }], "2026-09-09");
  assert.ok(!html3.includes("<img"), "escaped");
});

test("every committed case file renders on the dashboard", () => {
  const rules = loadRules(REPO_ROOT);
  const all = loadAllCases(undefined, "2026-09-09");
  const html = renderDashboard(all.map((l) => ({ file: l.file, deadlines: deadlineView(l.file, rules, "2026-09-09"), missing: missingTriggers(l.file, rules), timeline: buildTimeline(l.file, "2026-09-09"), violations: l.violations })), "2026-09-09");
  for (const l of all) assert.ok(html.includes(l.file.id), l.file.id);
});
