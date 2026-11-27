# RELEASE-02 — Preparação somente leitura (acesso do cliente)

**Status:** **PASS** (documentação e inventário; sem alterações de infra/usuários)  
**CLIENT ACCESS:** **PENDING**  
**Data:** 2026-11-26  
**Branch:** `fix/11b-4-finance-qa` @ `e3c64f6…`  
**Referências:** `docs/sprints/sprint-11a-client-access-runbook.md`, `docs/sprints/homol-access-01-password-recovery.md`, `docs/architecture/v1/release-01-financial-operational-acceptance.md`

Nesta execução: **não** configurar domínio, DNS, Vercel, convites, usuários, grants, limpeza ou Production.

---

## 1. URL e proteção

| Item | Situação |
| --- | --- |
| URL de branch Preview | `https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app` |
| URL estável recomendada (curto prazo) | Preferir um **alias Preview fixo** ou deployment pinned acordado com o responsável — a URL `*.vercel.app` muda a cada deploy |
| `homol.<domínio-da-empresa>` | Alternativa futura **somente** se domínio disponível + DNS/Vercel autorizados |
| Deployment Protection | **Ativa** (Vercel Authentication). Não desabilitar |
| Isolamento Production | Production intacta; HOMOL = `DATABASE_ENV=preview` / hostHash `22e5c2dd2d93` / instanceId `0786bd682d75` |

O cliente precisa de **duas** autorizações: (1) e-mail na allowlist Vercel; (2) usuário Better Auth em `/sistema`.

---

## 2. Login SERVSAM e recuperação de senha

| Item | Situação |
| --- | --- |
| Login real `/sistema` | Disponível (Better Auth; `disableSignUp: true`) |
| Contas HOMOL atuais | 2 × DIRETORIA (`servsam.local` seed + conta `gmail.com` do responsável) |
| Recuperação de senha | Fluxo ACCESS-01 implementado (`/sistema/esqueci-senha`) |
| E-mail no Preview | `RESEND_API_KEY` + `RESEND_FROM_EMAIL` previstos no Preview (valores **não** expostos aqui). Remetente HOMOL típico: `onboarding@resend.dev` |
| Bloqueio residual | Entrega real de e-mail + aceite do convite Vercel exigem confirmação humana |

Procedimento detalhado: runbooks 11A e ACCESS-01.

---

## 3. Matriz de usuários do cliente (proposta)

Sujeita à confirmação do responsável. **Nenhuma conta criada nesta execução.**

### Diretoria

| | |
| --- | --- |
| Módulos | Painel, Clientes, Orçamentos, O.C., Contratações, OS, Agenda, Colaboradores, Financeiro, Usuários, Perfis (conforme UI) |
| Permitido | Consultar e administrar conforme grants DIRETORIA (`finance.manage`, `user.manage`, `employee.manage`, comercial, agenda, OS) |
| Proibido no piloto | Dados reais de clientes/produção; desligar proteção Vercel; emitir NF real |
| Permissões existentes | Amplas (ver inventário RELEASE-01) |
| Eventualmente necessárias | Nenhuma adicional para o roteiro básico |
| Provisionamento | Convite Vercel + criar usuário `/sistema` com papel Diretoria (operador `user.manage`) |
| Revogação | `isActive=false` + remover e-mail da Vercel |

### Administrativo

| | |
| --- | --- |
| Módulos | Comercial, OS, Agenda; Colaboradores (visualização) |
| Permitido | Clientes/orçamentos/contratações; solicitar providências fiscais; informar recebimento para conferência |
| Proibido | Confirmar/reverter recebimentos (`finance.manage` ausente); gerenciar usuários; emissão fiscal real |
| Permissões existentes | `contract.*`, `customer.*`, `proposal.*`, `service_order.*`, `schedule.*`, `employee.view` |
| Eventualmente necessárias | Se o piloto exigir cadastro de colaborador por este perfil: `employee.manage` (**decisão do responsável** — hoje ausente nos grants HOMOL) |
| Provisionamento | Mesmo fluxo (Vercel + usuário + papel ADMINISTRATIVO) |
| Revogação | Desativar usuário + revogar Vercel |

### Financeiro

| | |
| --- | --- |
| Módulos | Financeiro + consulta comercial necessária |
| Permitido | Acompanhar solicitações; confirmar / rejeitar / reverter recebimentos fictícios do piloto |
| Proibido | Tratar confirmação como banco real; emitir NF; gerenciar colaboradores (`employee.manage` ausente) |
| Permissões existentes | `finance.manage`, `finance.view`, comercial amplo |
| Eventualmente necessárias | Nenhuma para FIN-F0 |
| Provisionamento | Vercel + usuário + papel FINANCEIRO |
| Revogação | Idem |

### Gerência (se necessário)

| | |
| --- | --- |
| Módulos | Comercial, OS, Agenda, Colaboradores (gestão), sem Financeiro |
| Permitido | Operação comercial/agenda; `employee.manage` |
| Proibido | Confirmação financeira automática / `finance.*` |
| Permissões existentes | Sem `finance.view` / `finance.manage` |
| Provisionamento / revogação | Idem aos demais |

### Decisões

| Depende do cliente | Depende do responsável do projeto |
| --- | --- |
| Quais pessoas e e-mails individuais | Autorizar criação de usuários e grants |
| Quais perfis realmente usar no piloto | Confirmar se ADMINISTRATIVO precisa de `employee.manage` |
| Disponibilidade para aceitar convite Vercel | Escolher URL estável / alias |
| Aceite do roteiro e janela de teste | Autorizar RELEASE-03 e envio do link |

---

## 4. Inventário de dados fictícios no HOMOL

Leitura em 2026-11-26 (após RELEASE-01). **Não excluir / arquivar / limpar sem autorização.**

| Família | Exemplos / volume | Visível ao cliente? | Tratamento proposto |
| --- | --- | --- | --- |
| **E2E** | Muitos clientes `[E2E] …`, orçamentos e contratações de teste | Sim, nas listas | **Preservar**; filtrar por busca na UI se possível; arquivar só com autorização futura |
| **GATEF** | Clientes/orçamentos `[GATEF] …` | Sim | Preservar para auditoria de gates |
| **APRES** | 3 clientes demonstrativos + orçamentos `[APRES]` | Sim | Manter se forem úteis à apresentação; senão ocultar por filtro / arquivar depois |
| **HOMOL-QA-11B3** | Cliente + orçamento/contratação de agenda | Sim | Preservar (auditoria 11B.3) |
| **HOMOL-QA-11B4** | Empresa/orçamento/contratação + 1 billing + 1 receipt revertido | Sim | **Preservar** (auditoria RELEASE-01) |
| **Manuais / outros** | Resíduos sem prefixo claro (se houver) | Sim | Classificar na próxima varredura autorizada |
| **Indicadores** | Totais de clientes/propostas/contratações incluem ficção | Sim | Comunicar ao cliente que o ambiente é de homologação |

Resumo pós RELEASE-01: 30 clientes (22 ativos), 23 propostas, 9 contratações, 1 billing processado, 1 receipt revertido, 2 usuários.

---

## 5. Bloqueios reais vs melhorias opcionais

### Bloqueios reais para enviar o link ao cliente

1. Autorizar e **convidar e-mails individuais** na Vercel Authentication.  
2. Autorizar e **criar usuários** `/sistema` nos papéis acordados (hoje só DIRETORIA).  
3. Confirmar **URL** que será enviada (branch Preview vs alias estável).  
4. Confirmar que o cliente **aceitou** o convite Vercel e consegue abrir o login SERVSAM.  
5. Smoke humano hospedado: login → painel → um fluxo curto (fecha o HOSTED PREVIEW PENDING do RELEASE-01).  
6. Orientar o cliente com o checklist `servsam-v1-client-pilot-checklist.md`.

### Melhorias opcionais (não bloqueiam o piloto)

- Domínio `homol.<empresa>`.  
- Filtro dedicado “ocultar E2E/GATEF” na UI.  
- Arquivamento em massa de resíduos (exige autorização explícita).  
- Grants extras (ex.: `employee.manage` para ADMINISTRATIVO).  
- Troca de remetente Resend para domínio próprio.

---

## 6. Checklist objetivo para RELEASE-03 (CLIENT PILOT READY)

Não iniciar automaticamente. Quando autorizado:

- [ ] URL de homologação definida e testada  
- [ ] Deployment Protection permanece ativa  
- [ ] Convites Vercel aceitos pelos homologadores  
- [ ] Usuários `/sistema` criados (Diretoria / Administrativo / Financeiro [/ Gerência])  
- [ ] Senhas entregues só por canal seguro; recuperação de senha validada se necessário  
- [ ] Smoke hospedado PASS (fecha pendência do RELEASE-01)  
- [ ] Cliente informado de que o ambiente contém dados fictícios de teste  
- [ ] Checklist do piloto enviado  
- [ ] Critérios de revogação combinados (fim da janela)

---

## 7. Ações restantes para enviar o link (resumo executivo)

1. Responsável autoriza RELEASE-03 / provisionamento.  
2. Convidar e-mails na Vercel.  
3. Criar usuários e papéis no HOMOL.  
4. Fixar URL a enviar.  
5. Validar acesso hospedado uma vez.  
6. Enviar link + checklist + aviso de homologação (sem senhas em chat aberto).

**PRODUCTION: UNCHANGED** · **MAIN: UNCHANGED** · **NEW USERS: 0** · **GRANTS CHANGED: 0** · **MIGRATIONS EXECUTED: 0**
