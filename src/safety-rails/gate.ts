/**
 * The safety-rail gateway (PRD §5, "SAFETY RAIL GATEWAY — all AI output passes through here").
 *
 * gate(text) classifies, decides, and writes one append-only audit record. It returns either
 * the text (ORGANIZATIONAL), the text with the mandatory disclaimer (INFORMATIONAL), or a
 * refusal that names why (LEGAL_ANALYSIS). Nothing bypasses it; the kill switch is an
 * environment variable read on every call, so disabling AI output needs no deploy.
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { classify, type Classification, type Tier } from "./classify.js";

export const MANDATORY_DISCLAIMER =
  "⚠️ Space Child Legal is a case management tool, not a lawyer. Nothing on this platform constitutes legal advice. " +
  "AI-generated content may contain errors. Consult a licensed attorney for legal advice.";

export const BLOCKED_MESSAGE =
  "This output was withheld. It read as legal analysis — identifying a defense, evaluating a claim, suggesting an argument, " +
  "drafting a filing, or citing a case — which this platform does not provide. Organize the facts; a licensed attorney identifies the law. " +
  "If you do not have one yet, the 'find a lawyer' resources on your case page are the next step.";

export interface GateResult {
  allowed: boolean;
  tier: Tier;
  text: string;                 // what may be shown
  classification: Classification;
  audit_id: string;
}

export interface AuditRecord {
  id: string;
  at: string;
  feature: string;              // which part of the platform asked (e.g. "timeline.summarize")
  case_id?: string;
  tier: Tier;
  allowed: boolean;
  reasons: string[];
  matches: string[];
  input_chars: number;
  input_sha256: string;
  kill_switch: boolean;
}

export interface GateOptions {
  feature: string;
  case_id?: string;
  auditPath: string;            // JSONL, append-only; keep it out of git
  now?: Date;
  killSwitch?: boolean;         // default: process.env.SCLEGAL_AI_DISABLED === "1"
}

import { createHash, randomUUID } from "node:crypto";

export function gate(text: string, opts: GateOptions): GateResult {
  const kill = opts.killSwitch ?? process.env.SCLEGAL_AI_DISABLED === "1";
  const classification = kill
    ? { tier: "LEGAL_ANALYSIS" as Tier, reasons: ["kill_switch"], matches: [] }
    : classify(text);
  const allowed = classification.tier !== "LEGAL_ANALYSIS";
  const id = randomUUID();
  const record: AuditRecord = {
    id, at: (opts.now ?? new Date()).toISOString(), feature: opts.feature,
    tier: classification.tier, allowed, reasons: classification.reasons, matches: classification.matches,
    input_chars: text.length, input_sha256: createHash("sha256").update(text).digest("hex"), kill_switch: kill,
  };
  if (opts.case_id) record.case_id = opts.case_id;
  appendAudit(opts.auditPath, record);
  const shown = !allowed ? BLOCKED_MESSAGE
    : classification.tier === "INFORMATIONAL" ? `${text}\n\n${MANDATORY_DISCLAIMER}`
    : text;
  return { allowed, tier: classification.tier, text: shown, classification, audit_id: id };
}

/** Append-only: one JSON object per line, never rewritten. The log is the accountability record (PRD §6.3). */
export function appendAudit(path: string, record: AuditRecord): void {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(record) + "\n", { encoding: "utf8" });
}
