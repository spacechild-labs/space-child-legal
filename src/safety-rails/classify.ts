/**
 * Safety rails — output classification (PRD §6.2).
 *
 * Every piece of AI-produced text passes through here before a person sees it:
 *
 *   ORGANIZATIONAL  document classification, timeline ordering, deadline arithmetic, indexing.
 *                   Safe to present.
 *   INFORMATIONAL   general procedural information ("in Iowa the answer is typically due in 20
 *                   days"). Presented WITH the disclaimer.
 *   LEGAL_ANALYSIS  anything that identifies a defense, evaluates a claim, suggests an argument,
 *                   predicts an outcome, drafts an affidavit, or cites a case. BLOCKED.
 *
 * The classifier is deliberately conservative and deliberately dumb: regular expressions over
 * the text, each one named, each one explainable in the audit log. A false block costs a
 * sentence; a false pass can cost someone their case (the a consumer attorney test, PRD Appendix A).
 */

export type Tier = "ORGANIZATIONAL" | "INFORMATIONAL" | "LEGAL_ANALYSIS";

export interface Classification {
  tier: Tier;
  reasons: string[];        // names of the patterns that fired, most severe first
  matches: string[];        // the text that fired them, for the audit log
}

interface Pattern { name: string; re: RegExp; }

/** Red: the platform must never say these. */
const LEGAL_ANALYSIS: Pattern[] = [
  { name: "identifies_defense", re: /\b(you|they|he|she|the (?:defendant|client)) (?:may |might |likely |probably |clearly |do(?:es)? )?(?:have|has|had) (?:a|an|the|no|strong|valid|good|viable|complete|meritorious) [\w\s-]{0,30}?(?:defense|defence|claim|counterclaim|cause of action)\b/i },
  { name: "identifies_defense", re: /\b(?:affirmative defense|statute of limitations|laches|estoppel|unclean hands|failure to state a claim|lack of standing|res judicata|accord and satisfaction)\b[^.]{0,60}\b(?:applies|bars|defeats|available|raise|assert|argue)\b/i },
  { name: "identifies_defense", re: /\b(?:raise|assert|argue|plead|invoke)\b[^.]{0,40}\b(?:defense|defence|statute of limitations|counterclaim|laches|unclean hands|estoppel|waiver|duress|unconscionab\w+|accord and satisfaction|failure to state a claim|lack of standing|res judicata|statute of frauds)\b/i },
  { name: "suggests_argument", re: /\b(?:you should|you could|i(?:'d| would) (?:argue|contend|assert)|argue that|contend that|the argument (?:is|would be)|your (?:best|strongest) argument)\b/i },
  { name: "evaluates_claim", re: /\b(?:you (?:will|would|should|are likely to) (?:win|lose|prevail)|(?:strong|weak|winning|losing) case|likely to (?:succeed|prevail|fail)|the court (?:will|would) (?:likely |probably )?(?:find|rule|hold|dismiss|grant)|chances? of (?:winning|success|prevailing))\b/i },
  { name: "legal_conclusion", re: /\b(?:this (?:is|was|constitutes) (?:clearly |plainly |obviously )?(?:retaliation|discrimination|a violation|unlawful|illegal|negligence|fraud|breach)|they (?:are|were) (?:liable|negligent|in breach)|(?:violated|breached) (?:the|your|his|her) (?:rights|contract|duty))\b/i },
  { name: "drafts_motion", re: /\b(?:motion to (?:dismiss|suppress|compel|strike|vacate)|memorandum (?:of law|in support)|brief in (?:support|opposition)|comes now|wherefore,? (?:the )?(?:defendant|plaintiff|movant)|respectfully (?:moves|submits|requests that the court))\b/i },
  { name: "drafts_affidavit", re: /\b(?:being (?:first )?duly sworn|under penalty of perjury|affiant (?:states|says|deposes)|i,? [\w .]+,? (?:hereby )?(?:declare|depose|affirm))\b/i },
  { name: "cites_case", re: /\b\d{1,4}\s+(?:U\.?S\.?|S\.? ?Ct\.?|F\.?(?:2d|3d|4th)?|F\.? ?Supp\.?(?: ?[23]d)?|N\.?W\.?(?:2d|3d)?|N\.?E\.?(?:2d|3d)?|So\.?(?:2d|3d)?|P\.?(?:2d|3d)?|A\.?(?:2d|3d)?|Iowa|Wis\.?(?: ?2d)?)\s+\d{1,5}\b/ },
  { name: "cites_case", re: /\b[A-Z][\w.&'-]+(?: [A-Z][\w.&'-]+){0,4} v\. [A-Z][\w.&'-]+(?: [A-Z][\w.&'-]+){0,4}\b(?:,|\s\(|\s\d)/ },
  { name: "predicts_outcome", re: /\b(?:you'?ll get|you will receive|expect (?:a|the) (?:judgment|verdict|settlement) of|the case will be (?:dismissed|thrown out|won|lost))\b/i },
];

/** Yellow: procedural information; allowed with the disclaimer attached. */
const INFORMATIONAL: Pattern[] = [
  { name: "states_deadline", re: /\b(?:within|in|has|have) \d{1,3} (?:calendar |business |court )?days\b/i },
  // Procedural NOUNS alone are not information — a timeline says "initial appearance" and is
  // organizational. It becomes informational when it tells someone what the procedure requires.
  { name: "names_procedure", re: /\b(?:must|should|need to|have to|can|may|will) (?:file|appear|answer|respond|serve|be entered|be filed)\b|\b(?:is|are|was) due\b|\bdeadline\b|\bdefault judgment\b/i },
  { name: "names_rule", re: /\b(?:iowa code|wis\.? stat\.?|u\.s\.c\.|c\.f\.r\.|r\. civ\. p\.|rule \d|§|section \d)/i },
  { name: "names_agency", re: /\b(?:eeoc|icrc|iowa civil rights commission|department of labor|dol|dot|equal rights division|erd)\b/i },
];

export function classify(text: string): Classification {
  const reasons: string[] = [];
  const matches: string[] = [];
  for (const p of LEGAL_ANALYSIS) {
    const m = p.re.exec(text);
    if (m) { reasons.push(p.name); matches.push(m[0].slice(0, 120)); }
  }
  if (reasons.length) return { tier: "LEGAL_ANALYSIS", reasons: dedupe(reasons), matches };
  for (const p of INFORMATIONAL) {
    const m = p.re.exec(text);
    if (m) { reasons.push(p.name); matches.push(m[0].slice(0, 120)); }
  }
  if (reasons.length) return { tier: "INFORMATIONAL", reasons: dedupe(reasons), matches };
  return { tier: "ORGANIZATIONAL", reasons: [], matches: [] };
}

function dedupe<T>(xs: T[]): T[] { return [...new Set(xs)]; }
