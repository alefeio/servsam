"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import {
  canIssueWorkOrderFromPurchaseOrder,
  createWorkOrderFromPurchaseOrder,
} from "@/lib/demo/operations-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";

const KIND_LABELS = {
  avulso: "Avulso (com orçamento)",
  periodico: "Contrato periódico",
  "oc-direta": "O.C. sem orçamento interno",
} as const;

export function PurchaseOrdersListView() {
  const { dataset, mutate } = useDemoDatasetStore();

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title="Ordens de compra recebidas"
        description="Documento enviado pelo contratante. Distinto do orçamento SERVSAM e da OS de execução. Eventos simulados no navegador."
        backHref="/demonstracao/comercial"
        backLabel="Comercial"
      />

      <p className="rounded-md border border-dashed border-teal/50 px-3 py-2 text-sm text-muted-foreground">
        Orçamento SERVSAM ≠ O.C. do cliente ≠ OS interna. Dados demonstrativos — sem ERP
        persistente.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {dataset.receivedPurchaseOrders.map((purchaseOrder) => {
          const client = dataset.clients.find(
            (item) => item.id === purchaseOrder.clientId,
          );
          const linkedWorkOrder = dataset.workOrders.find(
            (item) =>
              item.id === purchaseOrder.workOrderId ||
              item.purchaseOrderId === purchaseOrder.id,
          );
          const issueCheck = canIssueWorkOrderFromPurchaseOrder(
            dataset,
            purchaseOrder.id,
          );

          return (
            <Card key={purchaseOrder.id}>
              <CardHeader>
                <CardTitle className="text-base">{purchaseOrder.code}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{client?.alias ?? purchaseOrder.clientId}</p>
                <p className="text-muted-foreground">{purchaseOrder.serviceName}</p>
                <p>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  {KIND_LABELS[purchaseOrder.engagementKind]}
                </p>
                <p>
                  <span className="text-muted-foreground">Recebida em:</span>{" "}
                  {purchaseOrder.receivedAt.split("-").reverse().join("/")}
                </p>
                <p>
                  <span className="text-muted-foreground">Valor:</span>{" "}
                  {formatCurrencyBrl(purchaseOrder.amount)}
                </p>
                <p className="text-muted-foreground">{purchaseOrder.note}</p>
                {purchaseOrder.withoutInternalProposal ? (
                  <p className="rounded-md bg-secondary px-3 py-2 text-xs">
                    Sem orçamento interno prévio obrigatório neste cenário.
                  </p>
                ) : null}
                {purchaseOrder.proposalId ? (
                  <p>
                    <Link
                      href={`/demonstracao/comercial/propostas/${purchaseOrder.proposalId}`}
                      className="text-navy hover:text-teal"
                    >
                      Ver orçamento vinculado
                    </Link>
                  </p>
                ) : null}
                {purchaseOrder.contractId ? (
                  <p>
                    <Link
                      href={`/demonstracao/contratos/${purchaseOrder.contractId}`}
                      className="text-navy hover:text-teal"
                    >
                      Ver contrato vinculado
                    </Link>
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  {linkedWorkOrder ? (
                    <Link
                      href={`/demonstracao/ordens-servico/${linkedWorkOrder.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-navy px-4 text-sm font-medium text-white hover:bg-navy/90"
                    >
                      Abrir OS {linkedWorkOrder.code}
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      disabled={!issueCheck.ok}
                      onClick={() =>
                        mutate((current) =>
                          createWorkOrderFromPurchaseOrder(current, purchaseOrder.id),
                        )
                      }
                    >
                      Emitir OS a partir da O.C.
                    </Button>
                  )}
                </div>
                {!linkedWorkOrder && !issueCheck.ok && issueCheck.reason ? (
                  <p className="text-muted-foreground">{issueCheck.reason}</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
