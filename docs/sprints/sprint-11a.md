# Sprint 11A: núcleo persistente (Clientes e Orçamentos)

Branch: `sprint-11a-persistent-core`. Base: Sprint 9 (plataforma) mais o isolamento da Gate 0.

## Objetivo

Primeiro corte de dados reais em `/sistema`: Clientes (com contatos e unidades) e Orçamentos (proposta comercial) persistidos em PostgreSQL, com permissões, auditoria e isolamento por organização. O demo em `/demonstracao` não muda e continua em fixture e `localStorage`.

## Fora do escopo

- Sinal/entrada, OS, financeiro, agenda: só contratos documentados (Gate 4). Ver `sprint-11a-contracts-11b-11c.md`.
- Copiar fixtures do demo para o banco.
- Migração ou deploy em Production. Merge em `main`.
- Leads, oportunidades, Kanban, PDF, envio por e-mail ou WhatsApp.

## Gates

| Gate | Entrega |
| --- | --- |
| 0 | Isolamento Preview/HOMOL vs Production (já no repositório, ver `gate-0-report.md`) |
| 1 | Shell, login, logout e RBAC mantidos. Navegação Clientes e Orçamentos por permissão. Sem vazamento da sessão demo |
| 2 | `Customer`, `CustomerContact`, `CustomerUnit`. CRUD em `/sistema/clientes`, validação Zod, CPF/CNPJ, arquivamento (soft delete), auditoria |
| 3 | `Proposal`, `ProposalItem`, `DocumentSequence`. CRUD em `/sistema/orcamentos`, máquina de estados, revisão, painel lido do banco |
| 4 | Contratos de dados para 11B/11C (documento) |
| 5 | Endurecimento: escopo por `organizationId`, sem segredo na UI, sem exclusão física |
| 6 | Testes unitários, de integração (com guarda de ambiente) e e2e |
| 7 | Notas de Preview e script de migração restrito a HOMOL |
| 8 | Esta documentação, relatório e `persistence-transition.md` |

## Regras de negócio implementadas

- Dinheiro em centavos inteiros (teto 2.000.000.000). Quantidade com 3 casas. Total da linha com BigInt, arredondamento half up.
- Validade é data de negócio em America/Sao_Paulo, gravada como fim do dia (UTC-3).
- Código do orçamento `ORC-AAAA-NNNN`, sequência atômica por organização e ano.
- Estados: `draft → sent → accepted | rejected | expired`. Permissões: `proposal.send` (enviar), `proposal.approve` (aceitar e recusar), `proposal.update` (expirar), `proposal.create` (revisar).
- Só rascunho é editável e arquivável. Expirar exige validade vencida. Aceitar após a validade é bloqueado.
- Revisar um orçamento aceito, recusado ou expirado cria novo rascunho com `supersedesId`.
- Cliente com orçamento em rascunho ou enviado não pode ser arquivado.
- Documento (CPF/CNPJ) único entre cadastros ativos, verificado na aplicação (permite recadastro após arquivar).
- Toda mutação e a auditoria correspondente rodam na mesma transação.

## Rotas

- `/sistema` (Painel)
- `/sistema/clientes`, `/novo`, `/[id]`, `/[id]/editar`
- `/sistema/orcamentos`, `/novo`, `/[id]`, `/[id]/editar`

## Como rodar

```powershell
npm run lint
npm run typecheck
npm test
npm run build

# Somente Preview HOMOL (lê .env.gate0.preview.local, nunca Production)
npm run db:preview:migrate      # migrate + seed
npm run test:integration        # integração contra HOMOL
npm run test:e2e:preview        # Playwright contra HOMOL
```

Os scripts `preview-*` recusam rodar sem o arquivo HOMOL e removem `DATABASE_URL`, `PRISMA_DATABASE_URL` e `VERCEL_ENV` do ambiente. Os testes de integração só executam com `DATABASE_ENV` preview ou test e URL HOMOL utilizável (`src/lib/db/test-guard.ts`).

## Critérios de aceite

1. Usuário sem `customer.*`/`proposal.*` não vê a navegação nem acessa as rotas (tela "Sem acesso").
2. Cliente, contato, unidade e orçamento criados, editados e arquivados com auditoria.
3. Dados de uma organização nunca aparecem em outra (teste de integração com duas organizações).
4. Transições inválidas ou sem permissão são recusadas.
5. Painel mostra contagens e totais vindos do banco.
6. Lint, typecheck e build verdes. Testes conforme `sprint-11a-report.md`.
