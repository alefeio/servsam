"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { ManagementPageHeader } from "@/features/management/management-page-header";
import {
  filterProductsBelowMinimum,
  filterProductsNearExpiry,
} from "@/lib/demo/management-actions";

type InventoryFilter = "all" | "below_minimum" | "near_expiry";

export function InventoryListView() {
  const { dataset } = useDemoDatasetStore();
  const [filter, setFilter] = useState<InventoryFilter>("all");

  const belowMinimum = filterProductsBelowMinimum(dataset);
  const nearExpiry = filterProductsNearExpiry(dataset);

  const products =
    filter === "below_minimum"
      ? belowMinimum
      : filter === "near_expiry"
        ? nearExpiry
        : dataset.products;

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        title="Estoque"
        description="Saldo, mínimo, validade e movimentações fictícias vinculadas a ordens de serviço."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abaixo do mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{belowMinimum.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Produtos com saldo igual ou inferior ao mínimo demonstrativo.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Validade próxima</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{nearExpiry.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Produtos com vencimento em até 60 dias (referência demo).
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "all" as const, label: "Todos" },
          { value: "below_minimum" as const, label: "Abaixo do mínimo" },
          { value: "near_expiry" as const, label: "Validade próxima" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === item.value
                ? "bg-navy text-white"
                : "bg-secondary text-muted-foreground hover:text-navy"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{products.length} produtos listados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Produto</th>
                  <th className="py-2 pr-4 font-medium">Categoria</th>
                  <th className="py-2 pr-4 font-medium">Saldo</th>
                  <th className="py-2 pr-4 font-medium">Mínimo</th>
                  <th className="py-2 pr-4 font-medium">Validade</th>
                  <th className="py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLow = product.stockQuantity <= product.minimumStock;
                  return (
                    <tr key={product.id} className="border-b border-border/70">
                      <td className="py-3 pr-4 font-medium">{product.name}</td>
                      <td className="py-3 pr-4">{product.category}</td>
                      <td className="py-3 pr-4">
                        {product.stockQuantity} {product.unit}
                        {isLow ? (
                          <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                            Alerta
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        {product.minimumStock} {product.unit}
                      </td>
                      <td className="py-3 pr-4">{product.expiryDate ?? "—"}</td>
                      <td className="py-3">
                        <Link
                          href={`/demonstracao/estoque/${product.id}`}
                          className="font-medium text-navy hover:text-teal"
                        >
                          Detalhe
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
