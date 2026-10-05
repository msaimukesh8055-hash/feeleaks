// src/lib/types.ts
// Core domain types shared by the server, the store and the UI.

export const INSTITUTION_TYPES = [
  "school",
  "college",
  "university",
  "tuition_centre",
  "other",
] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  school: "School",
  college: "College",
  university: "University",
  tuition_centre: "Tuition centre",
  other: "Other",
};

export const FEE_KINDS = [
  "tuition",
  "admission",
  "development",
  "donation",
  "transport",
  "books_uniform",
  "hostel",
  "exam",
  "other",
] as const;
export type FeeKind = (typeof FEE_KINDS)[number];

export const FEE_KIND_LABELS: Record<FeeKind, string> = {
  tuition: "Tuition",
  admission: "Admission",
  development: "Development fund",
  donation: "Donation / capitation",
  transport: "Transport",
  books_uniform: "Books & uniform",
  hostel: "Hostel",
  exam: "Exam",
  other: "Other",
};

// How often a fee component is charged. Used to work out a yearly cost.
export const FEE_FREQUENCIES = [
  "one_time",
  "yearly",
  "half_yearly",
  "quarterly",
  "monthly",
] as const;
export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

export const FEE_FREQUENCY_LABELS: Record<FeeFrequency, string> = {
  one_time: "One-time",
  yearly: "Per year",
  half_yearly: "Per half-year / semester",
  quarterly: "Per quarter / term",
  monthly: "Per month",
};

export const PAYMENTS_PER_YEAR: Record<FeeFrequency, number> = {
  one_time: 1,
  yearly: 1,
  half_yearly: 2,
  quarterly: 4,
  monthly: 12,
};

export const ADMISSION_TYPES = [
  "new",
  "continuing",
  "management_quota",
  "rte_ews",
  "other",
] as const;
export type AdmissionType = (typeof ADMISSION_TYPES)[number];

export const ADMISSION_TYPE_LABELS: Record<AdmissionType, string> = {
  new: "New admission",
  continuing: "Continuing student",
  management_quota: "Management quota",
  rte_ews: "RTE / EWS seat",
  other: "Other",
};

// Fee items that may break existing rules. Wording on the site always says
// "may be questionable", never "illegal".
export const FLAG_KINDS = [
  "donation_capitation",
  "no_receipt",
  "forced_purchase",
  "fee_on_rte_seat",
  "refund_refused",
  "unapproved_hike",
] as const;
export type FlagKind = (typeof FLAG_KINDS)[number];

export const FLAG_LABELS: Record<FlagKind, string> = {
  donation_capitation: "Donation / capitation demanded",
  no_receipt: "Cash only or no receipt",
  forced_purchase: "Must buy books / uniform from the institution",
  fee_on_rte_seat: "Fee charged on an RTE / EWS seat",
  refund_refused: "Refund refused",
  unapproved_hike: "Hike without notice or approval",
};

export const EVIDENCE_KINDS = ["receipt", "circular", "message", "other"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  receipt: "Receipt",
  circular: "Circular / fee notice",
  message: "Message / chat",
  other: "Other document",
};

export type Institution = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  type: InstitutionType;
  city: string;
  state: string;
  board: string | null;
  createdAt: string;
};

export type FeeComponent = {
  kind: FeeKind;
  label: string | null;
  amount: number; // rupees, per payment
  frequency: FeeFrequency;
};

export type Flag = {
  kind: FlagKind;
  note: string | null;
};

export type Evidence = {
  id: string;
  kind: EvidenceKind;
  mimeType: string;
  size: number;
};

// The structured fields of a report, as produced by AI and edited by the reporter.
export type ReportFields = {
  academicYear: string | null; // "2026-27"
  classOrCourse: string | null; // "Grade 1", "B.Tech CSE" — never a section
  admissionType: AdmissionType | null;
  components: FeeComponent[];
  reportedTotal: number | null; // rupees, as the reporter stated it
  hikePercent: number | null;
  flags: Flag[];
};

export type Report = ReportFields & {
  id: string;
  institutionId: string;
  username: string;
  originalText: string;
  evidence: Evidence[];
  meTooCount: number;
  createdAt: string;
  updatedAt: string;
};

// Institution details as entered by the reporter or recognised by AI.
export type InstitutionInput = {
  name: string;
  type: InstitutionType;
  city: string;
  state: string;
  board: string | null;
};

export type ReportWithInstitution = Report & { institution: Institution };

// The small slice of an institution the browser needs for choosing one.
export type InstitutionOption = Pick<Institution, "id" | "slug" | "name" | "city" | "state" | "type">;
