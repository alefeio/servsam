# Gate 11B.4 FINAL QA — Fechamento antes de HOMOL

**Status:** READY FOR HOMOL AUTHORIZATION  
**Branch:** `fix/11b-4-finance-qa`  
**HEAD base:** `0767c281bc1e38d303e4d6edea51f18270b9854d`  
**SHA funcional:** (após commit)  
**Preview:** https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app

## Pendências corrigidas

### Gate 1 — Parser monetário único
`ConfirmReceiptForm` usa `parseBrlToCents`; a prévia exibida é o mesmo valor enviado em `confirmedAmountCents`.

### Gate 2 — Idempotência vinculada ao conteúdo
Reenvio idêntico (mesma chave + mesmos campos normalizados) retorna o registro existente sem novo audit.  
Reutilização da chave com conteúdo diferente → conflito explícito, sem gravação/alteração/auditoria.

Campos de identidade:
- Billing: engagement, descrição, notas, valor de referência.
- Receipt: engagement, tipo, valor solicitado, data de referência, forma, proofReference, notas.

### Gate 3 — Consistência do painel
Listagem sem status específico usa `OR` por status:
- pendente / rejeitado / cancelado → `referenceDate`
- confirmado / revertido → `confirmedAt`

Confirmação em 30/11 com referência 20/11 aparece na consulta do dia 30/11.

### Gate 4 — Executor / preflight
Ordem autorizada:
1. `20261125120000_finance_f0`
2. `20261125180000_finance_f0_requested_amount`

Pós-auditoria exige 5 enums, 6 FKs nominais, 2 índices únicos parciais de idempotência, `requestedAmountCents` integer NOT NULL, índice `confirmedAt`, ambas migrations finalizadas, contagens preservadas.  
Probe da CLI: hostHash + database + instanceId físicos (`print-migration-url-identity.ts`).

## Evidências de teste (Docker isolado)

| Gate | Resultado |
|------|-----------|
| lint | PASS |
| typecheck | PASS |
| unitários | PASS — ver contagem no commit |
| integração | PASS (idempotência conflito, concorrência, painel 30/11) |
| E2E | PASS |
| build | PASS |
| Preflight HOMOL RO | PASS (duas migrations pendentes; tabelas ausentes) |

## Testes skipped

Em `npm test` (sem banco isolado), ~30 testes de **integração** ficam skipped via `describe.skipIf(!integrationDatabaseGuard().allowed)` — exigem `DATABASE_ENV=test` + URL Docker isolada. São executados em `node scripts/run-isolated-qa.mjs integration`.

## Preflight HOMOL (somente leitura)

| Item | Valor |
|------|--------|
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| org | `servsam` |
| Pendentes | `finance_f0` + `finance_f0_requested_amount` |
| Tabelas FIN-F0 | ausentes |
| Deploy | **não** executado |

## Restrições respeitadas

Sem migration/seed/grants/reset HOMOL; sem merge `main`; sem Production; sem alteração `/demonstracao`.

---

**11B.4 FINAL QA PASS — READY FOR HOMOL AUTHORIZATION**
