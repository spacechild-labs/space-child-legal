import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { classifyDocument, LOW_CONFIDENCE } from "../document-pipeline/classify.js";
import { ingest, sha256File } from "../document-pipeline/provenance.js";
import { PlainTextOcr, ocrProvenanceHttp } from "../document-pipeline/ocr.js";

// Every fixture below is invented.
test("document classification names its cues and reports low confidence instead of hiding it", () => {
  const order = classifyDocument({ filename: "2026-04-01 ruling.pdf", text: "IT IS THEREFORE ORDERED that the motion is denied. SO ORDERED." });
  assert.equal(order.type, "order"); assert.ok(order.confidence >= LOW_CONFIDENCE, String(order.confidence));
  const email = classifyDocument({ filename: "msg-19.eml", text: "From: clerk@example.gov\nTo: someone\nSubject: Notice of Electronic Filing\n\nA document was filed." });
  assert.ok(["correspondence", "notice"].includes(email.type), email.type);
  assert.ok(email.cues.some((c) => c.startsWith("correspondence:")) && email.cues.some((c) => c.startsWith("notice:")), "both cues fired and are reported");
  const fee = classifyDocument({ filename: "example-fee-agreement.pdf", text: "This Fee Agreement is entered into between the Client and Example Law Office." });
  assert.equal(fee.type, "agreement");
  const photo = classifyDocument({ filename: "IMG_2231.jpeg" });
  assert.equal(photo.type, "evidence");
  const nothing = classifyDocument({ filename: "scan0001.pdf", text: "" });
  assert.equal(nothing.type, "unknown"); assert.equal(nothing.confidence, 0);
  const mixed = classifyDocument({ filename: "doc.pdf", text: "Dear Sam, thank you for your motion to dismiss." });
  assert.ok(mixed.confidence < 0.9, "competing cues lower the confidence");
  assert.ok(mixed.alternatives.length >= 1);
});

test("ingest hashes the file, classifies it, records provenance, and warns on low confidence", async () => {
  const dir = mkdtempSync(join(tmpdir(), "scl-ing-"));
  try {
    const p = join(dir, "notice-of-hearing.txt");
    writeFileSync(p, "NOTICE OF HEARING\nYou are hereby notified that a hearing is set for 2026-10-01.");
    const r = await ingest({ id: "doc-001", relPath: "emails/notice-of-hearing.txt", absPath: p, source: "court e-filing", ocr: PlainTextOcr, now: new Date("2026-09-09T12:00:00Z") });
    assert.equal(r.document.sha256, sha256File(p));
    assert.equal(r.document.type, "notice");
    assert.equal(r.document.provenance?.source, "court e-filing");
    assert.equal(r.document.provenance?.ocr_confidence, 1);
    assert.equal(r.document.provenance?.ingested_at, "2026-09-09T12:00:00.000Z");
    assert.match(r.document.provenance?.tool ?? "", /plain-text/);
    const blank = join(dir, "scan.txt"); writeFileSync(blank, "");
    const r2 = await ingest({ id: "doc-002", relPath: "scan.txt", absPath: blank, source: "scan", ocr: PlainTextOcr });
    assert.equal(r2.document.type, "unknown");
    assert.equal(r2.low_confidence, true);
    assert.ok(r2.warnings.some((w) => /confirm the type/.test(w)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("the OCR-Provenance HTTP adapter refuses a silent empty transcript", async () => {
  const dir = mkdtempSync(join(tmpdir(), "scl-ocr-"));
  try {
    const p = join(dir, "page.png"); writeFileSync(p, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const good = ocrProvenanceHttp({ baseUrl: "http://ocr.test", fetchImpl: (async () => new Response(JSON.stringify({ text: "hello", confidence: 0.93 }), { status: 200 })) as unknown as typeof fetch });
    assert.deepEqual(await good.extract(p), { text: "hello", confidence: 0.93 });
    const noText = ocrProvenanceHttp({ baseUrl: "http://ocr.test", fetchImpl: (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch });
    await assert.rejects(() => noText.extract(p), /no text field/);
    const down = ocrProvenanceHttp({ baseUrl: "http://ocr.test", fetchImpl: (async () => new Response("", { status: 503, statusText: "down" })) as unknown as typeof fetch });
    await assert.rejects(() => down.extract(p), /503/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
