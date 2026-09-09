/**
 * Deadline engine. Reads a case's trigger dates, applies the rule table in rules/deadlines.json,
 * and returns computed due dates with the rule, the authority, the counting method, and the
 * disclaimer attached. It is a reminder to check, never a filing deadline to rely on: every
 * result carries verified:false until a licensed attorney has confirmed the rule, and a date
 * set by the court or counsel always outranks a computed one (PRD §4.3, §6.2).
 *
 * Counting: calendar days from the day after the trigger; a due date on a Saturday, Sunday,
 * or federal holiday rolls forward to the next business day. Courts differ on state holidays
 * and on short periods — that is one of the things "verified" means.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CaseFile, Deadline, Triggers } from "../case-manager/types.js";
import { isIsoDate } from "../case-manager/validate.js";

export interface Rule {
  id: string;
  jurisdiction: string;            // "IA", "WI", "US"
  states_deferral?: string[];      // for federal rules that depend on the state
  matter_types: string[];
  forums?: string[];
  label: string;
  trigger: keyof Triggers;
  days: number;
  authority: string;
  verified: boolean;
  notes?: string;
}

export interface ComputedDeadline {
  rule: string;
  label: string;
  trigger: keyof Triggers;
  trigger_date: string;
  due: string;
  rolled_from?: string;            // set when the raw date fell on a weekend/holiday
  days: number;
  authority: string;
  verified: false;
  notes?: string;
  disclaimer: string;
}

export const DISCLAIMER =
  "Computed from a rule table, not confirmed by a lawyer. Deadlines depend on how and when you were served, " +
  "which court, and local rules. Confirm this date with the court or a licensed attorney before relying on it.";

export function loadRules(repoRoot: string): Rule[] {
  const raw = JSON.parse(readFileSync(join(repoRoot, "rules", "deadlines.json"), "utf8")) as { rules: Rule[] };
  return raw.rules;
}

// ---- calendar helpers (all UTC, all YYYY-MM-DD)

function parse(d: string): Date {
  const [y, m, dd] = d.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, dd));
}
function fmt(d: Date): string { return d.toISOString().slice(0, 10); }
export function addDays(iso: string, n: number): string {
  const d = parse(iso); d.setUTCDate(d.getUTCDate() + n); return fmt(d);
}
function nthWeekday(year: number, month0: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(year, month0, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return fmt(new Date(Date.UTC(year, month0, 1 + offset + (n - 1) * 7)));
}
function lastWeekday(year: number, month0: number, weekday: number): string {
  const last = new Date(Date.UTC(year, month0 + 1, 0));
  const back = (last.getUTCDay() - weekday + 7) % 7;
  return fmt(new Date(Date.UTC(year, month0, last.getUTCDate() - back)));
}
function observed(iso: string): string {
  const d = parse(iso); const wd = d.getUTCDay();
  if (wd === 6) return addDays(iso, -1);   // Saturday -> Friday
  if (wd === 0) return addDays(iso, 1);    // Sunday -> Monday
  return iso;
}

/** US federal holidays for a year, as observed (5 U.S.C. § 6103). */
export function federalHolidays(year: number): Set<string> {
  return new Set([
    observed(`${year}-01-01`),                 // New Year's Day
    nthWeekday(year, 0, 1, 3),                 // Birthday of Martin Luther King, Jr.
    nthWeekday(year, 1, 1, 3),                 // Washington's Birthday
    lastWeekday(year, 4, 1),                   // Memorial Day
    observed(`${year}-06-19`),                 // Juneteenth
    observed(`${year}-07-04`),                 // Independence Day
    nthWeekday(year, 8, 1, 1),                 // Labor Day
    nthWeekday(year, 9, 1, 2),                 // Columbus Day
    observed(`${year}-11-11`),                 // Veterans Day
    nthWeekday(year, 10, 4, 4),                // Thanksgiving
    observed(`${year}-12-25`),                 // Christmas
  ]);
}

export function isBusinessDay(iso: string): boolean {
  const wd = parse(iso).getUTCDay();
  if (wd === 0 || wd === 6) return false;
  return !federalHolidays(Number(iso.slice(0, 4))).has(iso);
}

export function rollForward(iso: string): string {
  let d = iso;
  for (let i = 0; i < 10 && !isBusinessDay(d); i++) d = addDays(d, 1);
  return d;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parse(toIso).getTime() - parse(fromIso).getTime()) / 86_400_000);
}

// ---- the engine

function ruleApplies(rule: Rule, c: CaseFile): boolean {
  const state = c.jurisdiction.state;
  if (rule.jurisdiction !== "US" && rule.jurisdiction !== state) return false;
  if (rule.jurisdiction === "US" && rule.states_deferral && !rule.states_deferral.includes(state)) return false;
  if (!rule.matter_types.includes(c.matter_type)) return false;
  if (rule.forums && c.jurisdiction.forum && !rule.forums.includes(c.jurisdiction.forum)) return false;
  return true;
}

/** Every rule whose trigger date the case records, computed. Rules whose trigger is absent are skipped, not guessed. */
export function computeDeadlines(c: CaseFile, rules: Rule[]): ComputedDeadline[] {
  const out: ComputedDeadline[] = [];
  const triggers = c.triggers ?? {};
  for (const rule of rules) {
    if (!ruleApplies(rule, c)) continue;
    const t = triggers[rule.trigger];
    if (!t || !isIsoDate(t)) continue;
    const raw = addDays(t, rule.days);
    const due = rollForward(raw);
    const item: ComputedDeadline = {
      rule: rule.id, label: rule.label, trigger: rule.trigger, trigger_date: t, due,
      days: rule.days, authority: rule.authority, verified: false, disclaimer: DISCLAIMER,
    };
    if (due !== raw) item.rolled_from = raw;
    if (rule.notes) item.notes = rule.notes;
    out.push(item);
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}

/** Rules that would apply to this case but cannot run because the trigger date is not recorded — the question to ask next. */
export function missingTriggers(c: CaseFile, rules: Rule[]): Array<{ rule: string; trigger: keyof Triggers; label: string }> {
  const triggers = c.triggers ?? {};
  return rules
    .filter((r) => ruleApplies(r, c) && !triggers[r.trigger])
    .map((r) => ({ rule: r.id, trigger: r.trigger, label: r.label }));
}

export interface DeadlineView {
  label: string;
  due: string;
  days_left: number;
  source: Deadline["source"];
  status: Deadline["status"];
  rule?: string;
  authority?: string;
  verified: boolean;
  notes?: string;
}

/**
 * The deadlines to show for a case: recorded ones (court, counsel, manual) first — they are
 * authoritative — then computed ones that no recorded deadline already covers (same rule id).
 */
export function deadlineView(c: CaseFile, rules: Rule[], today: string): DeadlineView[] {
  const recorded = (c.deadlines ?? []).map<DeadlineView>((d) => {
    const v: DeadlineView = { label: d.label, due: d.due, days_left: daysBetween(today, d.due), source: d.source, status: d.status, verified: d.source === "court" || d.source === "counsel" };
    if (d.rule) v.rule = d.rule;
    if (d.notes) v.notes = d.notes;
    return v;
  });
  const covered = new Set(recorded.map((r) => r.rule).filter(Boolean));
  const computed = computeDeadlines(c, rules)
    .filter((d) => !covered.has(d.rule))
    .map<DeadlineView>((d) => {
      const v: DeadlineView = {
        label: d.label, due: d.due, days_left: daysBetween(today, d.due), source: "computed",
        status: d.due < today ? "unknown" : "open", rule: d.rule, authority: d.authority, verified: false,
      };
      if (d.notes) v.notes = d.notes;
      return v;
    });
  return [...recorded, ...computed].sort((a, b) => a.due.localeCompare(b.due));
}
