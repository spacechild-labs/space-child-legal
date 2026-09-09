import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { canonical, normalize, maskNotice, readLicense, audit, check, apply, plan, fixManifests, manifest } from "../lib/scl.mjs";

const c = canonical("1.0");
const stub = (holder = "Nick Flach", year = "2026") => c.notice.replace("[YEAR]", year).replace("[COPYRIGHT HOLDER]", holder);

function repo(files) {
  const d = mkdtempSync(join(tmpdir(), "scl-"));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(d, name, ".."), { recursive: true });
    writeFileSync(join(d, name), content);
  }
  return d;
}

test("canonical artifacts: full text hashes to the manifest, the draft cannot be applied", () => {
  assert.equal(c.sha256, manifest().versions.find((v) => v.version === "1.0").full_text_sha256);
  assert.match(c.text, /^SPACE CHILD LICENSE\n=+\n/);
  assert.match(c.text, /9\. HOW TO APPLY THIS LICENSE/);
  assert.equal(c.url, "https://legal.spacechild.love/license");
  assert.throws(() => canonical("1.1"), /draft/);
});

test("readLicense: full text (with and without cosmetic drift), the deployed stub with any year/holder, and non-SCL", () => {
  const full = repo({ LICENSE: c.text });
  const drifted = repo({ LICENSE: "﻿" + c.text.replace(/\n/g, "\r\n") });
  const stubbed = repo({ LICENSE: stub("Someone Else", "2025") });
  const stubNoNl = repo({ LICENSE: "﻿" + stub().replace(/\n$/, "") });     // the 49-repo variant
  const mit = repo({ LICENSE: "MIT License\n\nPermission is hereby granted, free of charge..." });
  try {
    assert.deepEqual([readLicense(full).form, readLicense(full).canonical, readLicense(full).drift], ["full", true, []]);
    const d = readLicense(drifted); assert.equal(d.form, "full"); assert.equal(d.canonical, false); assert.deepEqual(d.drift.sort(), ["bom", "crlf"]);
    assert.equal(readLicense(stubbed).form, "reference");
    const s = readLicense(stubNoNl); assert.equal(s.form, "reference"); assert.ok(s.drift.includes("bom") && s.drift.includes("trailing-newline"));
    assert.equal(readLicense(mit).kind, "MIT"); assert.equal(readLicense(mit).form, null);
    assert.equal(readLicense(repo({})), null);
    assert.equal(maskNotice(stub("X", "2020")), maskNotice(c.notice), "year and holder are masked before comparing");
    assert.equal(normalize("a\r\nb  \n\n\n"), "a\nb\n");
  } finally { for (const x of [full, drifted, stubbed, stubNoNl, mit]) rmSync(x, { recursive: true, force: true }); }
});

test("check: the CI gate fails on the things that matter and warns on the rest", () => {
  const good = repo({ LICENSE: c.text, NOTICE: stub(), "package.json": '{\n  "name": "x",\n  "license": "SEE LICENSE IN LICENSE"\n}\n', "README.md": "# x\n\n## License\nSpace Child License.\n" });
  const contradict = repo({ LICENSE: stub(), "package.json": '{ "name": "x", "license": "MIT" }', "README.md": "A novel open-source license, the Space Child License.\n" });
  const none = repo({ "package.json": '{ "name": "x" }' });
  try {
    const g = check(good, { requireNotice: true }); assert.equal(g.ok, true, JSON.stringify(g.problems)); assert.deepEqual(g.problems, []);
    const b = check(contradict);
    assert.equal(b.ok, false);
    const codes = Object.fromEntries(b.problems.map((p) => [p.code, p.severity]));
    assert.equal(codes.manifest, "error");
    assert.equal(codes["reference-only"], "warn");
    assert.equal(codes.wording, "warn");
    assert.equal(check(contradict, { strict: true }).problems.find((p) => p.code === "reference-only").severity, "error");
    assert.equal(check(none).problems[0].code, "no-license");
  } finally { for (const x of [good, contradict, none]) rmSync(x, { recursive: true, force: true }); }
});

test("apply: a bare repo gets LICENSE, NOTICE, manifest line and README section; a second run is a no-op", () => {
  const d = repo({ "package.json": '{\n  "name": "x",\n  "version": "1.0.0",\n  "license": "MIT"\n}\n', "README.md": "# x\n\nHello.\n", "src/a.js": "console.log(1);\n", "src/b.py": "#!/usr/bin/env python\nprint(1)\n" });
  try {
    const dry = apply(d, { dryRun: true, year: "2024", now: new Date("2026-09-09T00:00:00Z") });
    assert.equal(dry.blocked, null);
    assert.ok(!existsSync(join(d, "LICENSE")), "dry run writes nothing");
    const r = apply(d, { year: "2024", headers: true, now: new Date("2026-09-09T00:00:00Z") });
    assert.deepEqual(r.actions.map((a) => a.kind + ":" + a.file), ["write:LICENSE", "write:NOTICE", "edit:package.json", "append:README.md", "headers:2 source files"]);
    assert.equal(readFileSync(join(d, "LICENSE"), "utf8"), c.text);
    assert.match(readFileSync(join(d, "NOTICE"), "utf8"), /Copyright \(c\) 2024-2026 Nick Flach/);
    const pkg = readFileSync(join(d, "package.json"), "utf8");
    assert.match(pkg, /"license": "SEE LICENSE IN LICENSE"/); assert.match(pkg, /"version": "1.0.0"/, "only the license line changed");
    assert.match(readFileSync(join(d, "README.md"), "utf8"), /## License\n\n\[Space Child License v1.0\]/);
    assert.match(readFileSync(join(d, "src/a.js"), "utf8"), /^\/\/ SPDX-License-Identifier: LicenseRef-SpaceChild-1.0\n/);
    assert.match(readFileSync(join(d, "src/b.py"), "utf8"), /^#!\/usr\/bin\/env python\n# SPDX-License-Identifier: LicenseRef-SpaceChild-1.0\n/, "header goes after the shebang");
    assert.equal(check(d, { requireNotice: true }).ok, true);
    assert.deepEqual(apply(d, { headers: true }).actions, [], "idempotent");
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("apply: a stub is upgraded to full text; a prior MIT license is kept beside a relicensing note; forks and copyleft are refused", () => {
  const stubbed = repo({ LICENSE: "﻿" + stub("Nick Flach", "2026").replace(/\n$/, "") });
  const mit = repo({ LICENSE: "MIT License\n\nPermission is hereby granted, free of charge, to any person...\n" });
  const gpl = repo({ LICENSE: "GNU GENERAL PUBLIC LICENSE\nVersion 3\n" });
  try {
    const s = apply(stubbed, { now: new Date("2026-09-09T00:00:00Z") });
    assert.ok(s.actions.some((a) => a.file === "LICENSE" && /upgrade/.test(a.detail)));
    assert.equal(readLicense(stubbed).form, "full"); assert.equal(readLicense(stubbed).canonical, true);
    assert.ok(existsSync(join(stubbed, "NOTICE")));
    const m = apply(mit, { now: new Date("2026-09-09T00:00:00Z") });
    assert.equal(m.blocked, null);
    assert.ok(existsSync(join(mit, "LICENSE-MIT-prior")));
    assert.match(readFileSync(join(mit, "RELICENSING.md"), "utf8"), /On 2026-09-09 this repository adopted/);
    assert.equal(readLicense(mit).kind, "SCL");
    assert.match(apply(gpl).blocked, /GPL/);
    assert.match(apply(stubbed, { fork: true }).blocked, /fork/);
  } finally { for (const x of [stubbed, mit, gpl]) rmSync(x, { recursive: true, force: true }); }
});

test("fixManifests rewrites only the license line in Cargo.toml and pyproject.toml too", () => {
  const d = repo({ LICENSE: c.text, "Cargo.toml": '[package]\nname = "x"\nlicense = "MIT"\nversion = "0.1.0"\n', "pyproject.toml": '[project]\nname = "x"\nlicense = "MIT"\n' });
  try {
    assert.deepEqual(fixManifests(d), ["Cargo.toml", "pyproject.toml"]);
    assert.match(readFileSync(join(d, "Cargo.toml"), "utf8"), /^license-file = "LICENSE"$/m);
    assert.match(readFileSync(join(d, "pyproject.toml"), "utf8"), /^license = \{ file = "LICENSE" \}$/m);
    assert.deepEqual(audit(d).contradictions, []);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("plan: forks and copyleft are skipped, stubs and contradictions are brought to canonical, bare repos are applied, permissive repos are a decision", () => {
  const rows = [
    audit(repo({ LICENSE: stub(), "package.json": '{"license":"MIT"}' }), "o/stub-contradict"),
    audit(repo({ LICENSE: c.text, NOTICE: stub() }), "o/canonical"),
    audit(repo({}), "o/bare"),
    audit(repo({ LICENSE: "MIT License\nPermission is hereby granted" }), "o/mit"),
    audit(repo({ LICENSE: "GNU GENERAL PUBLIC LICENSE" }), "o/gpl"),
    audit(repo({ LICENSE: c.text }), "o/fork"),
  ];
  const t = Object.fromEntries(plan(rows, { "o/fork": { fork: true } }).map((x) => [x.repo, x]));
  assert.equal(t["o/stub-contradict"].action, "bring-to-canonical"); assert.match(t["o/stub-contradict"].why, /upgrade stub.*fix package.json.*add NOTICE/);
  assert.equal(t["o/canonical"].action, "ok");
  assert.equal(t["o/bare"].action, "apply");
  assert.equal(t["o/mit"].action, "decide-relicense");
  assert.equal(t["o/gpl"].action, "skip-copyleft");
  assert.equal(t["o/fork"].action, "skip-fork");
  for (const r of rows) rmSync(r.dir, { recursive: true, force: true });
});
