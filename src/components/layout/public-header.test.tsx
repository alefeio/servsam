import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicHeader } from "@/components/layout/public-header";
import { publicNavItems } from "@/data/official/navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("PublicHeader navigation", () => {
  it("renders all public routes", () => {
    render(<PublicHeader />);
    for (const item of publicNavItems) {
      expect(screen.getAllByRole("link", { name: item.label }).length).toBeGreaterThan(0);
    }
  });
});
