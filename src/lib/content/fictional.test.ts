import { describe, expect, it } from "vitest";
import { isFictionalContent } from "@/lib/content/provenance";
import { demoCases } from "@/data/demo/cases";
import { demoArticles } from "@/data/demo/articles";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { services } from "@/data/official/services";

describe("fictional data identification", () => {
  it("marks cases, articles and demo dataset as fictional", () => {
    expect(demoCases.every((item) => isFictionalContent(item.provenance))).toBe(
      true,
    );
    expect(
      demoArticles.every((item) => isFictionalContent(item.provenance)),
    ).toBe(true);
    expect(isFictionalContent(seedDemoDataset.provenance)).toBe(true);
  });

  it("does not mark verified service names as fictional", () => {
    expect(services.every((item) => !isFictionalContent(item.provenance))).toBe(
      true,
    );
  });
});
