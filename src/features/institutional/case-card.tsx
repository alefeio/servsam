import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoContentBanner } from "@/features/institutional/demo-content-banner";
import { ImagePlaceholder } from "@/features/institutional/image-placeholder";
import { FICTIONAL_CASE_LABEL } from "@/lib/content/constants";
import type { CaseStudy } from "@/types/content";

type CaseCardProps = {
  study: CaseStudy;
};

export function CaseCard({ study }: CaseCardProps) {
  return (
    <Card className="h-full">
      <ImagePlaceholder hint={study.imageHint} src={study.imageSrc} alt={study.imageAlt} compact />
      <CardHeader className="gap-3">
        <DemoContentBanner label={FICTIONAL_CASE_LABEL} />
        <p className="text-xs font-medium tracking-wide text-teal uppercase">
          {study.segment}
        </p>
        <CardTitle>{study.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">{study.clientAlias}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {study.summary}
        </p>
      </CardContent>
    </Card>
  );
}
