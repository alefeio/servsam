import { ProductionShell } from "@/features/platform/production-shell";
import { requireAuthenticatedUser } from "@/lib/platform/access";

export default async function ProductionAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser();
  return <ProductionShell user={user}>{children}</ProductionShell>;
}
