# Roadmap pós-11A — contratos 11B / 11C e pendências

**Data:** 19/11/2026.  
**Estado:** planejamento revisado após homologação da 11A. **Nada deste documento está implementado.**  
Não há tabela, rota, permissão nova nem tela de sinal, OS, agenda, contrato, O.C., financeiro ou RH nesta entrega.

A Sprint 11A permanece só com clientes e orçamentos persistentes. Este arquivo alinha a proposta de roadmap às **prioridades validadas pelo cliente** e distingue o que já está confirmado do que ainda é decisão pendente.

## Como ler

| Marcação | Significado |
| --- | --- |
| **Confirmado** | Prioridade ou restrição já validada com o cliente / homologação 11A |
| **Proposta de arquitetura** | Desenho técnico sugerido; ainda não codificado |
| **Pendente do cliente** | Regra comercial ou operacional sem fechamento; **não implementar como definitiva** |

## Encaixe na fila congelada

A fila numerada da Sprint 8 **não é renumerada** (`docs/product-backlog.md`). Os sufixos A/B/C organizam o trabalho intermediário:

| Entrega | Escopo proposto | Estado |
| --- | --- | --- |
| **11A** | Clientes, contatos, unidades e orçamentos (`Proposal`) em `/sistema` | Homologada tecnicamente (sem merge `main`) |
| **11B** | Registro administrativo de sinal, emissão de OS e agendamento persistente | **Planejamento** |
| **11C** | Contratos periódicos, O.C. e relacionamento com visitas/OS | **Planejamento** |
| Financeiro (amplo) | Contas a receber/pagar, parcelas, conciliação etc. | **Pendente de definição** — não é 11C |
| RH | Cadastro sensível, documentos, alertas NR/ASO | **Etapa posterior**, com permissões adequadas |

**Confirmado:** antecipar fatias de operação (sinal/OS/agenda) e de contratos antes do financeiro completo.  
**Pendente do cliente:** datas de abertura de 11B/11C e se alguma fatia volta ao número original da fila (12, 13, 17).

## O que a 11A garante (pré-condições) — Confirmado

Tudo abaixo existe em `prisma/schema.prisma` e está coberto por teste de integração no HOMOL.

| Garantia | Detalhe |
| --- | --- |
| `Customer`, `CustomerContact`, `CustomerUnit` | `organizationId`, soft delete, documento único entre ativos |
| `Proposal` (UI: Orçamento) | Estados `draft`, `sent`, `accepted`, `rejected`, `expired` |
| `ProposalItem` / totais | Centavos inteiros; `totalCents = soma(itens) - discountCents` |
| Aceito imutável | Ajuste via nova proposta com `supersedesId` |
| `DocumentSequence` | Numeração atômica (`proposal` → `ORC-AAAA-NNNN`) |
| Auditoria e RBAC | `AuditLog` + chaves `customer.*` / `proposal.*` no servidor |
| Isolamento | Preview HOMOL ≠ Production; fail-closed em `DATABASE_ENV=preview` |

### Ganchos deixados de propósito

- `Proposal.status = accepted` e `decidedAt` são o gancho comercial para a 11B. **Nenhuma** coluna de sinal, OS, agenda, contrato ou financeiro foi adicionada ao `Proposal`.
- `DocumentSequence` é genérica (ex.: futuras chaves `service_order`, `contract`, `certificate`).
- `writeAudit(input, client)` e `ServiceResult` / `runGuarded` são o padrão a reutilizar.

## Requisitos confirmados (pós-homologação)

1. Homologar 11A no Preview protegido antes de merge/`main`/Production.  
2. Próximo foco operacional: **sinal → OS → agendamento**, não financeiro completo.  
3. Em seguida: **contratos periódicos e O.C.**, ligados a visitas/OS.  
4. Manter `/demonstracao` separada; não copiar fixtures para o banco.  
5. Não abrir acesso anônimo ao banco de homologação.  
6. Não implementar regra definitiva de obrigatoriedade de sinal, dispensas ou “uma OS por visita” enquanto essas perguntas estiverem **pendentes do cliente**.

## 11B — Sinal, OS e agendamento persistente

### Objetivo (Confirmado como prioridade)

1. Registrar o **sinal** de forma administrativa após o orçamento aceito.  
2. **Emitir OS** a partir do orçamento (sem redigitar cliente/unidade/escopo básico).  
3. Persistir **agendamento** (compromisso na agenda SERVSAM), não só data solta na OS.

### Proposta de arquitetura (não aplicada)

Esboço alinhado a `docs/architecture/v1/conceptual-model.md` e ao demo 10.2 (sem copiar fixture):

```prisma
// Proposta — NÃO migrar nesta entrega
model ProposalSignal { /* amountCents, status expected|received|waived, … */ }
model ServiceOrder { /* code OS-AAAA-NNNN, proposalId, customerId, status, … */ }
model Schedule { /* vínculo OS/visita, início/fim, responsável — fonte da verdade da agenda */ }
```

| Tema | Proposta de arquitetura | Pendente do cliente |
| --- | --- | --- |
| Sinal | Evento auditado ligado a `Proposal` `accepted`; valores em centavos | Obrigatório antes da OS? Percentual, valor fixo ou texto? Quem dispensa? |
| Dispensa | Status `waived` + motivo (se existir) | Quando é permitida e quem autoriza |
| OS | Cabeçalho com `proposalId`, `customerId`, `customerUnitId` herdados; estados de `state-machines.md` | Limite de OS por orçamento; emissão automática vs manual; uma OS por visita? |
| Agenda | `Schedule` (ou equivalente) como fonte da verdade; Google Calendar não substitui | Campos mínimos da visita; quem escala técnico/veículo na 11B vs Sprint 12 |
| Permissões | Reusar `service_order.*` / `schedule.*` existentes quando possível | Chave própria para sinal (`proposal.signal`?) vs `proposal.approve` / `finance.manage` |

### Superfície de serviço alvo (Proposta)

```ts
recordProposalSignal(actor, proposalId, input): ServiceResult
markSignalReceived(actor, signalId, input): ServiceResult
// waive… só após regra de dispensa fechada pelo cliente
createServiceOrderFromProposal(actor, proposalId, input): ServiceResult
scheduleServiceOrder(actor, serviceOrderId, input): ServiceResult
```

### Explicitamente fora da 11B

Execução de campo, relatório técnico, certificado, estoque, contratos/O.C., financeiro completo, RH, mobile, NF-e, WhatsApp real.

## 11C — Contratos periódicos, O.C. e visitas/OS

### Objetivo (Confirmado como prioridade)

Modelar **contratos periódicos**, **ordem de compra (O.C.)** e o relacionamento com visitas/OS geradas a partir do contrato ou do orçamento recorrente.

### Proposta de arquitetura (não aplicada)

```prisma
// Proposta — NÃO migrar nesta entrega
model Contract { /* vigência, periodicidade, customerId, … */ }
model ContractPurchaseOrder { /* O.C. do cliente, vínculo ao contrato */ }
// Visitas / OS recorrentes apontam para Contract e/ou Proposal conforme regra fechada
```

| Tema | Proposta de arquitetura | Pendente do cliente |
| --- | --- | --- |
| Contrato | Vigência, periodicidade, reajuste, unidade(s) atendidas | Campos obrigatórios; renovação; reajuste automático vs manual |
| O.C. | Documento do cliente ligado ao contrato; número externo | Obrigatoriedade da O.C. antes de agendar; formato |
| Visitas | Geração de OS/agenda a partir da periodicidade | Antecedência, tolerância, o que acontece se a visita falhar |
| Orçamento | Contrato pode nascer de `Proposal` aceita | Sempre? Ou contrato avulso? |

### Explicitamente fora da 11C

Financeiro amplo (parcelas, conciliação, DRE), RH, estoque, PDF fiscal, portal do cliente.

## Financeiro — escopo amplo (Pendente do cliente)

Não confundir com a 11C revisada.

| Tema | Situação |
| --- | --- |
| Contas a receber/pagar, parcelas, baixas | **Pendente de definição** de escopo e prioridade |
| Ligação sinal ↔ lançamento | Só após decidir se o sinal é marco comercial ou título financeiro |
| Perfis | Mantém-se a matriz atual: Administrativo/Gerência sem `finance.*` até nova decisão |

Qualquer esboço antigo de `FinancialEntry` / `Installment` / `Payment` neste arquivo fica **arquivado como referência**, não como compromisso da 11C.

## RH — etapa posterior (Confirmado como posterior)

Cadastro de colaboradores, documentos sensíveis (ASO, NR, EPI) e alertas exigem:

- modelo mínimo alinhado à Sprint 12 / V1.1;  
- **permissões específicas** para dados sensíveis (não reutilizar só `user.manage`);  
- fora do caminho crítico 11B → 11C operacional.

## Regras comuns (Confirmado / Proposta)

1. Dinheiro em centavos inteiros ou `Decimal` com escala declarada.  
2. Toda tabela nova: `organizationId`, timestamps; soft delete em cadastros; lançamentos financeiros (quando existirem) cancelam, não apagam.  
3. Cliente = agregador de relacionamento; OS = agregador da operação.  
4. Permissão por chave no servidor.  
5. `/demonstracao` não muda.  
6. Migration só em Preview HOMOL até decisão explícita (`persistence-transition.md`).  
7. **Não** fechar em código regras de obrigatoriedade de sinal, dispensa ou cardinalidade OS↔visita enquanto estiverem **pendentes do cliente**.

## Ordem sugerida (Proposta — sujeita a aprovação)

1. Abrir 11B só após aceite formal do checklist da 11A pelo cliente.  
2. 11B-1: sinal administrativo + testes HOMOL (sem regra rígida de obrigatoriedade até pendência fechar).  
3. 11B-2: OS mínima a partir do orçamento.  
4. 11B-3: agendamento persistente.  
5. 11C: contratos + O.C. + vínculo visitas/OS.  
6. Financeiro amplo e RH: backlog próprio, depois das pendências comerciais.

## O que não entra em 11B/11C

NF-e, contabilidade, folha, ERP, portal externo, mobile de campo, WhatsApp/e-mail reais, Google Calendar como agenda principal, estoque, certificados, licitações.
