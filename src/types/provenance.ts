export const SOURCE_TYPES = [
  "VERIFIED_CURRENT_SITE",
  "VERIFIED_PUBLIC_RECORD",
  "BRIEFING_REQUIREMENT",
  "DEMO_FICTIONAL",
  "PENDING_CLIENT_VALIDATION",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export type ContentProvenance = {
  sourceType: SourceType;
  sourceUrl?: string;
  accessedAt: string;
  isFictional: boolean;
  needsClientValidation: boolean;
  notes?: string;
};

export type Provenanced<T> = T & {
  provenance: ContentProvenance;
};
