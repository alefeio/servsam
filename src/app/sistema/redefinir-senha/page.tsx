import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteLogo } from "@/components/layout/site-logo";
import { ResetPasswordForm } from "@/features/platform/reset-password-form";
import { getAuthenticatedUser } from "@/lib/platform/access";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Redefinir senha"),
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser();
  if (user) redirect("/sistema");

  const params = await searchParams;
  const token = params.token?.trim() || null;
  const invalidReason =
    params.error === "INVALID_TOKEN" ? ("invalid" as const) : token ? undefined : ("missing" as const);

  return (
    <main
      id="conteudo-principal"
      className="flex min-h-screen items-center justify-center bg-muted px-4 py-12"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-none">
        <SiteLogo className="mb-6" />
        <h1 className="text-2xl font-semibold text-navy">Redefinir senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha uma nova senha para a sua conta. Depois será necessário entrar novamente.
        </p>
        <div className="mt-6">
          <ResetPasswordForm token={token} invalidReason={invalidReason} />
        </div>
      </div>
    </main>
  );
}
