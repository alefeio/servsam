"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDemoSession } from "@/lib/demo/session-core";

type GuardPhase = "checking" | "authenticated" | "redirecting";

export function DemoAuthGuard({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GuardPhase>("checking");

  useEffect(() => {
    const session = getDemoSession();
    // Necessário após a hidratação: o HTML estático sempre mostra "checking".
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura de localStorage só no cliente
    setPhase(session ? "authenticated" : "redirecting");
  }, []);

  if (phase === "checking") {
    return <DemoAuthLoading message="Verificando sessão demonstrativa..." />;
  }

  if (phase === "redirecting") {
    return <RedirectToLogin />;
  }

  return <>{children}</>;
}

function DemoAuthLoading({ message }: { message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-muted text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function RedirectToLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/demonstracao/login");
  }, [router]);

  return <DemoAuthLoading message="Redirecionando para o login demonstrativo..." />;
}
