# Gate 0 (11B.2) — Isolamento E2E

## Decisão

Não há banco de teste isolado provisionado e autorizado além do HOMOL de Preview compartilhado (`host hash 22e5c2dd2d93`).

Criar nova infraestrutura paga **não** foi autorizado nesta sprint.

## Medidas

1. Guard `e2eWriteDatabaseGuard` (`src/lib/db/e2e-write-guard.ts`): E2E de escrita só com `DATABASE_ENV=test` + `E2E_ISOLATED_DATABASE_URL` + `E2E_ISOLATED_INSTANCE_ID`.
2. Specs autenticados de escrita (`e2e/sistema-11b1.spec.ts`, `e2e/sistema-11b2.spec.ts`) fazem **skip** quando o guard recusa.
3. `scripts/preview-e2e.mjs` deixa de forçar os specs de escrita 11B contra o HOMOL compartilhado.
4. Resíduos `[E2E]` já existentes no HOMOL **não** são limpos automaticamente.
5. Conta pessoal do cliente **não** é usada em automação.

## Evidência de domínio

Continua via testes de **integração** com organizações descartáveis no HOMOL (padrão 11A/11B.1), sem acumular fixtures APRES e com cleanup no `afterAll`.

## Impedimento

E2E autenticado de escrita permanece bloqueado até existir banco isolado aprovado (sem custo novo sem autorização).
