import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, computeDeadlines, deadlineView, federalHolidays, isBusinessDay, loadRules, missingTriggers, rollForward, daysBetween, DISCLAIMER } from "../deadline-engine/engine.js";
import { REPO_ROOT } from "../case-manager/load.js";
import type { CaseFile } from "../case-manager/types.js";

const rules = loadRules(REPO_ROOT);

// Invented matters; the dates are chosen for the arithmetic, not taken from anywhere.
const base = (over: Partial<CaseFile> = {}): CaseFile => ({
  id: "SC-099", slug: "SC-099-t", title: "t", matter_type: "debt_collection", status: "active", priority: "high", opened: "2026-01-01",
  jurisdiction: { country: "US", state: "IA", forum: "small_claims" }, client: { name: "c", role: "defendant" },
  representation: { status: "pro_se" }, posture: "served_answer_due", ...over,
});

test("every rule in the table is unverified and names an authority", () => {
  assert.ok(rules.length >= 8);
  for (const r of rules) {
    assert.equal(r.verified, false, `${r.id} must stay unverified until a lawyer confirms it`);
    assert.ok(r.authority.length > 5, `${r.id} needs an authority`);
    assert.ok(r.days > 0 && Number.isInteger(r.days));
  }
});

test("calendar arithmetic: add, weekend and holiday rolling, federal holidays as observed", () => {
  assert.equal(addDays("2026-02-27", 2), "2026-03-01");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29", "leap day");
  const h = federalHolidays(2026);
  assert.ok(h.has("2026-01-01") && h.has("2026-01-19") && h.has("2026-05-25") && h.has("2026-07-03"), `July 4 2026 is a Saturday, observed Friday: ${[...h].join(",")}`);
  assert.ok(h.has("2026-11-26") && h.has("2026-12-25"));
  assert.equal(isBusinessDay("2026-09-12"), false, "Saturday");
  assert.equal(rollForward("2026-09-12"), "2026-09-14", "Saturday -> Monday");
  assert.equal(rollForward("2026-07-03"), "2026-07-06", "observed holiday Friday -> Monday");
  assert.equal(rollForward("2026-09-09"), "2026-09-09", "a Wednesday stays");
  assert.equal(daysBetween("2026-09-09", "2026-09-29"), 20);
});

test("Iowa small claims: served on a date, appearance due 20 days later, rolled off a weekend", () => {
  const c = base({ triggers: { service_date: "2026-08-23" } });
  const out = computeDeadlines(c, rules);
  const appear = out.find((d) => d.rule === "IA-SMALL-CLAIMS-APPEAR-20");
  assert.ok(appear, JSON.stringify(out));
  assert.equal(appear!.due, "2026-09-14");
  assert.equal(appear!.rolled_from, "2026-09-12");
  assert.equal(appear!.verified, false);
  assert.equal(appear!.disclaimer, DISCLAIMER);
  assert.ok(!out.some((d) => d.rule === "IA-CIVIL-ANSWER-20"), "the district-court rule does not apply to a small-claims forum");
});

test("rules are skipped, not guessed, when their trigger is absent — and the missing trigger is named", () => {
  const c = base({ matter_type: "criminal_owi", jurisdiction: { country: "US", state: "IA", forum: "state_court" }, triggers: { incident_date: "2025-11-28", charge_date: "2026-01-13" } });
  assert.deepEqual(computeDeadlines(c, rules), []);
  assert.deepEqual(missingTriggers(c, rules).map((m) => m.trigger), ["revocation_notice_date"]);
});

test("employment in Iowa: ICRC 300 days and the federal deferral-state 300 days, both from the adverse action", () => {
  const c = base({ matter_type: "employment", jurisdiction: { country: "US", state: "IA", forum: "none" }, triggers: { adverse_action_date: "2026-03-02" } });
  const out = computeDeadlines(c, rules);
  assert.deepEqual(out.map((d) => d.rule).sort(), ["IA-ICRC-COMPLAINT-300", "US-EEOC-CHARGE-300"]);
  for (const d of out) assert.equal(d.due, rollForward(addDays("2026-03-02", 300)));
  const w = base({ matter_type: "employment", jurisdiction: { country: "US", state: "WI", forum: "none" }, triggers: { adverse_action_date: "2026-03-02" } });
  assert.deepEqual(computeDeadlines(w, rules).map((d) => d.rule).sort(), ["US-EEOC-CHARGE-300", "WI-ERD-COMPLAINT-300"]);
});

test("a recorded court deadline outranks a computed one for the same rule, and days_left is from today", () => {
  const c = base({
    triggers: { service_date: "2026-08-23" },
    deadlines: [{ id: "d1", label: "Appearance due (per original notice)", due: "2026-09-10", source: "court", rule: "IA-SMALL-CLAIMS-APPEAR-20", status: "open" }],
  });
  const view = deadlineView(c, rules, "2026-09-01");
  assert.equal(view.length, 1, "the computed twin is suppressed");
  assert.equal(view[0]!.source, "court");
  assert.equal(view[0]!.verified, true);
  assert.equal(view[0]!.days_left, 9);
  const v2 = deadlineView(base({ triggers: { service_date: "2026-08-23" } }), rules, "2026-09-01");
  assert.equal(v2[0]!.source, "computed");
  assert.equal(v2[0]!.verified, false);
  assert.equal(v2[0]!.authority, "Iowa Code § 631.4(1)");
});
