# 11B.2-QA — Readiness

**Status:** READY FOR HOMOL AUTHORIZATION  
**Branch:** `fix/11b-2-qa-readiness`  
**Remote SHA:** `123c66e0fda31fca66feba31cc7ade2373e5eb6d`  
**Base:** `feature/11b-2-service-orders` @ `288c49f`

## Banco descartável (anonimizado)

| Campo | Valor |
| --- | --- |
| database | `servsam_e2e` |
| hostHash | `7a0d370fac87` (`127.0.0.1:55432`) |
| instanceId | `58364a3ccc17` |
| container | `servsam-e2e-pg` (`postgres:16-alpine`) |

Migration `20261124010000_service_orders` **aplicada** neste banco. HOMOL **não** migrado.

## Evidência de testes (sem skip)

| Suíte | Resultado |
| --- | --- |
| `service-orders.test.ts` + `service-order-availability.test.ts` | 9 passed |
| `service-orders.integration.test.ts` (DATABASE_ENV=test + isolado) | 1 passed (execução efetiva) |
| lint | 0 |
| typecheck | 0 |
| build | 0 |
| `e2e/sistema-11b2.spec.ts` (next start + isolado) | **2 passed**, 0 skipped |

## Preflight HOMOL (somente leitura)

- hostHash `22e5c2dd2d93`, instanceId `0786bd682d75`, database `postgres`
- 11A + 11B.1 presentes; `service_order` **ausente**; migration 11B.2 **pendente**
- Grants `service_order.view/create/update` presentes nos 4 perfis semente
- Compatibilidade aditiva: OK

Comando documentado (não executado):

```bash
CONFIRM=YES DATABASE_ENV=preview node scripts/preview-migrate.mjs
```

## Correções desta QA

- Gate A: integração falha se tabela ausente (sem `it.skipIf` prematuro)
- Gate B: `urls.ts` + `proveE2eWriteIsolation` + Postgres Docker local
- Gate C: E2E jornada completa + fluxo O.C.
- Gate D: UI não mascara erro de OS como lista vazia
- Gate E: histórico cancelado + confirmação de reemissão

## Riscos remanescentes

1. Aplicar migration 11B.2 no HOMOL ainda exige autorização explícita.
2. E2E de escrita depende de Docker local saudável; Preview compartilhado continua só leitura/auth.
3. Server actions sob carga local já apresentaram flakiness em `next dev`; E2E isolado usa `next start`.
4. Sprint 11B.3 (agenda) não iniciada.
