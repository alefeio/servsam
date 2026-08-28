import type { Metadata } from "next";
import { InventoryProductDetailView } from "@/features/management/inventory-product-detail-view";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { pageTitle } from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return seedDemoDataset.products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = seedDemoDataset.products.find((item) => item.id === id);
  return {
    title: pageTitle(product?.name ?? "Produto"),
    robots: { index: false, follow: false },
  };
}

export default async function InventoryProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  return <InventoryProductDetailView productId={id} />;
}
