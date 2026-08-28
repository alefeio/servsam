import { CONTENT_ACCESS_DATE } from "@/lib/content/constants";
import type { ContentProvenance, SourceType } from "@/types/provenance";

type ProvenanceInput = {
  sourceType: SourceType;
  sourceUrl?: string;
  notes?: string;
  isFictional?: boolean;
  needsClientValidation?: boolean;
  accessedAt?: string;
};

export function createProvenance(input: ProvenanceInput): ContentProvenance {
  const isFictional =
    input.isFictional ?? input.sourceType === "DEMO_FICTIONAL";
  const needsClientValidation =
    input.needsClientValidation ??
    input.sourceType === "PENDING_CLIENT_VALIDATION";

  return {
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    accessedAt: input.accessedAt ?? CONTENT_ACCESS_DATE,
    isFictional,
    needsClientValidation,
    notes: input.notes,
  };
}

export function isFictionalContent(provenance: ContentProvenance): boolean {
  return provenance.isFictional || provenance.sourceType === "DEMO_FICTIONAL";
}

export function needsClientValidation(
  provenance: ContentProvenance,
): boolean {
  return provenance.needsClientValidation;
}

export function isVerifiedSource(provenance: ContentProvenance): boolean {
  return (
    provenance.sourceType === "VERIFIED_CURRENT_SITE" ||
    provenance.sourceType === "VERIFIED_PUBLIC_RECORD"
  );
}
