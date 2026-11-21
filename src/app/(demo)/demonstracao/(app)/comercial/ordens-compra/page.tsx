import type { Metadata } from "next";
import { PurchaseOrdersListView } from "@/features/crm/purchase-orders-list-view";

export const metadata: Metadata = {
  title: "O.C. recebidas | Demonstração SERVSAM",
  description:
    "Ordens de compra recebidas do contratante na demonstração — distintas do orçamento e da OS.",
};

export default function DemoPurchaseOrdersPage() {
  return <PurchaseOrdersListView />;
}
