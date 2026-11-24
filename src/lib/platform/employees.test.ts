import { describe, expect, it } from "vitest";
import { employeeInputSchema } from "@/lib/platform/employee-schemas";

describe("schema de colaborador (11B.3A)", () => {
  it("exige nome e função", () => {
    expect(
      employeeInputSchema.safeParse({
        fullName: "Ana Técnica",
        jobTitle: "Técnica de campo",
      }).success,
    ).toBe(true);
    expect(
      employeeInputSchema.safeParse({
        fullName: "A",
        jobTitle: "Técnica",
      }).success,
    ).toBe(false);
  });

  it("valida e-mail profissional quando informado", () => {
    expect(
      employeeInputSchema.safeParse({
        fullName: "Bruno",
        jobTitle: "Auxiliar",
        email: "bruno@servsam.local",
      }).success,
    ).toBe(true);
    expect(
      employeeInputSchema.safeParse({
        fullName: "Bruno",
        jobTitle: "Auxiliar",
        email: "sem-arroba",
      }).success,
    ).toBe(false);
  });
});
