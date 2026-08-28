import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceCard } from "@/features/institutional/service-card";
import { services } from "@/data/official/services";

describe("ServiceCard", () => {
  it("links to the service detail page", () => {
    const service = services[0];
    render(<ServiceCard service={service} />);
    expect(
      screen.getByRole("link", { name: service.name }),
    ).toHaveAttribute("href", `/servicos/${service.slug}`);
  });
});
