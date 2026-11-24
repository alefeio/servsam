# 11B.2 — HOMOL DEPLOY PREPARED

**Status:** `11B.2 HOMOL DEPLOY PREPARED`  
**Branch:** `fix/11b-2-qa-readiness`  
**Executor:** `scripts/homol-migrate-11b2.mjs`  
**Migration exata:** `20261124010000_service_orders`  
**Pendentes no HOMOL (preflight):** **1** (`20261124010000_service_orders`)  
**Seed / reset / rollback:** nunca  
**Deploy executado:** não

## Validação de bloqueios (Etapa 2)

| Cenário | Resultado |
| --- | --- |
| Deploy sem `CONFIRM`/`AUTHORIZE` | blocked |
| `HOMOL_APPROVED_INSTANCE_ID` divergente | blocked (exit 2) |
| `VERCEL_ENV=production` | blocked |
| `preview-migrate.mjs` sem subcomando | blocked |
| Unitários do plano | 9 passed |
| `plan` no HOMOL aprovado | ok · pendingCount=1 |

## Comando seguro (ainda não executar sem autorização humana)

```bash
CONFIRM=YES MIGRATION_11B2_AUTHORIZE=YES DATABASE_ENV=preview HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 node scripts/homol-migrate-11b2.mjs deploy
```

Plano somente leitura:

```bash
DATABASE_ENV=preview HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 node scripts/homol-migrate-11b2.mjs plan
```

## Verificação posterior (após deploy autorizado)

1. `_prisma_migrations` contém `20261124010000_service_orders` com `finished_at` e sem `rolled_back_at`.
2. `to_regclass('public.service_order')` presente; índices/constraints da migration.
3. Contagens de `customer` / `proposal` / `engagement` / `received_purchase_order` preservadas.
4. Login em `/sistema` no Preview; emissão de **uma** OS de teste identificada (não rodar E2E de escrita no HOMOL compartilhado).
5. `node scripts/preflight-11b2-qa-homol.mjs` deve mostrar `migration11b2Pending: false`.

## Não fazer

- `node scripts/preview-migrate.mjs` sem subcomando (bloqueado).
- `preview-migrate.mjs all` (traz seed).
- Production / merge main / Sprint 11B.3.
