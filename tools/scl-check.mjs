#!/usr/bin/env node
// scl-check.mjs — the CI gate. Exit 0 when a repository declares the Space Child License
// consistently; exit 1 with a list when it does not.
//
//   node tools/scl-check.mjs [<path>]        default: the current directory
//   node tools/scl-check.mjs --strict        reference-only LICENSE and cosmetic drift fail too
//   node tools/scl-check.mjs --require-notice
//   node tools/scl-check.mjs --json
//
// Codes: no-license, other-license, reference-only, text-differs, drift, version, manifest,
// wording, notice. See .github/workflows/scl-check.yml for the reusable workflow.
import { resolve } from "node:path";
import { check } from "./lib/scl.mjs";

const args = process.argv.slice(2);
const has = (k) => args.includes(k);
const target = resolve(args.find((a) => !a.startsWith("--")) || ".");
const res = check(target, { strict: has("--strict"), requireNotice: has("--require-notice") });

if (has("--json")) {
  console.log(JSON.stringify({ ok: res.ok, problems: res.problems, license: res.row.license, manifests: res.row.manifests }, null, 1));
} else {
  const lic = res.row.license;
  console.log(`scl-check ${target}`);
  console.log(`  LICENSE: ${lic ? `${lic.file} · ${lic.kind}${lic.kind === "SCL" ? ` v${lic.version || "?"} · ${lic.form}${lic.drift.length ? ` · drift: ${lic.drift.join(", ")}` : ""}` : ""}` : "none"}`);
  for (const m of res.row.manifests) console.log(`  ${m.file}: ${m.decl === null ? "(no license field)" : m.decl}`);
  for (const p of res.problems) console.log(`  ${p.severity === "error" ? "FAIL" : "warn"}  ${p.code.padEnd(15)} ${p.message}`);
  console.log(res.ok ? "  ok" : "  FAILED");
}
process.exit(res.ok ? 0 : 1);
