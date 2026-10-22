import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/platform/access";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Sistema"),
  robots: { index: false, follow: false },
};

export default async function ProductionHomePage() {
  const user = await requireAuthenticatedUser();

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Fundação do sistema</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        A sessão é do servidor. Os módulos de clientes, propostas, agenda e ordens de
        serviço entram nas próximas sprints. A demonstração continua em outro endereço.
      </p>
      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Organização</dt>
          <dd className="font-medium">SERVSAM</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Papéis desta conta</dt>
          <dd className="font-medium">{user.roleCodes.join(", ") || "Nenhum"}</dd>
        </div>
      </dl>
    </section>
  );
}
