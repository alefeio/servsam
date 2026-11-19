# Sprint 11A: relatório de entrega

**Branch:** `sprint-11a-persistent-core`  
**HEAD de homologação:** `212ae41` (auditoria consolidada em `sprint-11a-homologation-audit.md`)  
**Veredito:** homologação técnica **PASS**. Sem merge em `main`, sem promote Production, sem migration em Production.

Fonte de verdade dos resultados finais: [`sprint-11a-homologation-audit.md`](./sprint-11a-homologation-audit.md).

## Escopo entregue

- `/sistema`: Clientes (`Customer`, `CustomerContact`, `CustomerUnit`) e Orçamentos (`Proposal`, `ProposalItem`, `DocumentSequence`)
- Permissões `customer.*` / `proposal.*`, auditoria, isolamento por `organizationId`
- Preview HOMOL isolado (`HOMOL_*`, `DATABASE_ENV=preview`, fail-closed)
- `/demonstracao` intacta (fixture + `localStorage`)

## Migrações (só Preview HOMOL)

| Migration | Conteúdo |
| --- | --- |
| `20261118160000_customers_proposals` | Enum `ProposalStatus`; tabelas de cliente, orçamento, itens e `document_sequence` |
| `20261118193000_customer_document_active_unique` | UNIQUE parcial de documento ativo |

## Resultados finais comprovados

| Suite | Resultado |
| --- | --- |
| lint | 0 erros |
| typecheck | ok |
| unit (`npm test`) | **120 passed**, 15 skipped |
| integration HOMOL | **15/15** |
| e2e preview (`production-auth` + `sistema-core`) | **passed** (unidade, reload, logout/login, 2ª sessão) |
| Gate F smoke | **ok** (persistência + auditoria + negação de permissão) |
| build | ok |
| Gate 0 recheck | `PASS_ENV` |

Os 15 testes ignorados em `npm test` são os de integração guardados por `DATABASE_ENV`/HOMOL. Com `npm run test:integration` todos executam e passam. Não são falhas de implementação.

> Nota histórica: um relatório intermediário registrou 8 falhas em `dataset-store.test.ts` (Node 26 × jsdom). Isso foi corrigido em `vitest.setup.ts` (localStorage em memória). O resultado final é o da tabela acima, não o intermediário.

## Publicação (Preview apenas)

| Item | Valor |
| --- | --- |
| Remote | `origin/sprint-11a-persistent-core` |
| Preview | `https://servsam-dkf2g3bpj-alefeios-projects.vercel.app` |
| Proteção | Vercel Authentication (sem acesso anônimo) |
| Merge `main` | não |
| Promote Production | não |

Checklist de acesso do cliente: [`sprint-11a-client-homologation-checklist.md`](./sprint-11a-client-homologation-checklist.md).

## Incidente: migration no banco legado (corrigido)

Na primeira execução, um script de migrate caiu em `RUNTIME_DATABASE_URL` de `.env.local` e aplicou `20261118160000_customers_proposals` no **store legado** (`servsam-prisma-postgres`, fundação `2026-10-22`), ligado a Production/Preview compartilhado.

| Item | Evidência |
| --- | --- |
| Estruturas criadas | Enum `ProposalStatus` + tabelas 11A (vazias) |
| Rollback | `scripts/rollback-legacy-11a-migration.mjs` — só se fundação for 22/10 e tabelas 11A vazias |
| Estado legado atual | Só `20261022140103_platform_foundation`; tabelas 11A ausentes |
| HOMOL | Fundação 18/11 + migrations 11A intactas |
| Perda de dados | Nenhuma (tabelas 11A vazias no legado; fundação preservada) |
| Prevenção | `scripts/lib/homol-env.mjs` exige `.env.gate0.preview.local` / `HOMOL_*` (fail-closed; sem fallback para URL legada) |

Auditoria read-only: `node scripts/audit-db-read-only.mjs`. Detalhe completo na seção 1 de `sprint-11a-homologation-audit.md`.

## Resíduos de teste no HOMOL

Inventário read-only em 2026-11-19 (`scripts/homol-residue-report.mjs`, hostHash `22e5c2dd2d93`):

| Tipo | Quantidade | Observação |
| --- | --- | --- |
| Clientes `[E2E] …` | 3 | Arquivados (`deletedAt` preenchido); orçamentos aceitos ainda ativos |
| Clientes `[GATEF] …` | 2 | Ativos; orçamentos em rascunho |
| Orçamentos residuais | 5 | Códigos `ORC-2026-0001` … `0005` |

A UI de homologação **não** oferece exclusão física. Arquivar cliente não remove orçamentos aceitos.

### Limpeza segura proposta (não executada nesta entrega)

1. Rodar `node scripts/homol-residue-report.mjs` e conferir só prefixos `[E2E]` / `[GATEF]`.
2. Soft-delete (arquivar) orçamentos em `draft` residuais, se a regra de negócio permitir.
3. Soft-delete de contatos/unidades ligados só a esses clientes.
4. Manter orçamentos `accepted` arquiváveis apenas se houver ação explícita de domínio; senão, deixar marcados e filtrar na UI de homologação por prefixo.
5. Nunca rodar `DELETE`/`TRUNCATE` indiscriminado nem apontar script para Production/legado.
6. Opcional futuro: flag `isTestData` ou job de purge só em `DATABASE_ENV=preview`.

## Roadmap após 11A

Reorganizado conforme prioridades do cliente — ver [`sprint-11a-contracts-11b-11c.md`](./sprint-11a-contracts-11b-11c.md):

- **11B:** sinal administrativo, emissão de OS e agendamento persistente  
- **11C:** contratos periódicos, O.C. e vínculo com visitas/OS  
- **Financeiro / RH:** etapas posteriores; escopo ainda aberto  

**Não iniciar 11B** sem aprovação explícita.
