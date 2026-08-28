"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_SESSION_STORAGE_KEY,
  parseDemoSession,
} from "@/lib/demo/session";

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSessionSnapshot() {
  return window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

function subscribeNever() {
  return () => {};
}

export function DemoAuthGuard({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const rawSession = useSyncExternalStore(
    subscribeToStorage,
    getSessionSnapshot,
    getServerSnapshot,
  );
  const session = parseDemoSession(rawSession);

  if (!isClient) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted text-sm text-muted-foreground">
        Verificando sessão demonstrativa...
      </div>
    );
  }

  if (!session) {
    return <RedirectToLogin />;
  }

  return <>{children}</>;
}

function RedirectToLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/demonstracao/login");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-muted text-sm text-muted-foreground">
      Redirecionando para o login demonstrativo...
    </div>
  );
}
