"use client";

import Link from "next/link";
import { DemoContentBanner } from "@/features/institutional/demo-content-banner";

type OperationsPageHeaderProps = {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
};

export function OperationsPageHeader({
  title,
  description,
  backHref,
  backLabel = "Voltar",
}: OperationsPageHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="text-sm text-muted-foreground hover:text-navy"
            >
              ← {backLabel}
            </Link>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
        <DemoContentBanner />
      </div>
      <p className="rounded-lg border border-teal/30 bg-secondary px-4 py-3 text-sm">
        Operação administrativa fictícia em desktop. Não há execução de campo,
        assinatura, fotos ou geolocalização nesta fase.
      </p>
    </div>
  );
}
