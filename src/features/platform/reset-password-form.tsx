"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/platform/auth-client";
import { validateNewPassword } from "@/lib/platform/password-reset";

type ResetPasswordFormProps = {
  token: string | null;
  invalidReason?: "missing" | "invalid";
};

export function ResetPasswordForm({ token, invalidReason }: ResetPasswordFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token || invalidReason) {
    return (
      <div className="space-y-5" role="alert">
        <p className="text-sm text-destructive">
          Este link de recuperação é inválido ou expirou. Solicite um novo link.
        </p>
        <Link
          href="/sistema/esqueci-senha"
          className="text-sm font-medium text-navy underline-offset-4 hover:underline"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    startTransition(async () => {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: token!,
      });
      if (resetError) {
        setError("Não foi possível redefinir a senha. O link pode ter expirado.");
        return;
      }
      setDone(true);
      window.setTimeout(() => router.push("/sistema/login"), 1500);
    });
  }

  if (done) {
    return (
      <div className="space-y-5" role="status">
        <p className="text-sm text-muted-foreground">
          Senha redefinida. Faça login com a nova senha. Sessões anteriores foram encerradas.
        </p>
        <Link href="/sistema/login" className="text-sm font-medium text-navy underline-offset-4 hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          className="h-11"
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar nova senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
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
        {pending ? "Redefinindo..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
