# Gate 0 — Sprint 11A readiness

**Veredito: PASS** (2026-11-18)

Isolamento Preview ≠ Production comprovado. Migrations e seed só no banco HOMOL de Preview. Zero migration contra Production.

## Evidências (sem segredos)

| Cheque | Resultado |
| --- | --- |
| `DATABASE_ENV=preview` | Só no Preview (Config) |
| Store `servsam-preview` | Só Preview, prefixo `HOMOL_` |
| Store `servsam-prisma-postgres` | Ainda ligada a Preview+Production (legado); runtime/migrate em Preview preferem `HOMOL_*` |
| Fingerprints de store | Preview `d0f44652f4fd` ≠ Production `96b317dc8575` |
| Host HOMOL (direct) | `22e5c2dd2d93` |
| Host HOMOL (pooled, auth/probe) | `b43541727fc5` |
| `BETTER_AUTH_SECRET` | Entrada exclusiva Preview + entrada exclusiva Production |
| `BETTER_AUTH_URL` env | Ainda compartilhado no painel; runtime Preview ignora e usa `VERCEL_URL` |
| Redeploy Preview | `https://servsam-2h894k192-alefeios-projects.vercel.app` Ready |
| Login page Preview | HTTP 200, "Entrar no sistema", sem demo |
| Auth seed × HOMOL | `ok`, org presente, user ativo, `sessionDelta=1` |
| Prova negativa HOMOL | 1 user, 1 org, 4 roles, 11 tabelas públicas |

## Código de isolamento

- `src/lib/db/urls.ts` — com `DATABASE_ENV=preview`, runtime e migrate usam `HOMOL_*`
- `src/lib/platform/auth-url.ts` — Preview ignora `BETTER_AUTH_URL` de Production e confia no host do deployment

## Scripts de revalidação

- `node scripts/gate0-recheck.mjs`
- `node scripts/gate0-login-smoke.mjs` (requer `GATE0_PREVIEW_URL` e `SEED_*` em `.env.local`)

## Próximo passo

Branch `sprint-11a-persistent-core` a partir de `main`, Gates 1–8. Sem merge/promote Production.
