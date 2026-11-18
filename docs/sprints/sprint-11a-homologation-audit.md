# Sprint 11A — Auditoria final e Gate de Homologação

**Data:** 2026-11-18  
**Branch:** `sprint-11a-persistent-core`  
**Veredito:** ver seção 6 após publicação.

## 1. Incidente de migration — PASS

| Item | Evidência |
| --- | --- |
| Banco afetado | Store legado apontado por `RUNTIME_DATABASE_URL` de `.env.local` (fundação `2026-10-22T14:01:11.410Z`, org criada `2026-10-22`). Mesmo host Prisma (`hostHash` `22e5c2dd2d93`) que o HOMOL, mas database distinto (histórico e conteúdo diferentes). Finalidade: legado compartilhado Preview+Production (`servsam-prisma-postgres`). |
| Estruturas criadas pela migration | Enum `ProposalStatus`; tabelas `customer`, `customer_contact`, `customer_unit`, `proposal`, `proposal_item`, `document_sequence` + índices/FKs |
| Rollback | `scripts/rollback-legacy-11a-migration.mjs` (já executado). Segurança: só roda se fundação for 22/10 e tabelas 11A vazias; se já limpo, `alreadyClean` |
| Estado legado atual (read-only) | Só `20261022140103_platform_foundation`. Tabelas 11A ausentes. Sem tipo `ProposalStatus`, sem índices/constraints residuais. Fundação intacta (org/user/roles/audit presentes) |
| HOMOL | Fundações 18/11 + `20261118160000_customers_proposals` + `20261118193000_customer_document_active_unique` |
| Perda de dados | Tabelas 11A estavam vazias no legado no rollback (`count=0`). Contagens de fundação preservadas |
| Reexecução do rollback | Segura (no-op se limpo; recusa HOMOL) |

Script de auditoria: `node scripts/audit-db-read-only.mjs`.

## 2. Isolamento — PASS

| Destino | Resolução |
| --- | --- |
| Runtime Preview | Exige `HOMOL_*` quando `DATABASE_ENV=preview` (**fail-closed**, sem fallback para `RUNTIME_DATABASE_URL`) |
| Migrate/seed Preview | Idem via `HOMOL_*` + `scripts/lib/homol-env.mjs` (só `.env.gate0.preview.local`) |
| Production | Sem `DATABASE_ENV`; store legado; `BETTER_AUTH_SECRET` exclusivo |
| Auth Preview | `BETTER_AUTH_SECRET` Preview-only; runtime ignora `BETTER_AUTH_URL` compartilhado e usa `VERCEL_URL` |
| Stores | `servsam-preview` (Preview) ≠ `servsam-prisma-postgres` (legado) |

`node scripts/gate0-recheck.mjs` → `PASS_ENV`.

## 3. Código

- Modelos: `Customer`, `CustomerContact`, `CustomerUnit`, `Proposal`, `ProposalItem`, `DocumentSequence`
- Rotas: `/sistema/clientes/*`, `/sistema/orcamentos/*`, painel `/sistema`
- Serviços: `customers.ts`, `proposals.ts` + actions/schemas
- Permissões: `customer.*`, `proposal.*` via `requirePermission` / `assertCan`
- Hardening nesta auditoria: fail-closed HOMOL; `updateMany` com `organizationId`; archive atômico; UNIQUE parcial de documento ativo

## 4. Testes

| Suite | Resultado |
| --- | --- |
| lint | 0 erros |
| typecheck | ok |
| unit (`npm test`) | 120 passed, 15 skipped |
| integration HOMOL | 15/15 |
| e2e preview (`production-auth` + `sistema-core`) | passed (incl. unidade, reload, logout/login, 2ª sessão) |
| Gate F smoke (`gate-f-persistent-smoke.mts`) | ok (DB + auditoria + negação de permissão) |
| build | ok |

### 15 testes ignorados (unit sem HOMOL)

Arquivo `platform.integration.test.ts` (4) e `persistent-core.integration.test.ts` (11), via `describe.skipIf(!integrationDatabaseGuard().allowed)`:

1. rejects an unknown password without creating a session  
2. signs in an active user and records the audit  
3. blocks an inactive user with the same message  
4. authorizes by permission key, not by the role code  
5. cadastra cliente, valida documento, impede duplicado e audita  
6. isola por organização: outra organização não vê, não edita e não arquiva  
7. recusa ação sem a chave de permissão  
8. gerencia contatos e unidades com exclusão lógica  
9. calcula totais em centavos, numera e persiste o orçamento  
10. recusa orçamento de cliente de outra organização ou arquivado  
11. percorre a máquina de estados: rascunho → enviado → aceito, e gera revisão  
12. recusa com motivo e expira só depois da validade  
13. exige a chave certa por transição e isola por organização  
14. o painel lê do banco e respeita a organização  
15. impede arquivar cliente com orçamento em andamento e restaura  

**Classificação:** dependentes de infraestrutura (PostgreSQL HOMOL). Com `npm run test:integration` todos executam e passam. Não são pendências de implementação.

## 5. Persistência — PASS

- Gate F: cliente + contato + unidade + orçamento + itens; reload lógico via re-leitura; auditoria ≥4; negação sem permissão  
- E2E: UI completa + reload + logout/login + segunda sessão de navegador  
- Consulta direta ao Postgres HOMOL nos smokes

## 6. Publicação — PASS (sem promote)

| Item | Valor |
| --- | --- |
| Branch | `sprint-11a-persistent-core` |
| Commit | `51466eb` |
| Remote | `origin/sprint-11a-persistent-core` (pushed) |
| Preview | `https://servsam-dkf2g3bpj-alefeios-projects.vercel.app` |
| Deployment | `dpl_2EdGKrnHs9Ug2SSGTXNay8UvkYd5` READY, environment preview, Vercel Authentication |
| Smoke | `/sistema/login` 200 com “Entrar no sistema”; `/sistema/clientes` protegido (login/clientes, sem demo) |
| Merge `main` | não |
| Promote Production | não |
| Migration Production | não |

**Sprint 11A homologação: PASS.** Não iniciar 11B sem aprovação.
