import { describe, expect, it } from "vitest";
import { homeContent, technicalDeliverables } from "@/data/official/home";
import { commercialProcessSteps } from "@/data/official/process";
import { services } from "@/data/official/services";
import { whyChooseItems } from "@/data/official/company";
import { contentRepository } from "@/lib/repositories/content-repository";

describe("public home positioning", () => {
  it("features six official services and leaves ETE and retrolavagem out of the catalog", () => {
    const featured = contentRepository.getFeaturedServices();
    expect(featured).toHaveLength(6);
    expect(featured.map((service) => service.id)).toEqual(homeContent.featuredServiceIds);
    const names = services.map((service) => service.name);
    expect(names.some((name) => /retrolavagem|\bete\b/i.test(name))).toBe(false);
  });

  it("ends the public journey at documented delivery", () => {
    expect(commercialProcessSteps.map((step) => step.order)).toEqual([1, 2, 3, 4, 5]);
    expect(commercialProcessSteps.at(-1)?.title).toBe("Documentamos a entrega");
    expect(commercialProcessSteps.at(-1)?.description.toLowerCase()).toContain("quando aplic");
  });

  it("keeps certificates and reports conditional", () => {
    const text = technicalDeliverables.map((item) => item.description.toLowerCase()).join(" ");
    expect(text).toContain("quando");
    expect(whyChooseItems.some((item) => item.title === "Variedade de serviços")).toBe(false);
  });
});
