/**
 * A small JSON Schema validator — the subset case.schema.json uses, and nothing more:
 * type, required, properties, additionalProperties:false, enum, items, pattern, minLength,
 * format:date. No dependency, so the whole check can be read in one sitting; this repository
 * holds sensitive case files and every line that touches them should be auditable.
 */

export interface Violation {
  path: string;
  message: string;
}

type Schema = {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  enum?: unknown[];
  items?: Schema;
  pattern?: string;
  minLength?: number;
  format?: string;
  description?: string;
  [k: string]: unknown;
};

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** True when `s` is a real calendar date written YYYY-MM-DD (2026-02-30 is not). */
export function isIsoDate(s: string): boolean {
  if (!DATE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

export function validate(value: unknown, schema: Schema, path = "$"): Violation[] {
  const out: Violation[] = [];
  const t = schema.type;
  if (t !== undefined) {
    const allowed = Array.isArray(t) ? t : [t];
    const actual = typeOf(value);
    const ok = allowed.some((a) => a === actual || (a === "integer" && actual === "number" && Number.isInteger(value)));
    if (!ok) { out.push({ path, message: `expected ${allowed.join("|")}, got ${actual}` }); return out; }
  }
  if (schema.enum && !schema.enum.some((e) => e === value)) {
    out.push({ path, message: `must be one of ${schema.enum.map(String).join(", ")}; got ${JSON.stringify(value)}` });
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push({ path, message: `shorter than ${schema.minLength}` });
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) out.push({ path, message: `does not match ${schema.pattern}` });
    if (schema.format === "date" && !isIsoDate(value)) out.push({ path, message: `not a YYYY-MM-DD date: ${value}` });
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, i) => out.push(...validate(item, schema.items as Schema, `${path}[${i}]`)));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) out.push({ path: `${path}.${key}`, message: "required" });
    }
    const props = schema.properties ?? {};
    for (const [key, sub] of Object.entries(props)) {
      if (key in obj) out.push(...validate(obj[key], sub, `${path}.${key}`));
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in props)) out.push({ path: `${path}.${key}`, message: "not a known field" });
      }
    }
  }
  return out;
}

/**
 * Cross-field rules the schema cannot express. Each one is a fact a file clerk would notice:
 * a deadline before the case opened, an event in the future marked as having happened, a
 * closed case with no close date.
 */
export function validateCaseRules(c: Record<string, unknown>, today: string): Violation[] {
  const out: Violation[] = [];
  const opened = typeof c.opened === "string" ? c.opened : null;
  if (c.status === "closed" && typeof c.closed !== "string") out.push({ path: "$.closed", message: "a closed case needs a close date" });
  for (const [i, e] of ((c.events as Array<Record<string, unknown>>) ?? []).entries()) {
    if (typeof e.date === "string" && isIsoDate(e.date) && e.date > today && e.kind !== "deadline" && e.kind !== "hearing") {
      out.push({ path: `$.events[${i}].date`, message: `in the future (${e.date}) but recorded as having happened; use deadlines[] or kind:hearing` });
    }
  }
  for (const [i, d] of ((c.deadlines as Array<Record<string, unknown>>) ?? []).entries()) {
    if (opened && typeof d.due === "string" && d.due < opened && d.status === "open") {
      out.push({ path: `$.deadlines[${i}].due`, message: `open deadline ${d.due} is before the case opened (${opened}) — met, missed, or a typo?` });
    }
  }
  const rep = c.representation as Record<string, unknown> | undefined;
  if (rep && rep.status === "retained" && typeof rep.attorney !== "string") {
    out.push({ path: "$.representation.attorney", message: "retained, by whom?" });
  }
  return out;
}
