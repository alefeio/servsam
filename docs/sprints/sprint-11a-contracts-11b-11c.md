# Sprint 11A — contratos de dados para 11B e 11C

**Data:** 18/11/2026.
**Estado:** contrato de projeto. **Nada deste documento está implementado.** Não há tabela, rota, permissão nova nem tela de sinal, ordem de serviço ou financeiro. A Sprint 11A entrega só clientes e orçamentos persistentes.

Este arquivo fixa o que a 11A promete às próximas entregas, para que 11B e 11C encaixem sem reabrir o modelo. Onde há decisão que depende do cliente, está marcada como **pendente**. Nenhum valor, prazo ou regra comercial aqui é dado do cliente.

## Como 11A, 11B e 11C se encaixam na fila congelada

A fila de produção da Sprint 8 não foi renumerada (ver `docs/product-backlog.md`). Os sufixos A, B e C dividem o espaço da "Sprint 11 — Propostas e aprovação":

| Entrega | Escopo | Estado |
| --- | --- | --- |
| 11A | Clientes (contatos, unidades) e orçamentos (`Proposal`) persistentes, máquina de estados, painel lido do banco | Implementada |
| 11B | Sinal do aceite e abertura da ordem de serviço a partir do orçamento aceito | **Contrato** |
| 11C | Financeiro mínimo ligado ao sinal e ao orçamento | **Contrato** |

Consequência: 11B antecipa uma fatia da Sprint 13 (OS) e 11C antecipa uma fatia da Sprint 17 (financeiro gerencial). A fila 12 a 20 continua com os números e os focos de antes. **Pendente:** o cliente confirmar essa antecipação. Se não confirmar, 11B e 11C voltam ao lugar original (13 e 17) usando este mesmo contrato.

## O que a 11A garante (pré-condições)

Tudo abaixo existe em `prisma/schema.prisma` e está coberto por teste de integração.

| Garantia | Detalhe |
| --- | --- |
| `Customer`, `CustomerContact`, `CustomerUnit` | `organizationId`, `deletedAt`, `createdAt/updatedAt`. Documento (CPF/CNPJ) só dígitos, único entre ativos por aplicação |
| `Proposal` (UI: Orçamento) | Estados `draft`, `sent`, `accepted`, `rejected`, `expired`. `decidedAt` marca o aceite, a recusa ou a expiração |
| `ProposalItem` | `quantity` `Decimal(12,3)`, `unitPriceCents` e `totalCents` inteiros |
| Totais | `Proposal.totalCents = soma(itens) - discountCents`. Sempre centavos, nunca float |
| Aceito é imutável | Depois de `accepted` o conteúdo não muda. Ajuste cria outra proposta com `supersedesId` |
| Numeração | `DocumentSequence(organizationId, key, year)` com incremento atômico. A chave `proposal` gera `ORC-AAAA-NNNN` |
| Auditoria | `AuditLog` com ator, ação, tipo, id e metadata. Transição grava `{ from, to }` |
| Permissões | Chaves `customer.*` e `proposal.*` já existentes. Nenhuma chave nova na 11A |
| Escopo | Toda consulta filtra `organizationId`. Teste estático e teste de integração verificam isso |

### Ganchos deixados de propósito

- `Proposal.status = accepted` e `decidedAt` são o único gatilho para 11B. Nenhuma coluna de sinal, OS ou financeiro foi adicionada ao `Proposal`.
- `DocumentSequence` é genérica. 11B usa a chave `service_order`. A Sprint 16 usará `certificate` (número nunca reutilizado, nem após revogação).
- `writeAudit(input, client)` aceita o `tx` de uma transação. 11B e 11C devem gravar auditoria na mesma transação da mudança.
- `runGuarded(permission, work)` e `ServiceResult` são o padrão de Server Action e de retorno dos serviços.
- A proposta pode ficar `sent` com a validade vencida. Isso não é estado armazenado; a tela e o painel mostram "Validade vencida". 11B não deve tratar essa proposta como aceitável.

## Regras comuns a 11B e 11C

1. Dinheiro em centavos inteiros (`Int`) ou `Decimal` com escala declarada. Limite de um valor: 2.000.000.000 centavos (`MAX_CENTS`).
2. Toda tabela nova tem `organizationId`, `createdAt`, `updatedAt` e, quando representar cadastro ou documento, `deletedAt`. Lançamento financeiro não se apaga: cancela.
3. Cliente é o agregador de relacionamento. Ordem de serviço é o agregador da operação. Nenhuma tabela de 11B/11C aponta para `Customer` sem passar pela proposta ou pela OS, exceto despesa básica (sem cliente).
4. Permissão por chave, verificada no servidor com `requirePermission`, mais `denyWithout` dentro do serviço.
5. Estado derivado não é coluna editável. Atraso é alerta calculado, nunca estado `overdue`.
6. `/demonstracao` não muda. Nenhum fixture entra no banco.
7. Migration só em Preview HOMOL até decisão explícita. Ver `docs/architecture/v1/persistence-transition.md`.

## 11B — Sinal e abertura da OS

### Objetivo

Registrar o sinal combinado no aceite e, com orçamento aceito (e sinal tratado conforme a regra pendente), abrir a ordem de serviço sem redigitar nada.

### Entidades propostas

Esboço, **não aplicado**:

```prisma
model ProposalSignal {
  id             String   @id
  organizationId String
  proposalId     String   @unique          // um sinal por proposta na V1
  amountCents    Int                       // > 0 e <= Proposal.totalCents
  dueDate        DateTime?
  status         SignalStatus              // expected | received | waived
  receivedAt     DateTime?
  receivedCents  Int?                      // preenchido ao receber; pode diferir do esperado
  waivedReason   String?
  createdById    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum SignalStatus { expected received waived }

model ServiceOrder {
  id             String   @id
  organizationId String
  code           String                    // OS-AAAA-NNNN via DocumentSequence key "service_order"
  customerId     String                    // herdado da proposta
  customerUnitId String?
  proposalId     String?                   // N—0..1; obrigatório na OS padrão (relationships.md)
  status         ServiceOrderStatus        // scheduled | in_progress | completed | cancelled
  scheduledFor   DateTime?
  deletedAt      DateTime?
  // ...
  @@unique([organizationId, code])
}
```

Os nomes seguem `docs/architecture/v1/conceptual-model.md`. `ServiceExecution`, equipe, produtos e agenda **não** entram na 11B.

### Regras e invariantes

| # | Regra |
| --- | --- |
| S1 | Sinal só existe para proposta `accepted`. Criar sinal em outro estado falha |
| S2 | `amountCents` positivo e no máximo `Proposal.totalCents`. Zero é "dispensa" (`waived`) com motivo |
| S3 | Registrar recebimento é um evento auditado. O valor recebido pode divergir do esperado; a diferença fica visível, não é corrigida em silêncio |
| S4 | `ServiceOrder` nasce a partir de proposta `accepted` do mesmo `organizationId`. `customerId` e `customerUnitId` vêm da proposta e não são editados na OS |
| S5 | Uma proposta pode originar mais de uma OS (visitas recorrentes). **Pendente:** limite e regra de "saldo orçado" |
| S6 | Criar OS é idempotente por `(proposalId, chave de criação)` para evitar duplo clique |
| S7 | Estados da OS seguem `state-machines.md`: `scheduled` → `in_progress` → `completed`; `scheduled`/`in_progress` → `cancelled`. `overdue` não é estado |

### Superfície de serviço (assinaturas alvo)

```ts
recordProposalSignal(actor, proposalId, input): ServiceResult<{ id: string }>
markSignalReceived(actor, signalId, input): ServiceResult
waiveProposalSignal(actor, signalId, reason): ServiceResult
createServiceOrderFromProposal(actor, proposalId, input): ServiceResult<{ id: string; code: string }>
```

### Permissões

Chaves já existentes: `service_order.view`, `service_order.create`, `service_order.update`, `proposal.approve`. **Pendente:** o sinal exige chave própria (por exemplo `proposal.signal`) ou reaproveita `proposal.approve` ou `finance.manage`. Sem decisão, não criar chave.

### Pendências de negócio (dependem do cliente)

- Sinal é obrigatório antes da OS ou só informativo? O demo traz `downPayment` como texto livre, sem regra.
- Sinal é percentual, valor fixo ou texto por proposta?
- O sinal é dado financeiro (conta a receber) ou só um marco comercial? Define se 11C o absorve.
- Quem pode dispensar o sinal.

## 11C — Financeiro mínimo

### Objetivo

Receber o sinal e o saldo de um orçamento aceito como contas a receber, sem tocar em contabilidade, NF-e ou conciliação.

### Entidades propostas

Esboço, **não aplicado**. Segue `conceptual-model.md` (FinancialEntry, Installment, Payment):

```prisma
model FinancialEntry {
  id             String   @id
  organizationId String
  kind           FinancialKind             // receivable | expense
  status         FinancialStatus           // derivado: draft | open | partial | settled | cancelled
  customerId     String?                   // obrigatório em receivable
  proposalId     String?
  serviceOrderId String?
  description    String
  totalCents     Int
  cancelledAt    DateTime?
  cancelReason   String?
}

model Installment {
  id               String @id
  organizationId   String
  entryId          String
  sequence         Int
  dueDate          DateTime
  amountCents      Int
}

model Payment {
  id             String   @id
  organizationId String
  installmentId  String
  paidAt         DateTime
  amountCents    Int
  method         String?
}
```

### Regras e invariantes

| # | Regra |
| --- | --- |
| F1 | `receivable` exige `customerId`. `expense` não exige |
| F2 | `soma(Installment.amountCents) = FinancialEntry.totalCents` |
| F3 | `Payment` não excede o saldo da parcela sem renegociação registrada (integridade 5 de `relationships.md`) |
| F4 | `status` do lançamento deriva das parcelas e pagamentos. Não existe edição manual para `settled` |
| F5 | Lançamento não é apagado: `cancelled` com motivo e auditoria |
| F6 | Atraso é `Alert` calculado pela data. Não há `overdue` armazenado |
| F7 | Receita sem cliente não é o caso padrão |
| F8 | Valores do orçamento aceito e do lançamento podem divergir, mas a divergência é visível (proposta × lançamento) |

### Permissões

`finance.view`, `finance.manage` e `report.financial.view` já existem. Perfis Administrativo e Gerência **não** têm financeiro; só Financeiro e Diretoria. A 11C não altera essa matriz.

### Pendências

- O sinal vira a primeira parcela do mesmo lançamento ou um lançamento separado?
- Forma de pagamento: lista fixa ou texto livre.
- Renegociação: fica para a Sprint 17 original; 11C só impede o excesso.
- Moeda: só BRL na V1.

## Ordem sugerida de implementação

1. 11B-1: migration de `ProposalSignal` + serviço + testes de integração no HOMOL.
2. 11B-2: `ServiceOrder` mínima (cabeçalho, estado, ligação à proposta) + `DocumentSequence` `service_order`.
3. 11C-1: `FinancialEntry`/`Installment`/`Payment` + derivação de estado em módulo puro, com testes.
4. 11C-2: telas do financeiro mínimo e painel.

Cada passo repete o ciclo da 11A: migration em Preview HOMOL, testes de integração guardados por `DATABASE_ENV`, nenhum fixture do demo no banco.

## O que 11B e 11C não incluem

Agenda, equipes, veículos, execução, relatório técnico, certificado, estoque, licitação, contratos, NF-e, WhatsApp/e-mail reais, portal do cliente e mobile de campo. Seguem as fases e os contratos já documentados em `docs/architecture/v1/scope.md`.
