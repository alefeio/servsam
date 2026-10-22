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
        description="Nome comercial, princípio ativo, lote, validade e vínculo visual com a OS. A baixa de estoque não é transacional."
        backHref="/demonstracao/estoque"
        backLabel="Produtos"
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
            {product.tradeName ? (
              <p>
                <span className="text-muted-foreground">Nome comercial:</span> {product.tradeName}
              </p>
            ) : null}
            {product.activeIngredient ? (
              <p>
                <span className="text-muted-foreground">Princípio ativo:</span> {product.activeIngredient}
              </p>
            ) : null}
            {product.chemicalGroup ? (
              <p>
                <span className="text-muted-foreground">Grupo químico:</span> {product.chemicalGroup}
              </p>
            ) : null}
            {product.manufacturer ? (
              <p>
                <span className="text-muted-foreground">Fabricante:</span> {product.manufacturer}
              </p>
            ) : null}
            {product.anvisaRegistration ? (
              <p>
                <span className="text-muted-foreground">ANVISA/MS:</span> {product.anvisaRegistration}
              </p>
            ) : null}
            {product.antidote ? (
              <p>
                <span className="text-muted-foreground">Antídoto:</span> {product.antidote}
              </p>
            ) : null}
            {product.technicalSheet ? (
              <p>
                <span className="text-muted-foreground">Ficha técnica:</span> {product.technicalSheet}
              </p>
            ) : null}
            {product.fispq ? (
              <p>
                <span className="text-muted-foreground">FISPQ:</span> {product.fispq}
              </p>
            ) : null}
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
