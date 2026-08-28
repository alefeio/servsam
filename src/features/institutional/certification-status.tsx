import { Badge } from "@/components/ui/badge";
import { CERTIFICATION_PENDING_LABEL } from "@/lib/content/constants";
import type { Certification } from "@/types/content";

type CertificationStatusProps = {
  certification: Certification;
};

export function CertificationStatus({
  certification,
}: CertificationStatusProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-heading text-base font-medium">
        {certification.name}
      </h3>
      <Badge variant="outline" className="mt-3 h-auto whitespace-normal py-1">
        {certification.statusLabel || CERTIFICATION_PENDING_LABEL}
      </Badge>
    </article>
  );
}
