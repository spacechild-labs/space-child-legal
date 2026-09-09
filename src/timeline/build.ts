/**
 * Case timeline (PRD §4.1 "chronological event reconstruction"). Events, dated documents,
 * recorded deadlines, and trigger dates are merged into one ordered list. Every entry names
 * its source so a reader can go back to the fact behind it. Nothing is inferred: an undated
 * document is listed separately as undated, not placed by guesswork.
 */
import type { CaseFile } from "../case-manager/types.js";

export interface TimelineEntry {
  date: string;
  label: string;
  kind: string;          // event kind, "document", "deadline", or "trigger"
  source: string;
  future: boolean;
}

export interface Timeline {
  entries: TimelineEntry[];
  undated_documents: Array<{ id: string; path: string; type: string }>;
}

const TRIGGER_LABELS: Record<string, string> = {
  incident_date: "Incident",
  service_date: "Served",
  charge_date: "Charged",
  revocation_notice_date: "Revocation notice received",
  adverse_action_date: "Adverse employment action",
  judgment_date: "Judgment entered",
  hearing_date: "Hearing",
};

export function buildTimeline(c: CaseFile, today: string): Timeline {
  const entries: TimelineEntry[] = [];
  for (const e of c.events ?? []) {
    entries.push({ date: e.date, label: e.label, kind: e.kind, source: e.source ?? "events[]", future: e.date > today });
  }
  const eventDates = new Set(entries.map((e) => `${e.date}|${e.kind}`));
  for (const [key, date] of Object.entries(c.triggers ?? {})) {
    if (!date) continue;
    // a trigger that is already an event of the same day is not repeated
    const kind = key.replace(/_date$/, "");
    if (eventDates.has(`${date}|${kind}`)) continue;
    entries.push({ date, label: TRIGGER_LABELS[key] ?? key, kind: "trigger", source: `triggers.${key}`, future: date > today });
  }
  for (const d of c.deadlines ?? []) {
    entries.push({ date: d.due, label: `${d.label} (${d.status})`, kind: "deadline", source: `deadlines[${d.id}] · ${d.source}`, future: d.due > today });
  }
  const undated: Timeline["undated_documents"] = [];
  for (const doc of c.documents ?? []) {
    if (doc.date) entries.push({ date: doc.date, label: doc.title ?? doc.path, kind: "document", source: `documents[${doc.id}]`, future: doc.date > today });
    else undated.push({ id: doc.id, path: doc.path, type: doc.type });
  }
  entries.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
  return { entries, undated_documents: undated };
}

export function renderTimelineMarkdown(c: CaseFile, t: Timeline): string {
  const lines = [`# ${c.id} — ${c.title}`, "", "| Date | Event | Kind | Source |", "|---|---|---|---|"];
  for (const e of t.entries) lines.push(`| ${e.date}${e.future ? " (upcoming)" : ""} | ${e.label} | ${e.kind} | ${e.source} |`);
  if (t.undated_documents.length) {
    lines.push("", "Undated documents (not placed on the timeline):");
    for (const d of t.undated_documents) lines.push(`- ${d.id}: ${d.path} (${d.type})`);
  }
  return lines.join("\n") + "\n";
}
