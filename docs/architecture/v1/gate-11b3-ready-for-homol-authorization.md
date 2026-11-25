# 11B.3 FINAL QA PASS — READY FOR HOMOL AUTHORIZATION

**Branch:** `fix/11b-3-acceptance`  
**Migration aditiva:** `prisma/migrations/20261124180000_employees_appointments`  
**Preview:** (atualizar após publish do SHA)

## Correções finais (antes da autorização HOMOL)

1. **Concorrência** — `pg_advisory_xact_lock` por organização+colaborador antes de recalcular conflitos e gravar; impede conflito silencioso entre OS distintas.
2. **Aceite vinculado** — token `conflictToken` amarra colaborador, janela solicitada e conjunto atual de conflitos (id + horários + código OS); qualquer mudança exige novo aceite.
3. **Executor HOMOL** — `scripts/homol-migrate-11b3.mjs` verifica hostHash da CLI Prisma, exige exatamente uma pendente, audita `_prisma_migrations.finished_at`, tabelas, enum, FKs, índice único parcial e contagens; diferencia falha de migrate (exit 1) de falha de auditoria (exit 3). Sem seed/grants/reset/rollback.
4. **Grade 06h–22h** — aviso visível + link para lista completa quando há compromissos fora da faixa.

## Evidências de QA (local)

| Gate | Resultado |
|------|-----------|
| lint | PASS |
| typecheck | PASS |
| unitários | PASS (200) |
| integração isolada Docker (OS + agenda + concorrência) | PASS (3) |
| build | (ver pipeline desta entrega) |
| E2E isolado | (ver pipeline desta entrega) |
| preflight HOMOL somente leitura | PASS |
| migrate plan HOMOL | `evaluation.ok=true`, deploy **não** executado |

## Preflight HOMOL (somente leitura)

| Item | Valor |
|------|--------|
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| org | `servsam` |
| prismaCliHostHash | `22e5c2dd2d93` |
| Migration 11B.3 | **pendente** (única) |
| Tabelas employee / service_appointment | ausentes (esperado) |
| Clientes total / ativos / arquivados | 28 / 20 / 8 |
| Grant `employee.manage` ADMINISTRATIVO | ausente (plano pronto; **não** aplicar nesta entrega) |

## Comando preparado (não executar sem autorização)

```bash
CONFIRM=YES MIGRATION_11B3_AUTHORIZE=YES DATABASE_ENV=preview \
  HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
  node scripts/homol-migrate-11b3.mjs deploy
```

## Restrições respeitadas

Sem migrate HOMOL, sem alteração de permissões, sem seed, sem Production, sem merge `main`, sem 11B.4, sem drag-and-drop / Google Calendar.
