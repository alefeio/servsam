# Sprint 11A: relatório de entrega

Branch `sprint-11a-persistent-core`. Árvore de trabalho sem commit. Nada foi feito em Production nem em `main`.

## Migração

`20261118160000_customers_proposals`: enum `ProposalStatus` e tabelas `customer`, `customer_contact`, `customer_unit`, `proposal`, `proposal_item`, `document_sequence`. Aditiva, sem alterar tabelas da Sprint 9.

## Arquivos

- Prisma: `prisma/schema.prisma` (reformatado pelo `prisma format`), migração acima.
- Domínio e serviços (`src/lib/platform/`): `br-document`, `money`, `dates`, `proposal-state`, `proposal-summary`, `nav`, `service-result`, `permission-error`, `customer-schemas`, `proposal-schemas`, `form-parsers`, `action-helpers`, `customers`, `proposals`, `customer-actions`, `proposal-actions`. Alterados: `audit.ts` (novas ações, escrita em transação), `access.ts`, `auth.ts`, `auth-url.ts`.
- Dados/UI: `src/data/platform/labels.ts`, `src/features/platform/*` (formulários, shell com navegação por permissão), páginas em `src/app/sistema/(app)/{clientes,orcamentos}` e o Painel em `page.tsx`.
- Testes: `persistent-core.test.ts`, `persistent-core.integration.test.ts`, `src/lib/db/test-guard.ts`, `e2e/sistema-core.spec.ts`, `e2e/production-auth.spec.ts` (título "Painel").
- Scripts: `scripts/lib/homol-env.mjs`, `preview-migrate.mjs`, `preview-test.mjs`, `preview-e2e.mjs`, `preview-db-identity.mjs`, mais os scripts da Gate 0. `package.json`: `db:preview:migrate`, `test:integration`, `test:e2e:preview`.
- Docs: `sprint-11a.md`, este relatório, `sprint-11a-contracts-11b-11c.md`, `docs/architecture/v1/persistence-transition.md`, `docs/product-backlog.md`.

## Resultados dos comandos

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sem erros |
| `npm run lint` | 0 erros, 2 avisos antigos nos scripts da Gate 0 |
| `npm test` | 111 passam, 15 de integração ignorados pela guarda, **8 falham** (ver abaixo) |
| `npm run test:integration` (HOMOL) | 15/15 |
| `npm run test:e2e:preview` (HOMOL) | `production-auth` e `sistema-core` passaram |
| `npm run build` | Passou na execução final, com todas as rotas novas listadas |

### Falhas existentes em `npm test`

As 8 falhas estão em `src/lib/demo/dataset-store.test.ts` (`window.localStorage` indefinido). Causa: o Node 26 expõe um `localStorage` global que sobrepõe o do jsdom. O arquivo passa com `NODE_OPTIONS=--no-experimental-webstorage`. Não alterei o arquivo porque envolve `/demonstracao`, fora do escopo. Sugestão: fixar o Node LTS no CI ou ajustar o setup de teste em sprint própria.

## Estado do HOMOL

Migração e seed aplicados no Preview HOMOL (seed idempotente, usuário inicial já existia). Resta no HOMOL um cliente "[E2E] Condomínio …" arquivado com um orçamento aceito, deixado pelo e2e. A UI não permite removê-los.

## Incidente: migração aplicada no banco legado (corrigido)

Na primeira execução, `preview-migrate.mjs` caiu para `RUNTIME_DATABASE_URL` de `.env.local`. A migração `20261118160000_customers_proposals` foi aplicada no **banco legado** (fundação `2026-10-22`, ligado a Production/Preview compartilhado).

**Rollback executado** com `node scripts/rollback-legacy-11a-migration.mjs`, após confirmar identidade (fundação 22/10, tabelas novas vazias). O legado voltou a ter só `20261022140103_platform_foundation`. O HOMOL mantém as duas migrations.

Correção preventiva: `scripts/lib/homol-env.mjs` e `preview-migrate.mjs` só leem `.env.gate0.preview.local` (HOMOL_*).

## Pontos de atenção

- `.cursor/rules/servsam-mvp.mdc` atualizado para refletir Gate 0 PASS e a Sprint 11A.
- `.env.gate0.preview.local` pode permanecer em disco (ignorado pelo git). Apague quando terminar.
- `vitest.setup.ts` força `localStorage` em memória (Node 26 + jsdom).
- Listagens limitadas a 200 registros, sem paginação.
- Sem PDF, envio ou anexos de orçamento.
- O backlog numera esta entrega como 11A sem renumerar a fila congelada.
