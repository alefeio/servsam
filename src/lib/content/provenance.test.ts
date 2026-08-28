import { describe, expect, it } from "vitest";
import {
  createProvenance,
  isFictionalContent,
  isVerifiedSource,
  needsClientValidation,
} from "@/lib/content/provenance";
import { contentProvenanceSchema } from "@/lib/content/schemas";

describe("content provenance", () => {
  it("classifies verified site content as non-fictional", () => {
    const provenance = createProvenance({
      sourceType: "VERIFIED_CURRENT_SITE",
      sourceUrl: "https://servsam.com.br/",
    });

    expect(isFictionalContent(provenance)).toBe(false);
    expect(isVerifiedSource(provenance)).toBe(true);
    expect(needsClientValidation(provenance)).toBe(false);
    expect(contentProvenanceSchema.parse(provenance).sourceType).toBe(
      "VERIFIED_CURRENT_SITE",
    );
  });

  it("marks public records as needing validation when requested", () => {
    const provenance = createProvenance({
      sourceType: "VERIFIED_PUBLIC_RECORD",
      sourceUrl:
        "https://portaldatransparencia.gov.br/licitacoes/398193037/pessoa-juridica/21332050000146",
      needsClientValidation: true,
    });

    expect(isVerifiedSource(provenance)).toBe(true);
    expect(needsClientValidation(provenance)).toBe(true);
    expect(isFictionalContent(provenance)).toBe(false);
  });

  it("identifies demo fictional content", () => {
    const provenance = createProvenance({
      sourceType: "DEMO_FICTIONAL",
    });

    expect(isFictionalContent(provenance)).toBe(true);
    expect(provenance.isFictional).toBe(true);
  });
});
