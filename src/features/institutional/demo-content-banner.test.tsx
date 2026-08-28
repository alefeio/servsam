import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DemoContentBanner } from "@/features/institutional/demo-content-banner";

describe("DemoContentBanner", () => {
  it("shows the demonstrative data label", () => {
    render(<DemoContentBanner />);
    expect(screen.getByText("Dados demonstrativos")).toBeInTheDocument();
  });
});
