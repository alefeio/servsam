"use client";

import { useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoProfiles } from "@/data/demo/demo-profiles";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
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
  const { dataset } = useDemoDatasetStore();
  const activeProfile = session
    ? demoProfiles.find((profile) => profile.email === session.email)
    : undefined;

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title="Configurações"
        description="Identidade visual, textos e modelos para a apresentação. Usuários e permissões reais ficam em /sistema e não são duplicados aqui."
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
          <CardTitle>Identidade e modelos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <p><span className="text-muted-foreground">Empresa:</span> SERVSAM — dados institucionais do site, ainda sem ficha editável.</p>
          <p><span className="text-muted-foreground">Logo:</span> arquivos já usados no topo. Troca de arquivo fica para depois da aprovação.</p>
          <p><span className="text-muted-foreground">Marca d&apos;água:</span> a prévia da proposta mostra um texto demonstrativo, não o selo oficial.</p>
          <p><span className="text-muted-foreground">Licenças e responsável técnico:</span> aparecem no certificado como pendentes de validação.</p>
          <p><span className="text-muted-foreground">Assinaturas:</span> espaço reservado no relatório e no certificado. Sem captura.</p>
          <p><span className="text-muted-foreground">Produtos e textos padrão:</span> o hipoclorito fictício e as condições da DEMO-005 são o exemplo.</p>
          <p className="md:col-span-2"><span className="text-muted-foreground">Usuários e permissões:</span> a administração real está em /sistema. Os cartões acima são só o perfil fictício desta demonstração.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Veículos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {dataset.vehicles.map((vehicle) => (
            <p key={vehicle.id}>
              {vehicle.internalCode} · {vehicle.kind} · {vehicle.model} · placa {vehicle.plate} · {vehicle.status}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsáveis técnicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {dataset.technicalResponsibles.map((responsible) => (
            <p key={responsible.id}>
              {responsible.name} · {responsible.education} · {responsible.council} {responsible.registration} · {responsible.specialty}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licenças e credenciamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {dataset.regulatoryCredentials.map((credential) => (
            <p key={credential.id}>
              {credential.organ} · {credential.kind} · {credential.number} · validade {credential.validUntil} · {credential.usedBy.join(", ")}
            </p>
          ))}
          <p className="text-muted-foreground">Números fictícios. O site público continua com as licenças pendentes de validação.</p>
        </CardContent>
      </Card>
    </div>
  );
}
