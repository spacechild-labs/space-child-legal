/**
 * Provenance (PRD §4.2 "chain of custody for all documents"). Ingesting a file records what it
 * is (sha256), when, from where, with which tool, and how confident the OCR and the classifier
 * were. The hash lets anyone later prove the file the lawyer sees is the file that was ingested.
 */
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import type { CaseDocument, Provenance } from "../case-manager/types.js";
import { classifyDocument, LOW_CONFIDENCE } from "./classify.js";
import type { OcrProvider } from "./ocr.js";

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export interface IngestOptions {
  id: string;
  relPath: string;             // as it will be recorded in case.json (relative to the case dir)
  absPath: string;             // where to read it now
  source: string;              // "gmail:<msgid>", "scan", "court e-filing", "hand"
  ocr?: OcrProvider;
  text?: string;               // if the text is already known (email body, PDF text layer)
  now?: Date;
  date?: string;               // document's own date, YYYY-MM-DD, if known
}

export interface IngestResult {
  document: CaseDocument;
  text: string;
  low_confidence: boolean;
  warnings: string[];
}

/** Hash, OCR (if a provider is given and no text was supplied), classify, and build the document record. */
export async function ingest(opts: IngestOptions): Promise<IngestResult> {
  const warnings: string[] = [];
  const stat = statSync(opts.absPath);
  const sha256 = sha256File(opts.absPath);
  let text = opts.text ?? "";
  const provenance: Provenance = {
    ingested_at: (opts.now ?? new Date()).toISOString(),
    source: opts.source,
    tool: `sclegal ingest (${stat.size} bytes)`,
  };
  if (!text && opts.ocr) {
    const r = await opts.ocr.extract(opts.absPath);
    text = r.text;
    provenance.ocr_confidence = r.confidence;
    provenance.tool = `${provenance.tool}; ocr=${opts.ocr.name}`;
    if (r.confidence < LOW_CONFIDENCE) warnings.push(`OCR confidence ${r.confidence} — verify the text against the original`);
  }
  const cls = classifyDocument({ filename: basename(opts.relPath), text });
  provenance.classification_confidence = cls.confidence;
  if (cls.confidence < LOW_CONFIDENCE) warnings.push(`classified as ${cls.type} at ${cls.confidence} — confirm the type` + (cls.alternatives.length ? ` (also possible: ${cls.alternatives.map((a) => a.type).join(", ")})` : ""));
  const document: CaseDocument = { id: opts.id, path: opts.relPath, type: cls.type, sha256, provenance };
  if (opts.date) document.date = opts.date;
  return { document, text, low_confidence: warnings.length > 0, warnings };
}
