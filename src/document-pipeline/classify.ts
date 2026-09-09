/**
 * Document classification (PRD §4.2). Given a filename and whatever text we have (OCR output,
 * email body, a PDF's text layer), say what kind of document it is — complaint, answer, motion,
 * order, notice, correspondence, evidence, contract, receipt, report, agreement — with a
 * confidence and the cues that fired. Rule-based on purpose: a file clerk's judgement, fully
 * explainable, no model in the loop. Low confidence is reported, never hidden (PRD §6.2,
 * anti-hallucination measure 4).
 */
import type { DocumentType } from "../case-manager/types.js";

export interface DocClassification {
  type: DocumentType;
  confidence: number;          // 0..1
  cues: string[];
  alternatives: Array<{ type: DocumentType; score: number }>;
}

interface Cue { type: DocumentType; re: RegExp; weight: number; where: "text" | "name" | "both"; }

const CUES: Cue[] = [
  { type: "complaint", re: /\b(?:petition|complaint)\b.{0,40}\b(?:plaintiff|petitioner)\b|\bplaintiff[^.]{0,80}\b(?:alleges|states|complains)\b|\boriginal notice\b/is, weight: 3, where: "text" },
  { type: "complaint", re: /\b(?:complaint|petition|original[-_ ]notice)\b/i, weight: 2, where: "name" },
  { type: "answer", re: /\b(?:answer|appearance and answer)\b[^.]{0,60}\b(?:defendant|respondent)\b|\bdefendant (?:denies|admits|answers)\b|\bgeneral denial\b/is, weight: 3, where: "text" },
  { type: "answer", re: /\banswer\b/i, weight: 2, where: "name" },
  { type: "motion", re: /\bmotion (?:to|for)\b|\bmovant\b|\bhereby moves\b/i, weight: 3, where: "text" },
  { type: "motion", re: /\bmotion\b/i, weight: 2, where: "name" },
  { type: "order", re: /\bit is (?:hereby |therefore |so )?ordered\b|\border(?:ed)? (?:that|and adjudged)\b|\bjudgment (?:is|be) entered\b|\bso ordered\b/i, weight: 4, where: "text" },
  { type: "order", re: /\b(?:order|judgment|ruling|decree)\b/i, weight: 2, where: "name" },
  { type: "notice", re: /\bnotice of (?:hearing|trial|revocation|appeal|deposition|electronic filing|intent)\b|\bnotice is hereby given\b|\byou are hereby notified\b/i, weight: 3, where: "text" },
  { type: "notice", re: /\bnotice\b|\bnef\b/i, weight: 2, where: "name" },
  { type: "correspondence", re: /^(?:from|to|subject|date):/im, weight: 3, where: "text" },
  { type: "correspondence", re: /\b(?:dear|sincerely|regards|best,|thank you)\b/i, weight: 1, where: "text" },
  { type: "correspondence", re: /\.(?:eml|msg)$|\b(?:email|letter|correspondence)\b/i, weight: 2, where: "name" },
  { type: "agreement", re: /\b(?:fee agreement|retainer agreement|engagement letter|this agreement is (?:made|entered)|the parties agree)\b/i, weight: 3, where: "text" },
  { type: "agreement", re: /\b(?:agreement|retainer|engagement)\b/i, weight: 2, where: "name" },
  { type: "contract", re: /\b(?:cardholder agreement|terms and conditions|credit agreement|promissory note|lease agreement)\b/i, weight: 3, where: "text" },
  { type: "contract", re: /\b(?:contract|lease|terms)\b/i, weight: 1, where: "name" },
  { type: "receipt", re: /\b(?:receipt|invoice|amount due|total due|paid in full|payment received|statement of account)\b/i, weight: 2, where: "text" },
  { type: "receipt", re: /\b(?:receipt|invoice|statement|bill)\b/i, weight: 2, where: "name" },
  { type: "report", re: /\b(?:incident report|police report|officer|sworn report|lab(?:oratory)? report|test result|performance improvement plan|performance review)\b/i, weight: 3, where: "text" },
  { type: "report", re: /\b(?:report|pip|review|results?)\b/i, weight: 1, where: "name" },
  { type: "evidence", re: /\.(?:jpe?g|png|heic|mp4|mov|m4a|wav)$|\b(?:photo|img|screenshot|recording)\b/i, weight: 3, where: "name" },
];

export function classifyDocument(input: { filename?: string; text?: string }): DocClassification {
  const name = input.filename ?? "";
  const text = input.text ?? "";
  const scores = new Map<DocumentType, number>();
  const cues: string[] = [];
  for (const c of CUES) {
    const hay = c.where === "name" ? name : c.where === "text" ? text : `${name}\n${text}`;
    if (!hay) continue;
    const m = c.re.exec(hay);
    if (m) {
      scores.set(c.type, (scores.get(c.type) ?? 0) + c.weight);
      cues.push(`${c.type}:${c.where}:${m[0].slice(0, 40).replace(/\s+/g, " ")}`);
    }
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([type, score]) => ({ type, score }));
  if (!ranked.length) return { type: "unknown", confidence: 0, cues: [], alternatives: [] };
  const top = ranked[0]!;
  const second = ranked[1]?.score ?? 0;
  const total = ranked.reduce((s, r) => s + r.score, 0);
  // share of the evidence the winner holds, tempered by how far ahead of the runner-up it is
  const share = top.score / total;
  const margin = (top.score - second) / top.score;
  const confidence = Math.round(Math.min(0.99, 0.5 * share + 0.5 * margin) * 100) / 100;
  return { type: top.type, confidence, cues, alternatives: ranked.slice(1, 4) };
}

/** Confidence below this is flagged for a human to look at before the type is trusted. */
export const LOW_CONFIDENCE = 0.6;
