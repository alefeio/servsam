"use client";

import { useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoProfiles } from "@/data/demo/demo-profiles";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";
import { getDemoSessionRaw, parseDemoSession, subscribeToDemoSession } from "@/lib/demo/session-core";

function useDemoSession() {
  const rawSession = useSyncExternalStore(
    subscribeToDemoSession,
    getDemoSessionRaw,
    () => null,
  );
  return parseDemoSession(rawSession);
}

export function SettingsView() {
  const session = useDemoSession();
  const activeProfile = session
    ? demoProfiles.find((profile) => profile.email === session.email)
    : undefined;

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title="Configurações"
        description="Representação de perfis e preferências do ambiente demonstrativo. Sem RBAC, banco ou autenticação de produção."
      />

      <Card>
        <CardHeader>
          <CardTitle>Sessão atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {session ? (
            <>
              <p>
                <span className="text-muted-foreground">Perfil:</span>{" "}
                {session.roleLabel}
              </p>
              <p>
                <span className="text-muted-foreground">E-mail:</span> {session.email}
              </p>
              <p>
                <span className="text-muted-foreground">Entrada:</span>{" "}
                {new Date(session.signedInAt).toLocaleString("pt-BR")}
              </p>
              {activeProfile ? (
                <p className="text-muted-foreground">{activeProfile.description}</p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">Nenhuma sessão demo ativa.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {demoProfiles.map((profile) => (
          <Card key={profile.id}>
            <CardHeader>
              <CardTitle>{profile.roleLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{profile.description}</p>
              <p>
                <span className="text-muted-foreground">Login demo:</span> {profile.email}
              </p>
              <div>
                <p className="mb-1 font-medium">Módulos representados</p>
                <ul className="list-inside list-disc text-muted-foreground">
                  {profile.modules.map((module) => (
                    <li key={module}>{module}</li>
                  ))}
                </ul>
              </div>
              {session?.email === profile.email ? (
                <p className="rounded-md bg-secondary px-3 py-2 text-navy">
                  Perfil ativo nesta sessão.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>O que não está configurável nesta fase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>Permissões reais por módulo (RBAC)</li>
            <li>Usuários, senhas ou políticas de segurança de produção</li>
            <li>Integrações fiscais, bancárias ou de e-mail</li>
            <li>Personalização de marca além dos logos já integrados</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
