import type { Metadata } from "next";
import Link from "next/link";
import { SiteLogo } from "@/components/layout/site-logo";
import { LoginForm } from "@/features/demo-auth/login-form";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Login da demonstração"),
  description: "Acesso demonstrativo ao sistema interno da SERVSAM.",
  robots: { index: false, follow: false },
};

export default function DemoLoginPage() {
  return (
    <main
      id="conteudo-principal"
      className="flex min-h-screen items-center justify-center bg-muted px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium tracking-wide text-teal uppercase">
          Ambiente demonstrativo
        </p>
        <div className="mt-4 flex justify-center">
          <SiteLogo variant="vertical" surface="light" homeLabel="site institucional" />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold">Login da demonstração</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre como Direção ou Compliance para visualizar o shell do sistema.
          Não há segurança de produção nesta sessão.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-navy underline-offset-4 hover:underline">
            Voltar ao site institucional
          </Link>
        </p>
      </div>
    </main>
  );
}
