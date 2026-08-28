import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CertificationStatus } from "@/features/institutional/certification-status";
import { certifications } from "@/data/official/certifications";
import { CERTIFICATION_PENDING_LABEL } from "@/lib/content/constants";

describe("CertificationStatus", () => {
  it("shows pending documentary validation", () => {
    render(<CertificationStatus certification={certifications[0]} />);
    expect(screen.getByText(certifications[0].name)).toBeInTheDocument();
    expect(screen.getByText(CERTIFICATION_PENDING_LABEL)).toBeInTheDocument();
  });
});
