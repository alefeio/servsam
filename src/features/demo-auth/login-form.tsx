"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoCredentialProfiles, findDemoCredential } from "@/data/demo/auth";
import { saveDemoSession } from "@/lib/demo/session";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(demoCredentialProfiles[0].email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const profile = findDemoCredential(email, password);
    if (!profile) {
      setError("Use uma das credenciais demonstrativas exibidas nesta tela.");
      return;
    }

    saveDemoSession({
      email: profile.email,
      roleLabel: profile.roleLabel,
      signedInAt: new Date().toISOString(),
    });
    router.push("/demonstracao");
  }

  function fillProfile(profileEmail: string) {
    setEmail(profileEmail);
    setPassword("servsam-demo");
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-lg border border-teal/30 bg-secondary p-4 text-sm">
        <p className="font-medium text-navy">Credenciais demonstrativas</p>
        <ul className="mt-3 space-y-3">
          {demoCredentialProfiles.map((profile) => (
            <li key={profile.email} className="rounded-md border border-border/70 bg-card p-3">
              <p>
                <span className="text-muted-foreground">Perfil:</span> {profile.roleLabel}
              </p>
              <p>E-mail: {profile.email}</p>
              <p>Senha: {profile.password}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fillProfile(profile.email)}
              >
                Preencher {profile.roleLabel}
              </Button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-muted-foreground">
          Estas senhas não são segredos. A sessão fica apenas neste navegador e
          não representa autenticação de produção.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          className="h-11"
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          className="h-11"
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full">
        Entrar na demonstração
      </Button>
    </form>
  );
}
