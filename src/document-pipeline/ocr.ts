/**
 * OCR providers. The PRD lists an existing OCR-Provenance container (port 3100, MCP tools) as
 * "already built"; its HTTP contract is not recorded in this repository, so the adapter below is
 * configurable and marked unverified rather than guessed at. Until it is confirmed against the
 * running service, the platform works with text supplied some other way (email bodies, PDF text
 * layers, hand-typed transcripts) and records ocr_confidence only when a provider ran.
 */
import { readFileSync } from "node:fs";

export interface OcrResult {
  text: string;
  confidence: number;     // 0..1; a provider that cannot estimate it must say so with 0
}

export interface OcrProvider {
  name: string;
  extract(absPath: string): Promise<OcrResult>;
}

/** Reads a plain-text or markdown file as its own OCR. Confidence 1: nothing was recognised, only read. */
export const PlainTextOcr: OcrProvider = {
  name: "plain-text",
  async extract(absPath) {
    return { text: readFileSync(absPath, "utf8"), confidence: 1 };
  },
};

/**
 * HTTP adapter for the OCR-Provenance service. UNVERIFIED: endpoint path, request shape and
 * response shape are configuration until someone confirms them against the container. It posts
 * the file as multipart/form-data and expects `{ text, confidence }` back; anything else is an
 * error, never a silent empty transcript.
 */
export function ocrProvenanceHttp(opts: { baseUrl?: string; path?: string; fetchImpl?: typeof fetch } = {}): OcrProvider {
  const baseUrl = opts.baseUrl ?? process.env.SCLEGAL_OCR_URL ?? "http://127.0.0.1:3100";
  const path = opts.path ?? process.env.SCLEGAL_OCR_PATH ?? "/ocr";
  const f = opts.fetchImpl ?? fetch;
  return {
    name: `ocr-provenance@${baseUrl}`,
    async extract(absPath) {
      const body = new FormData();
      body.set("file", new Blob([readFileSync(absPath)]), absPath.split(/[\\/]/).pop() ?? "document");
      const res = await f(`${baseUrl}${path}`, { method: "POST", body });
      if (!res.ok) throw new Error(`OCR service ${res.status} ${res.statusText}`);
      const data = (await res.json()) as { text?: unknown; confidence?: unknown };
      if (typeof data.text !== "string") throw new Error("OCR service returned no text field");
      const confidence = typeof data.confidence === "number" ? Math.max(0, Math.min(1, data.confidence)) : 0;
      return { text: data.text, confidence };
    },
  };
}
