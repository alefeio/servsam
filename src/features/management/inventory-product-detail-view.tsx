"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { ManagementPageHeader } from "@/features/management/management-page-header";
import { daysUntil } from "@/lib/demo/compliance-actions";
import { STOCK_MOVEMENT_LABELS, getProductMovements } from "@/lib/demo/management-actions";

type InventoryProductDetailViewProps = {
  productId: string;
};

function formatDateTime(dateIso: string): string {
  return new Date(dateIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InventoryProductDetailView({ productId }: InventoryProductDetailViewProps) {
  const { dataset } = useDemoDatasetStore();
  const product = dataset.products.find((item) => item.id === productId);

  if (!product) {
    notFound();
  }

  const movements = getProductMovements(dataset, productId);
  const isLow = product.stockQuantity <= product.minimumStock;
  const expiryDays = product.expiryDate ? daysUntil(product.expiryDate) : null;

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        title={product.name}
        description="Saldo, lote, validade e movimentações fictícias vinculadas a OS."
        backHref="/demonstracao/estoque"
        backLabel="Estoque"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saldo atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Quantidade:</span>{" "}
              {product.stockQuantity} {product.unit}
            </p>
            <p>
              <span className="text-muted-foreground">Mínimo:</span>{" "}
              {product.minimumStock} {product.unit}
            </p>
            <p>
              <span className="text-muted-foreground">Categoria:</span> {product.category}
            </p>
            {product.lotCode ? (
              <p>
                <span className="text-muted-foreground">Lote:</span> {product.lotCode}
              </p>
            ) : null}
            {product.expiryDate ? (
              <p>
                <span className="text-muted-foreground">Validade:</span>{" "}
                {product.expiryDate}
                {expiryDays !== null && expiryDays >= 0
                  ? ` (${expiryDays} dias)`
                  : expiryDays !== null && expiryDays < 0
                    ? " (vencido no demo)"
                    : ""}
              </p>
            ) : null}
            {isLow ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
                Saldo abaixo ou igual ao mínimo demonstrativo.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de movimentações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {movements.length} movimentações fictícias registradas para este produto,
            incluindo saídas vinculadas a ordens de serviço.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Data</th>
                  <th className="py-2 pr-4 font-medium">Tipo</th>
                  <th className="py-2 pr-4 font-medium">Quantidade</th>
                  <th className="py-2 pr-4 font-medium">OS</th>
                  <th className="py-2 font-medium">Observação</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-b border-border/70">
                    <td className="py-3 pr-4">{formatDateTime(movement.occurredAt)}</td>
                    <td className="py-3 pr-4">
                      {STOCK_MOVEMENT_LABELS[movement.type]}
                    </td>
                    <td className="py-3 pr-4">
                      {movement.quantity} {product.unit}
                    </td>
                    <td className="py-3 pr-4">
                      {movement.workOrderId ? (
                        <Link
                          href={`/demonstracao/ordens-servico/${movement.workOrderId}`}
                          className="text-navy hover:text-teal"
                        >
                          Abrir OS
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3">{movement.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
