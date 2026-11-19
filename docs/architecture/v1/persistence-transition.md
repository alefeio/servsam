# Transição para persistência

**Data:** 18/11/2026. Atualizado na Sprint 11A.

Descreve como a V1 sai do fixture em `localStorage` e passa a gravar em PostgreSQL, domínio por domínio. O modelo de destino está em [conceptual-model.md](./conceptual-model.md), os relacionamentos em [relationships.md](./relationships.md) e os estados em [state-machines.md](./state-machines.md).

## Princípio

Duas experiências convivem e **não trocam dados**:

| | `/demonstracao` | `/sistema` |
| --- | --- | --- |
| Dados | Fixture em `src/data/demo` e `localStorage` | PostgreSQL via Prisma |
| Sessão | `servsam.demo.session` | Better Auth, cookie do servidor |
| Provenance | Obrigatória. "Dados demonstrativos" sempre visível | Não se aplica: dado real, nunca ficção |
| Escrita | Só no navegador | Server Actions com permissão por chave |

O demo não migra para o banco. Não há importação de fixture, seed de cliente fictício nem ponte entre as duas sessões. Um teste (`persistent-core.test.ts`) falha se qualquer arquivo de `/sistema` importar `@/lib/demo`, `@/data/demo`, `localStorage` ou a chave de sessão do demo.

## Estado por domínio

| Domínio | Demo | Produção (`/sistema`) | Sprint |
| --- | --- | --- | --- |
| Acesso (`Organization`, `User`, `Role`, `Permission`, `AuditLog`) | Não existe | **Persistente** | 9 |
| `Customer`, `CustomerContact`, `CustomerUnit` | `DemoClient`, `DemoClientUnit` | **Persistente** | 11A |
| `Proposal`, `ProposalItem` (UI: Orçamento) | `DemoProposal`, `DemoProposalItem` | **Persistente** | 11A |
| Sinal (opcional), `ServiceOrder` por serviço, agenda persistente | Demo 10.2 (ainda com gate de sinal — hotfix planejado) | Contrato escrito; sinal não bloqueia OS | 11B |
| O.C. recebida, contratos, recorrência, docs ↔ OS | `DemoContract` / O.C. demo | Contrato escrito; O.C. ≠ só periódico | 11C |
| Financeiro amplo | `DemoFinancialTransaction` | Inventário de menus 19/11/2026; fases próprias | após 11C |
| RH / colaborador sensível | Parcial no demo | Etapa posterior + permissões | após 11C / Sprint 12 |
| Leads, oportunidades, Kanban | `DemoLead`, `DemoOpportunity` | Só demo (V1.1) | — |
| Agenda, colaboradores, veículos | Parcial no demo | Congelado | 12 |
| Estoque, relatórios, certificados, contratos, licitações, alertas | Demo | Congelado | 14 a 19 |

Contratos de 11B e 11C: [`docs/sprints/sprint-11a-contracts-11b-11c.md`](../../sprints/sprint-11a-contracts-11b-11c.md).

## Mapeamento do demo para o modelo real (11A)

Serve para a leitura do cliente e para uma eventual carga assistida. **Nada disto é executado automaticamente.**

### Cliente

| Demo (`DemoClient`) | Produção | Observação |
| --- | --- | --- |
| `legalName` | `Customer.legalName` | Obrigatório |
| `tradeName` | `Customer.tradeName` | |
| `alias` | — | Apelido fictício do demo. Não migra |
| `documentNumber` | `Customer.document` | Só dígitos. CPF/CNPJ validados pelos dígitos verificadores |
| `segment` | `Customer.segment` | Texto livre |
| `city` | `CustomerUnit.city` | A cidade pertence à unidade, não ao cliente |
| `email`, `phone`, `responsibleName` | `CustomerContact` | Viram contato, com `isPrimary` |
| `notes` | `Customer.notes` | |
| `relationshipKind` | — | Sem equivalente na 11A |

`DemoClientUnit` (`name`, `address`, `city`) → `CustomerUnit` (`name`, `addressLine`, `city`, `state`, `postalCode`).

### Proposta

| Demo (`DemoProposal`) | Produção | Observação |
| --- | --- | --- |
| `code` | `Proposal.code` | Produção gera `ORC-AAAA-NNNN` pela `DocumentSequence`. Não reaproveita o código do demo |
| `clientId` | `Proposal.customerId` | |
| `opportunityId` | — | Oportunidade não existe em produção na V1 |
| `status` | `Proposal.status` | Mesmo vocabulário: `draft`, `sent`, `accepted`, `rejected`, `expired` |
| `value` (reais, `number`) | `Proposal.totalCents` | **Muda de unidade.** Produção grava centavos inteiros |
| `discountAmount` | `Proposal.discountCents` | Centavos |
| `validUntil` | `Proposal.validUntil` | Vira o fim do dia em Brasília |
| `paymentTerms`, `commercialConditions`, `observations` | Mesmos nomes | |
| `downPayment`, `executionDeadline`, `cancellationFee`, `serviceFamily`, `formalization`, `narrative` | — | Não entram na 11A. `downPayment` é assunto da 11B |
| `DemoProposalItem.unitPrice` (reais) | `ProposalItem.unitPriceCents` | Centavos. `quantity` vira `Decimal(12,3)` |

O demo grava `value` à mão; a produção calcula `totalCents` a partir dos itens e do desconto. Um valor do demo que não bata com a soma dos itens seria recusado pela regra de totais.

## O que mudou no banco

Migration `20261118160000_customers_proposals`:

- Tabelas: `customer`, `customer_contact`, `customer_unit`, `proposal`, `proposal_item`, `document_sequence`.
- Enum `ProposalStatus`.
- Todas com `organizationId` e FK para `organization`. `customer*` e `proposal` com `deletedAt`.
- `createdById`/`updatedById` são texto sem FK. A autoria fica no `AuditLog`, que tem FK para `User`.
- Unicidade: `proposal(organizationId, code)` e `document_sequence(organizationId, key, year)`.
- **Sem** índice único parcial para documento de cliente. A unicidade entre ativos é regra de aplicação, porque um índice único comum bloquearia recadastrar um documento arquivado. Se o cliente quiser garantia no banco, o caminho é um índice parcial criado por SQL manual.

## Convenções do código de produção

1. **Regra fora da página.** Serviços em `src/lib/platform/*.ts` (`customers`, `proposals`). Páginas só leem e apresentam.
2. **Funções puras testáveis sem banco:** `proposal-state`, `proposal-summary`, `money`, `br-document`, `dates`, `nav`, `form-parsers`, schemas Zod.
3. **Permissão em duas camadas:** `requirePermission(chave)` na Server Action e `denyWithout`/`assertCan` dentro do serviço. A decisão é pela chave, nunca pelo nome do papel.
4. **Escopo de organização em toda consulta.** Teste estático percorre os serviços; teste de integração confirma o isolamento entre duas organizações.
5. **Exclusão lógica.** Nenhum `delete` de cliente, contato, unidade ou proposta. O teste estático proíbe.
6. **Transação com auditoria.** Mudança e `AuditLog` no mesmo `$transaction`. Metadata passa por `sanitizeAuditMetadata`.
7. **Dinheiro em centavos.** `Int` no banco, `Decimal(12,3)` só para quantidade. Cálculo de linha em `BigInt`.
8. **Formulários.** `useGuardedForm` mantém o que a pessoa digitou quando a ação devolve erro. `<form action>` zera campos não controlados.

## Ambientes e banco

Em 18/11/2026 existem dois bancos reais:

| Banco | Papel | Quem usa |
| --- | --- | --- |
| **HOMOL** (`HOMOL_*`, só Preview) | Homologação isolada | Preview, testes de integração, e2e de Preview |
| **Store legado** (`RUNTIME_DATABASE_URL`/`POSTGRES_URL` do `.env.local`) | Criado na Sprint 9 e ainda ligado a Production | **Não usar para teste ou migration de desenvolvimento** |

Regras:

- Migration e seed de desenvolvimento só pelo HOMOL: `npm run db:preview:migrate` (`scripts/preview-migrate.mjs`). O script exige `.env.gate0.preview.local`, gerado por `npx vercel env pull .env.gate0.preview.local --environment=preview --yes`, e **não aceita** `RUNTIME_DATABASE_URL` do `.env.local`.
- O host não identifica o banco: os bancos Prisma Postgres compartilham `db.prisma.io:5432`. O fingerprint de host do Gate 0 (`22e5c2dd2d93`) vale para o HOMOL **e** para o store legado. Quem decide o destino é a credencial.
- Testes de integração: `npm run test:integration`. Rodam com `DATABASE_ENV=preview` e `HOMOL_*`. Com `DATABASE_ENV=development` (padrão do `.env.local`) são pulados.
- E2E contra o HOMOL: `npm run test:e2e:preview`.
- Production: nenhuma migration nesta sprint. A promoção para Production é decisão explícita, fora de 11A.

### Incidente de 18/11/2026

Durante a 11A, a migration foi aplicada por engano ao store legado (lido do `.env.local`), antes de existir o runner HOMOL. É migration **aditiva** (seis tabelas novas e um enum, sem alterar tabela existente), mas o store legado está ligado a Production. Detalhes e SQL de reversão em [`sprint-11a-report.md`](../../sprints/sprint-11a-report.md).

## Como promover para Production (quando houver decisão)

1. Backup do banco de Production.
2. Confirmar que a migration `20261118160000_customers_proposals` está aplicada ou aplicá-la com `prisma migrate deploy` (a tabela de migrations do store legado já a registra, ver incidente).
3. Rodar o seed (idempotente). Nenhuma permissão nova é criada na 11A.
4. Smoke de login e de `/sistema/clientes` e `/sistema/orcamentos`.
5. Conferir que `/demonstracao` segue igual.

## O que ainda não é produção

Sem WhatsApp, e-mail ou ERP reais, sem dado de cliente real carregado, sem PWA, offline, geolocalização, câmera, NF-e, portal do cliente ou mobile de campo. O envio do orçamento é um **registro de situação** ("Marcar como enviado"): o sistema não dispara mensagem.
