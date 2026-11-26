# Gate 11B.4 — HOMOL DEPLOY PASS (FIN-F0)

**Status:** **11B.4 HOMOL DEPLOY PASS**  
**Data/hora (execução):** 2026-11-25 ~22:19 America/Belem (migrations `finished_at` UTC 2026-11-26T01:19:15Z / 01:19:17Z)  
**Branch:** `fix/11b-4-finance-qa`  
**SHA utilizado:** `fac00f6cf8e56b107d27ee604741bbe23f9db0cd`  
**Executor:** `scripts/homol-migrate-11b4.mjs`

## Identidade do banco (anonimizada)

| Item | Valor |
|------|--------|
| DATABASE_ENV | `preview` |
| database | `postgres` |
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| Organização | `servsam` |
| CLI Prisma hostHash | `22e5c2dd2d93` |
| CLI Prisma database | `postgres` |
| CLI Prisma instanceId | `0786bd682d75` |

Sem connection strings ou credenciais neste relatório.

## Gate 1 — Preflight / plan

### Preflight (`node scripts/preflight-11b4-homol.mjs`)

- Exit: **0**
- Identidade e org: PASS
- Histórico 11B.1–11B.3: PASS
- Pendentes exatas: `20261125120000_finance_f0`, `20261125180000_finance_f0_requested_amount`
- Tabelas FIN-F0 ausentes antes do deploy: PASS
- Contagens pré (ativas): clientes 21, propostas 22, contratações 8, OS 2, users 2, audit_logs 369

### Plan (`node scripts/homol-migrate-11b4.mjs plan`)

- Exit: **0**
- `evaluation.ok`: **true**
- `blockers`: `[]`
- Identidade física da CLI Prisma: aprovada
- `willSeed` / `willReset` / `willGrant`: false

## Gate 2 — Deploy

Comando (sem secrets):

```bash
CONFIRM=YES \
MIGRATION_11B4_AUTHORIZE=YES \
MIGRATION_11B4_QA_AUTHORIZE=YES \
DATABASE_ENV=preview \
HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
node scripts/homol-migrate-11b4.mjs deploy
```

**DEPLOY_EXIT=0**

Migrations aplicadas nesta ordem:

1. `20261125120000_finance_f0`
2. `20261125180000_finance_f0_requested_amount`

## Gate 3 — Auditoria pós-migration

- `postAudit.ok`: **true**
- `issues`: `[]`
- `pendingAfter`: `[]`
- `seedExecuted`: false
- `grantsExecuted`: false
- Ambas em `_prisma_migrations` com `finished_at` e `rolled_back_at = null`
- Tabelas `billing_request` e `receipt_entry`: presentes
- Enums financeiros: presentes (pacote FIN-F0)
- FKs nominais (6):
  - `billing_request_organizationId_fkey`
  - `billing_request_engagementId_fkey`
  - `billing_request_customerId_fkey`
  - `receipt_entry_organizationId_fkey`
  - `receipt_entry_engagementId_fkey`
  - `receipt_entry_customerId_fkey`
- Índices únicos parciais de idempotência:
  - `billing_request_org_idempotency_unique`
  - `receipt_entry_org_idempotency_unique`
- `requestedAmountCents`: integer, NOT NULL
- Índice `receipt_entry_organizationId_confirmedAt_idx`: presente
- Identidade física preservada (hostHash / instanceId)

### Contagens comerciais (antes → depois)

| Métrica | Antes | Depois |
|---------|-------|--------|
| customers_total | 29 | 29 |
| customers_active | 21 | 21 |
| customers_archived | 8 | 8 |
| proposals_active | 22 | 22 |
| engagements_active | 8 | 8 |
| service_orders_active | 2 | 2 |
| users_total | 2 | 2 |
| audit_logs_total | 369 | 369 |

Inventário pós (RO): O.C. ativas 4, colaboradores ativos 2, agendamentos ativos 4; FIN-F0 vazio (`billing_requests=0`, `receipt_entries=0`).

### Permissões (inalteradas)

| Papel | Chaves |
|-------|--------|
| ADMINISTRATIVO | contract.manage, contract.view |
| GERENCIA | contract.manage, contract.view |
| FINANCEIRO | contract.manage, contract.view, finance.manage, finance.view |
| DIRETORIA | contract.manage, contract.view, finance.manage, finance.view |

Sem seed e sem grants nesta execução.

## Gate 4 — Smoke sem escrita

- Consultas RO às tabelas FIN-F0: OK (vazias)
- `service_order` / `service_appointment` presentes: OK
- Contagens comerciais/OS/agenda/colaboradores preservadas: OK
- Preview protegido: https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app — **READY** (auth Vercel)
- Não houve cadastro fiscal, recebimento, confirmação fictícia nem E2E de escrita no HOMOL

## Riscos / pendências

- Homologação operacional com escrita (solicitar NF / informar recebimento / confirmar) ainda não executada — requer autorização própria.
- Preview continua protegido; validação UI autenticada fica para o aceite operacional.
- FIN-F1 e demais fases não iniciados.

## Escopo excluído (cumprido)

Seed, reset, grants, limpeza, Production, merge `main`, rollback automático, E2E de escrita no HOMOL.

---

**11B.4 HOMOL DEPLOY PASS**
