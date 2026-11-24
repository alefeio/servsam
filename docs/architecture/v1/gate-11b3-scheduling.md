# Sprint 11B.3 — Agenda operacional persistente

**Status:** READY FOR REVIEW  
**Branch:** `feature/11b-3-real-scheduling`  
**Base:** `a61630a2ecadce543b0b4a9bec9ab5a63a8acbdb`  
**SHA remoto:** `00416555dd6c9e715b227b40157830b0930cba6d`

## Modelos e migration

- `Employee` — colaborador operacional (não cria `User`/login)
- `ServiceAppointment` — compromisso vinculado à OS
- Enum `ServiceAppointmentStatus`: `scheduled` | `completed` | `cancelled`
- Migration aditiva: `prisma/migrations/20261124180000_employees_appointments`
- Índice único parcial: um `scheduled` vigente por `serviceOrderId`
- Aplicada **somente** no Docker `servsam_e2e` (hostHash `7a0d370fac87`)
- **Não** aplicada no HOMOL

## Rotas

| Rota | Função |
|------|--------|
| `/sistema/colaboradores` | Lista |
| `/sistema/colaboradores/novo` | Cadastro |
| `/sistema/colaboradores/[id]` | Detalhe/edição |
| `/sistema/agenda` | Dia / semana / mês + filtros |
| `/sistema/agenda/[id]` | Detalhe, remarcar, cancelar |
| `/sistema/ordens-servico/[id]` | Agendar / remarcar / cancelar |

## Serviços e transições

- `src/lib/platform/employees.ts`
- `src/lib/platform/appointments.ts`
- OS: `issued → scheduled` ao confirmar; remarcação mantém `scheduled`; cancelar vigente → `issued`; cancelar OS encerra agendamentos ativos na mesma transação
- Conflito de horário: alerta + `acceptConflict` auditado (não bloqueio universal)
- Persistência UTC; apresentação `America/Belem`

## Permissões

Chaves: `employee.view`, `employee.manage`, `schedule.view`, `schedule.create`, `schedule.update`  
Validação em páginas e Server Actions.

### Grants HOMOL (somente leitura)

| Papel | Faltando |
|-------|----------|
| DIRETORIA | — |
| GERENCIA | — |
| ADMINISTRATIVO | `employee.manage` |
| FINANCEIRO | `employee.manage` |

Correção futura: procedimento idempotente separado (sem seed nesta sprint).

## Testes executados

| Suite | Resultado |
|-------|-----------|
| lint / typecheck / build | PASS |
| unitários (incl. agenda/colaborador/OS) | PASS |
| integração isolada OS + agenda | PASS |
| E2E `e2e/sistema-11b3.spec.ts` (Docker) | PASS (1/1) |

Evidência E2E: jornada real login → 2 colaboradores → proposta → contratação → 2 OS → agendamento → views dia/semana/mês → conflito + confirmação → remarcação com motivo → cancelamento → OS `issued` → cancelar OS agendada → logout/login com persistência.

## Preflight HOMOL (somente leitura)

Script: `scripts/preflight-11b3-homol.mjs`  
Resultado: `docs/architecture/v1/gate-11b3-homol-preflight-result.json`

- hostHash `22e5c2dd2d93` ✓
- instanceId `0786bd682d75` ✓
- org `servsam` ✓
- 11B.2 registrada; 11B.3 **pendente**
- Contagens comerciais preservadas (sem alteração nesta entrega)
- `deployAuthorized: false`

## Publicação

- Sem merge em `main`
- Sem migration/seed HOMOL
- Sem arquivos APRES no commit
- Branch publicada: `origin/feature/11b-3-real-scheduling`
- Preview Vercel: **READY** (`Deployment has completed`, status GitHub `success`)
- Painel do deployment: https://vercel.com/alefeios-projects/servsam/BfK8nBuGkopRix3YP2XcKNVLkZsw
- Alias da branch (protegido): https://servsam-git-feature-11b-3-real-scheduling-alefeios-projects.vercel.app

## Riscos / pendências de implantação

1. Autorização explícita para `migrate deploy` da 11B.3 no HOMOL
2. Grants: conceder `employee.manage` a ADMINISTRATIVO (e decidir FINANCEIRO) via procedimento aprovado
3. Agenda visual é lista filtrável por período (não grade drag-and-drop)
4. Auditoria independente do SHA publicado antes da decisão HOMOL

## Restrições respeitadas

Sem Financeiro 11B.4, sem RH completo, sem Google Calendar, sem execução técnica fictícia, sem 11C.
