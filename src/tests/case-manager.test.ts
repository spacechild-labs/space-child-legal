import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validate, validateCaseRules, isIsoDate } from "../case-manager/validate.js";
import { caseSchema, loadAllCases, loadCase } from "../case-manager/load.js";

const minimal = () => ({
  id: "SC-099", slug: "SC-099-test", title: "Test matter", matter_type: "consumer", status: "active",
  priority: "high", opened: "2026-03-01",
  jurisdiction: { country: "US", state: "IA", forum: "small_claims" },
  client: { name: "Example Client", role: "defendant" },
  representation: { status: "pro_se" }, posture: "answered",
});

test("a minimal case validates and every required field is enforced", () => {
  assert.deepEqual(validate(minimal(), caseSchema() as never), []);
  for (const key of ["id", "slug", "title", "matter_type", "status", "priority", "opened", "jurisdiction", "client", "representation", "posture"]) {
    const c = minimal() as Record<string, unknown>; delete c[key];
    const v = validate(c, caseSchema() as never);
    assert.ok(v.some((x) => x.path === `$.${key}` && x.message === "required"), `${key} should be required: ${JSON.stringify(v)}`);
  }
});

test("enums, dates and unknown fields are caught with a path", () => {
  const c = { ...minimal(), matter_type: "vibes", opened: "2026-02-30", surprise: 1, events: [{ date: "yesterday", label: "x", kind: "filing" }] };
  const v = validate(c, caseSchema() as never);
  const paths = v.map((x) => x.path);
  assert.ok(paths.includes("$.matter_type"));
  assert.ok(paths.includes("$.opened"), "2026-02-30 is not a date");
  assert.ok(paths.includes("$.surprise"), "additionalProperties:false");
  assert.ok(paths.includes("$.events[0].date"));
  assert.equal(isIsoDate("2026-02-28"), true);
  assert.equal(isIsoDate("2026-13-01"), false);
});

test("file-clerk rules: future events, pre-opening open deadlines, retained-by-nobody, closed-without-date", () => {
  const c = {
    ...minimal(), status: "closed",
    events: [{ date: "2099-01-01", label: "already happened?", kind: "filing" }],
    deadlines: [{ id: "d1", label: "answer", due: "2026-01-01", source: "computed", status: "open" }],
    representation: { status: "retained" },
  } as Record<string, unknown>;
  const v = validateCaseRules(c, "2026-09-09");
  const paths = v.map((x) => x.path);
  assert.ok(paths.includes("$.closed"));
  assert.ok(paths.includes("$.events[0].date"));
  assert.ok(paths.includes("$.deadlines[0].due"));
  assert.ok(paths.includes("$.representation.attorney"));
  // a future hearing is fine — that is what kind:hearing is for
  const ok = validateCaseRules({ ...minimal(), events: [{ date: "2099-01-01", label: "hearing", kind: "hearing" }] }, "2026-09-09");
  assert.deepEqual(ok, []);
});

test("loadAllCases reads every cases/<slug>/case.json and never throws on a broken one", () => {
  const root = mkdtempSync(join(tmpdir(), "scl-"));
  try {
    mkdirSync(join(root, "SC-001-a")); writeFileSync(join(root, "SC-001-a", "case.json"), JSON.stringify({ ...minimal(), id: "SC-001", slug: "SC-001-a" }));
    mkdirSync(join(root, "SC-002-b")); writeFileSync(join(root, "SC-002-b", "case.json"), "{ not json");
    mkdirSync(join(root, "no-case-here"));
    const all = loadAllCases(root, "2026-09-09");
    assert.equal(all.length, 2);
    assert.deepEqual(all[0]!.violations, []);
    assert.match(all[1]!.violations[0]!.message, /unreadable/);
    assert.equal(loadCase(join(root, "SC-001-a"), "2026-09-09").file.id, "SC-001");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("every committed case file validates", () => {
  const all = loadAllCases(undefined, "2026-09-09");
  assert.ok(all.length >= 1, "at least the licensing matter is committed");
  for (const c of all) assert.deepEqual(c.violations, [], `${c.dir}: ${JSON.stringify(c.violations)}`);
});
