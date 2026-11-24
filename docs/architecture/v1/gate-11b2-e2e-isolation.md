# Gate 0 / 11B.2-QA — Isolamento E2E

## Decisão

E2E de escrita de `/sistema` **não** usa o HOMOL compartilhado de Preview (`host hash 22e5c2dd2d93`).

Banco descartável local via Docker (`scripts/isolated-postgres.mjs` → `postgres:16-alpine` em `127.0.0.1:55432`), sem infra paga adicional.

## Medidas

1. `DATABASE_ENV=test` + `E2E_ISOLATED_DATABASE_URL` + `E2E_ISOLATED_INSTANCE_ID` (+ fingerprint aprovado).
2. `getRuntimeDatabaseUrl` / `getMigrationDatabaseUrl` em `urls.ts` **exigem** a URL isolada quando `DATABASE_ENV=test` (Next/Prisma não caem no HOMOL).
3. `e2eWriteDatabaseGuard` + `proveE2eWriteIsolation` comprovam `instanceId` real (`sha256(system_identifier:current_database)[:12]`), recusam host hash HOMOL e a instância `HOMOL_APPROVED_INSTANCE_ID`.
4. Specs `sistema-core`, `sistema-11b1`, `sistema-11b2`: fora de `test` fazem skip; em `test` incompleto **falham** (não PASS por skip).
5. `scripts/run-isolated-qa.mjs` sobe o Postgres, aplica migrate/seed e roda integração + E2E.
6. Resíduos `[E2E]` / `[APRES]` no HOMOL **não** são limpos automaticamente.

## Comandos

```bash
node scripts/isolated-postgres.mjs up
node scripts/run-isolated-qa.mjs all
```

## HOMOL

Preflight somente leitura: `node scripts/preflight-11b2-qa-homol.mjs`.

Migrate HOMOL **não** faz parte desta entrega QA — exige autorização explícita.
