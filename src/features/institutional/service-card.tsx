import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlaceholder } from "@/features/institutional/image-placeholder";
import type { Service } from "@/types/content";

type ServiceCardProps = {
  service: Service;
};

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="h-full">
      <ImagePlaceholder
        hint={service.imageHint}
        src={service.imageSrc}
        alt={service.imageAlt}
        compact
      />
      <CardHeader>
        <CardTitle>
          <Link
            href={`/servicos/${service.slug}`}
            className="hover:text-teal focus-visible:text-teal"
          >
            {service.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {service.summary}
        </p>
        <Link
          href={`/servicos/${service.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:text-teal"
        >
          Ver serviço
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
