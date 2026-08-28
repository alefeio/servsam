import { describe, expect, it } from "vitest";
import { contactFormSchema, serviceSchema } from "@/lib/content/schemas";
import { services } from "@/data/official/services";

describe("service schema", () => {
  it("accepts every official service", () => {
    for (const service of services) {
      const parsed = serviceSchema.parse(service);
      expect(parsed.slug).toBe(service.slug);
      expect(parsed.provenance.needsClientValidation).toBe(true);
    }
  });
});

describe("contact form schema", () => {
  const valid = {
    name: "Ana Souza",
    company: "Condomínio Demo",
    phone: "91980545097",
    email: "ana@example.com",
    serviceType: "Desratização",
    city: "Belém",
    message: "Preciso de uma avaliação técnica do térreo.",
    consent: true as const,
  };

  it("accepts a complete request", () => {
    expect(contactFormSchema.parse(valid).email).toBe("ana@example.com");
  });

  it("rejects missing consent and short message", () => {
    const result = contactFormSchema.safeParse({
      ...valid,
      message: "oi",
      consent: false,
    });
    expect(result.success).toBe(false);
  });
});
