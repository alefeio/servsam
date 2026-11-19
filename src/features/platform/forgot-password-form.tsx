"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/platform/auth-client";
import {
  GENERIC_PASSWORD_RESET_ACK,
  PASSWORD_RESET_PATH,
} from "@/lib/platform/password-reset";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "")
      .trim()
      .toLowerCase();
    setError(null);
    startTransition(async () => {
      // Path relativo: Better Auth resolve contra baseURL e evita mismatch localhost/127.0.0.1.
      const { error: requestError } = await authClient.requestPasswordReset({
        email,
        redirectTo: PASSWORD_RESET_PATH,
      });
      if (requestError) {
        setError("Não foi possível processar a solicitação. Tente novamente em instantes.");
        return;
      }
      setDone(true);
      form.reset();
    });
  }

  if (done) {
    return (
      <div className="space-y-5" role="status">
        <p className="text-sm text-muted-foreground">{GENERIC_PASSWORD_RESET_ACK}</p>
        <Link href="/sistema/login" className="text-sm font-medium text-navy underline-offset-4 hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="h-11"
          disabled={pending}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link de recuperação"}
      </Button>
      <Link href="/sistema/login" className="block text-center text-sm font-medium text-navy underline-offset-4 hover:underline">
        Voltar ao login
      </Link>
    </form>
  );
}
