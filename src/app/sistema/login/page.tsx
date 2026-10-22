import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductionLoginForm } from "@/features/platform/production-login-form";
import { SiteLogo } from "@/components/layout/site-logo";
import { getAuthenticatedUser } from "@/lib/platform/access";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Entrar"),
  robots: { index: false, follow: false },
};

export default async function ProductionLoginPage() {
  const user = await getAuthenticatedUser();
  if (user) redirect("/sistema");

  return (
    <main id="conteudo-principal" className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-none">
        <SiteLogo className="mb-6" />
        <h1 className="text-2xl font-semibold text-navy">Entrar no sistema</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesso da equipe SERVSAM. Esta entrada é separada da demonstração.
        </p>
        <div className="mt-6">
          <ProductionLoginForm />
        </div>
      </div>
    </main>
  );
}
