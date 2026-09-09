import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { classify } from "../safety-rails/classify.js";
import { gate, MANDATORY_DISCLAIMER, BLOCKED_MESSAGE } from "../safety-rails/gate.js";

// The practicing-attorney test (PRD Appendix A): would a lawyer say this is practicing law?
// Every fixture below is invented; none describes a real matter.
const RED = [
  "You may have a statute of limitations defense — the last payment was more than five years ago.",
  "You have a strong defense here: they cannot prove they own the debt.",
  "I would argue that the consent was not knowing and voluntary.",
  "This is clearly retaliation for the complaint you filed.",
  "See Jacobsen v. Katzer, 535 F.3d 1373 (Fed. Cir. 2008).",
  "The state supreme court held in State v. Doe, 812 N.W.2d 100, that ...",
  "COMES NOW the Defendant and respectfully moves the Court to dismiss.",
  "I, Jane Example, being first duly sworn, depose and state as follows:",
  "You will win this one; the plaintiff never shows up with the assignment chain.",
  "The court will likely dismiss because they lack standing.",
  "Raise laches and unclean hands in your answer.",
];

const YELLOW = [
  "In Iowa small claims, the defendant must appear within 20 days of service (Iowa Code § 631.4).",
  "Your answer is due 2026-09-14 based on the service date you entered.",
  "The EEOC deadline in a deferral state is 300 days from the adverse action.",
  "A default judgment can be entered if no appearance is filed.",
];

const GREEN = [
  "This document appears to be correspondence from the court dated 2025-08-15.",
  "Timeline: 2025-11-28 incident; 2026-01-13 charged; 2026-02-05 initial appearance.",
  "Three documents were ingested; two are receipts and one is unclassified (confidence 0.4).",
  "Engagement letter signed 2026-03-01 with Example Law Office.",
];

test("legal analysis is red, every time", () => {
  for (const t of RED) {
    const c = classify(t);
    assert.equal(c.tier, "LEGAL_ANALYSIS", `should be blocked: "${t}" -> ${c.tier} ${c.reasons.join(",")}`);
    assert.ok(c.reasons.length && c.matches.length, "a block names its reason and quotes the match");
  }
});

test("procedural information is yellow and organizational output is green", () => {
  for (const t of YELLOW) assert.equal(classify(t).tier, "INFORMATIONAL", t);
  for (const t of GREEN) assert.equal(classify(t).tier, "ORGANIZATIONAL", `${t} -> ${JSON.stringify(classify(t))}`);
});

test("gate: green passes as-is, yellow carries the disclaimer, red is replaced, and every call is audited append-only", () => {
  const dir = mkdtempSync(join(tmpdir(), "scl-audit-"));
  const auditPath = join(dir, "ai.jsonl");
  try {
    const g = gate(GREEN[0]!, { feature: "t", auditPath, killSwitch: false });
    assert.equal(g.allowed, true); assert.equal(g.text, GREEN[0]);
    const y = gate(YELLOW[0]!, { feature: "t", auditPath, killSwitch: false });
    assert.equal(y.allowed, true); assert.ok(y.text.endsWith(MANDATORY_DISCLAIMER));
    const r = gate(RED[0]!, { feature: "t", case_id: "SC-999", auditPath, killSwitch: false });
    assert.equal(r.allowed, false); assert.equal(r.text, BLOCKED_MESSAGE);
    assert.ok(!r.text.includes("statute of limitations"), "the blocked text must not leak through the refusal");
    const lines = readFileSync(auditPath, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(lines.length, 3);
    assert.equal(lines[2].case_id, "SC-999");
    assert.equal(lines[2].allowed, false);
    assert.ok(lines[2].reasons.includes("identifies_defense"));
    assert.match(lines[2].input_sha256, /^[0-9a-f]{64}$/);
    assert.ok(!("input" in lines[2]), "the audit log records a hash of the input, not the input");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("kill switch: with SCLEGAL_AI_DISABLED every output is withheld and the audit says why", () => {
  const dir = mkdtempSync(join(tmpdir(), "scl-kill-"));
  try {
    const r = gate(GREEN[0]!, { feature: "t", auditPath: join(dir, "a.jsonl"), killSwitch: true });
    assert.equal(r.allowed, false);
    assert.deepEqual(r.classification.reasons, ["kill_switch"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
