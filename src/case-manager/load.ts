import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CaseFile } from "./types.js";
import { validate, validateCaseRules, type Violation } from "./validate.js";

const HERE = dirname(fileURLToPath(import.meta.url));
/** Repository root: dist/case-manager/load.js -> ../../ */
export const REPO_ROOT = join(HERE, "..", "..");

let schemaCache: Record<string, unknown> | null = null;
export function caseSchema(): Record<string, unknown> {
  if (!schemaCache) {
    schemaCache = JSON.parse(readFileSync(join(REPO_ROOT, "schema", "case.schema.json"), "utf8")) as Record<string, unknown>;
  }
  return schemaCache;
}

export interface LoadedCase {
  dir: string;
  file: CaseFile;
  violations: Violation[];
}

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Parse and validate one case.json. Never throws on a bad file: the violations come back named. */
export function loadCase(caseDir: string, today = todayIso()): LoadedCase {
  const p = join(caseDir, "case.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    return { dir: caseDir, file: {} as CaseFile, violations: [{ path: "$", message: `unreadable case.json: ${(e as Error).message}` }] };
  }
  const violations = validate(parsed, caseSchema() as never);
  if (violations.length === 0) violations.push(...validateCaseRules(parsed as Record<string, unknown>, today));
  return { dir: caseDir, file: parsed as CaseFile, violations };
}

/** Every cases/<slug>/ directory that has a case.json, in id order. */
export function loadAllCases(root = join(REPO_ROOT, "cases"), today = todayIso()): LoadedCase[] {
  if (!existsSync(root)) return [];
  const out: LoadedCase[] = [];
  for (const name of readdirSync(root).sort()) {
    const dir = join(root, name);
    if (statSync(dir).isDirectory() && existsSync(join(dir, "case.json"))) out.push(loadCase(dir, today));
  }
  return out;
}
