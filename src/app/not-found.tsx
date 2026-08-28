import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col justify-center px-4 py-16">
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="mt-4 text-muted-foreground">
        O endereço solicitado não existe neste MVP. Use o menu para voltar às
        páginas institucionais ou à demonstração.
      </p>
    </main>
  );
}
