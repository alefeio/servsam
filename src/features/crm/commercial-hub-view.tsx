"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";

const links = [
  {
    href: "/demonstracao/comercial/leads",
    title: "Leads",
    description: "Filtrar, qualificar e descartar contatos demonstrativos.",
  },
  {
    href: "/demonstracao/comercial/oportunidades",
    title: "Oportunidades",
    description: "Kanban comercial com avanço, perda e reabertura simulados.",
  },
  {
    href: "/demonstracao/comercial/propostas",
    title: "Orçamentos",
    description:
      "Aceite, solicitação financeira opcional e emissão de OS — sinal não bloqueia universalmente.",
  },
  {
    href: "/demonstracao/comercial/ordens-compra",
    title: "O.C. recebidas",
    description:
      "Documento do contratante (avulso, periódico ou sem orçamento interno). Distinto da OS.",
  },
  {
    href: "/demonstracao/clientes",
    title: "Clientes",
    description: "Ficha de cliente com múltiplas unidades e vínculos comerciais.",
  },
];

export function CommercialHubView() {
  return (
    <div className="space-y-6">
      <DemoPageHeader
        title="Comercial"
        description="Fluxo demonstrativo do lead ao orçamento aceito, O.C. recebida e OS. Ações simuladas no navegador — não é ERP persistente."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {links.map((link) => (
          <Card key={link.href}>
            <CardHeader>
              <CardTitle>{link.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{link.description}</p>
              <Link
                href={link.href}
                className="mt-4 inline-flex text-sm font-medium text-navy hover:text-teal"
              >
                Abrir módulo →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
