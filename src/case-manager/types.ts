/**
 * The case file, as TypeScript. Mirrors schema/case.schema.json — the schema is the contract,
 * these types are its shadow for the code. Every field is organizational: who, where, which
 * dates started which clocks, what happened, which documents exist. Nothing here records a
 * legal theory, a defense, or an argument (PRD §6).
 */

export type MatterType =
  | "debt_collection" | "eviction" | "consumer" | "employment" | "criminal_owi" | "criminal_other"
  | "ip_licensing" | "family" | "administrative" | "other";

export type CaseStatus = "active" | "monitoring" | "closed";
export type Priority = "critical" | "high" | "medium" | "low";
export type Forum = "state_court" | "small_claims" | "federal_court" | "agency" | "administrative_hearing" | "none";

export type Posture =
  | "pre_filing" | "served_answer_due" | "answered" | "discovery" | "hearing_set" | "trial_set"
  | "post_judgment" | "appeal" | "administrative" | "investigation" | "closed";

export type RepresentationStatus = "retained" | "consulting" | "seeking" | "pro_se" | "not_needed";

export type EventKind =
  | "incident" | "charge" | "service" | "filing" | "hearing" | "order" | "correspondence"
  | "appointment" | "engagement" | "deadline" | "other";

export type DocumentType =
  | "complaint" | "answer" | "motion" | "order" | "notice" | "correspondence" | "evidence"
  | "contract" | "receipt" | "report" | "agreement" | "unknown";

export type DeadlineSource = "court" | "counsel" | "computed" | "manual";
export type DeadlineStatus = "open" | "met" | "missed" | "vacated" | "unknown";

/** Dates that start procedural clocks. The deadline engine reads these and nothing else. */
export interface Triggers {
  incident_date?: string;
  service_date?: string;
  charge_date?: string;
  revocation_notice_date?: string;
  adverse_action_date?: string;
  judgment_date?: string;
  hearing_date?: string;
}

export interface Deadline {
  id: string;
  label: string;
  due: string;             // YYYY-MM-DD
  source: DeadlineSource;
  rule?: string;
  status: DeadlineStatus;
  notes?: string;
}

export interface CaseEvent {
  date: string;
  label: string;
  kind: EventKind;
  source?: string;
  notes?: string;
}

export interface Provenance {
  ingested_at?: string;
  source?: string;
  tool?: string;
  ocr_confidence?: number;
  classification_confidence?: number;
}

export interface CaseDocument {
  id: string;
  path: string;
  type: DocumentType;
  title?: string;
  date?: string;
  sha256?: string;
  provenance?: Provenance;
}

export interface Party {
  role: "plaintiff" | "defendant" | "prosecutor" | "employer" | "agency" | "creditor" | "debt_buyer" | "witness" | "other";
  name: string;
  counsel?: string[];
  notes?: string;
}

export interface CaseFile {
  $schema?: string;
  id: string;
  slug: string;
  title: string;
  matter_type: MatterType;
  status: CaseStatus;
  priority: Priority;
  opened: string;
  closed?: string;
  jurisdiction: {
    country: "US";
    state: string;
    county?: string;
    court?: string;
    case_number?: string;
    forum?: Forum;
  };
  client: { name: string; role: string };
  parties?: Party[];
  representation: {
    status: RepresentationStatus;
    attorney?: string;
    firm?: string;
    since?: string;
    referral_sources?: string[];
  };
  posture: Posture;
  triggers?: Triggers;
  deadlines?: Deadline[];
  events?: CaseEvent[];
  documents?: CaseDocument[];
  attorney_finder?: { needed?: boolean; specialty?: string; sources?: string[]; notes?: string };
  notes?: string;
}
