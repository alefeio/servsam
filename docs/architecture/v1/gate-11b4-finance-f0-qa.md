# Gate 11B.4 QA — Hardening FIN-F0

**Status:** READY FOR HOMOL AUTHORIZATION  
**Branch:** `fix/11b-4-finance-qa`  
**Base auditada:** `feature/11b-4-finance-f0` @ `5c2e5f5dff90f270baa505582e058b6753de8bcb`  
**SHA funcional:** `8f6d8bd9da7e376d4866237750be21ccde3cdfe2`  
**Preview protegido:** https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app

## Problemas corrigidos

1. **Concorrência na criação de recebimentos** — `createReceiptEntry` adquire `lockEngagementFinance` antes do cálculo de saldo; teste Docker com duas solicitações simultâneas de R$ 600,00 sobre R$ 1.000,00.
2. **Transições concorrentes** — process/cancel billing e confirm/reject/cancel/reverse receipt usam lock + `updateMany` condicional por status; sem auditoria de sucesso em transição perdida.
3. **Idempotência por intenção** — chave UUID por envio nos formulários; regenerada após sucesso; reenvio com a mesma chave retorna o mesmo registro sem novo audit.
4. **Parsers monetários** — `parseBrlToCents` / `parseConfirmedCentsField`; datas com calendário real; limites `America/Belem`.
5. **Confirmação parcial** — UI edita valor confirmado; `requestedAmountCents` preservado (migration QA); auditoria com ambos os valores.
6. **Indicadores** — agregações completas separadas das listas (`take: 200`); confirmados por `confirmedAt`; pendentes por `referenceDate`.
7. **Cancelamento** — solicitante cancela a própria; `finance.manage` cancela pendentes da org; outro `contract.manage` não cancela de terceiro.
8. **Executor HOMOL** — alinhado ao padrão 11B.3 (probe CLI, pós-auditoria, FKs/enums/índices, contagens); exige autorização explícita de **todas** as migrations pendentes (`MIGRATION_11B4_AUTHORIZE` + `MIGRATION_11B4_QA_AUTHORIZE`).

## Migrations

| Migration | Papel |
|-----------|--------|
| `20261125120000_finance_f0` | Modelos BillingRequest / ReceiptEntry |
| `20261125180000_finance_f0_requested_amount` | `requestedAmountCents` + índice `confirmedAt` |

Não aplicadas ao HOMOL nesta entrega.

## Evidências de teste (Docker isolado)

| Gate | Resultado |
|------|-----------|
| lint | PASS |
| typecheck | PASS |
| unitários | PASS — **178** passed / **30** skipped |
| integração isolada | PASS — **4** testes (OS + agenda + FIN-F0 QA) |
| E2E isolado | PASS — **4** (11B.2 + 11B.3 + 11B.4) |
| build | PASS (`DATABASE_ENV=development` local) |
| Preflight HOMOL read-only | preparado; não reexecutado nesta sessão (somente leitura autorizada) |

## Preflight HOMOL

| Item | Valor |
|------|--------|
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| Pendentes esperadas | `finance_f0` + `finance_f0_requested_amount` |
| Executor | `scripts/homol-migrate-11b4.mjs` (**não** executado) |

## Riscos remanescentes

- Preview HOMOL sem tabelas FIN-F0 até autorização de migrate.
- Confirmação parcial não gera parcela residual automática (deliberado).
- Listas do painel continuam limitadas a 200 (indicadores não).

## Escopo excluído

Migration/seed/grants HOMOL, Production, merge `main`, FIN-F1, RH, `/demonstracao`.

---

**11B.4 FIN-F0 QA PASS — READY FOR HOMOL AUTHORIZATION**
