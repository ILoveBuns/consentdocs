export const fieldNames = [
  "party_name",
  "effective_date",
  "withdrawal_method",
  "contact_email",
] as const;

export type FieldName = (typeof fieldNames)[number];

export interface Citation {
  page: number;
  bounds: readonly [number, number, number, number];
  label: string;
}

export interface ExtractedField {
  name: FieldName;
  value: string | null;
  confidence: number | null;
  citations: readonly Citation[];
}

export interface ExtractionEnvelope {
  inputSha256: string;
  provider: "nutrient-dws" | "fixture";
  providerRequestId: string | null;
  fields: readonly ExtractedField[];
  signals?: {
    partyConflict: boolean;
  };
}

export type Decision = "auto_eligible" | "needs_review" | "rejected";

export interface PolicyResult {
  decision: Decision;
  reasons: readonly string[];
  fieldStatus: Readonly<Record<FieldName, "accepted" | "missing" | "low_confidence" | "invalid">>;
  resultHash: string;
}
