"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";

export function CertificatesListView() {
  const { dataset } = useDemoDatasetStore();

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title="Certificados"
        description="Atestados para validar campos e layout. A emissão definitiva e o modelo oficial ainda não existem."
      />
      <ul className="space-y-3">
        {dataset.certificates.map((certificate) => {
          const client = dataset.clients.find((item) => item.id === certificate.clientId);
          return (
            <li key={certificate.id}>
              <Link href={`/demonstracao/certificados/${certificate.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-teal">
                <p className="font-medium text-navy">{certificate.number}</p>
                <p className="text-sm text-muted-foreground">
                  {client?.alias} · {certificate.status === "issued" ? "Emitido na demonstração" : "Prévia"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CertificateDetailView({ certificateId }: { certificateId: string }) {
  const { dataset } = useDemoDatasetStore();
  const certificate = dataset.certificates.find((item) => item.id === certificateId);
  if (!certificate) notFound();
  const client = dataset.clients.find((item) => item.id === certificate.clientId);
  const product = dataset.products.find((item) => item.id === certificate.productId);
  const workOrder = dataset.workOrders.find((item) => item.id === certificate.workOrderId);

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title={`Certificado ${certificate.number}`}
        description="Prévia para discutir campos. Não é o documento oficial da SERVSAM."
        backHref="/demonstracao/certificados"
        backLabel="Certificados"
      />
      <article className="space-y-3 rounded-xl border border-border bg-white p-6 text-sm">
        <p className="text-center text-xs tracking-[0.16em] text-amber-700 uppercase">
          Layout fictício · pendente de validação do cliente
        </p>
        <h2 className="text-xl font-semibold text-navy">{certificate.certificateType}</h2>
        <p><span className="text-muted-foreground">Número:</span> {certificate.number}</p>
        <p><span className="text-muted-foreground">Cliente:</span> {client?.legalName ?? client?.alias}</p>
        <p><span className="text-muted-foreground">Serviço:</span> {certificate.serviceName}</p>
        <p><span className="text-muted-foreground">OS:</span> {workOrder?.code}</p>
        <p><span className="text-muted-foreground">Data:</span> {certificate.issuedAt ?? "Ainda não emitido"}</p>
        <p><span className="text-muted-foreground">Validade:</span> {certificate.validUntil ?? "A definir com o cliente"}</p>
        <p><span className="text-muted-foreground">Produto:</span> {product?.tradeName ?? product?.name}</p>
        <p><span className="text-muted-foreground">Princípio ativo:</span> {product?.activeIngredient ?? "—"}</p>
        <p><span className="text-muted-foreground">Grupo químico:</span> {product?.chemicalGroup ?? "—"}</p>
        <p><span className="text-muted-foreground">Registro MS/ANVISA:</span> {product?.anvisaRegistration ?? "—"}</p>
        <div>
          <p className="text-muted-foreground">Licenças SERVSAM</p>
          <ul className="list-disc pl-5">
            {certificate.licenses.map((license) => (
              <li key={license}>{license}</li>
            ))}
          </ul>
        </div>
        <p>Responsável técnico: {certificate.technicalResponsible}</p>
        <p>Assinatura: espaço reservado na prévia.</p>
      </article>
      <Card>
        <CardHeader>
          <CardTitle>Status desta prévia</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {certificate.status === "draft"
            ? "O atestado está em rascunho visual. Aprovar o conjunto de campos antes de desenhar o PDF oficial."
            : "Marcado como emitido apenas dentro da demonstração."}
        </CardContent>
      </Card>
    </div>
  );
}
