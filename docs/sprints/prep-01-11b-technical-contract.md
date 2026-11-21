# PREP-01 — Contrato técnico Sprint 11B (sem migration)

**Estado:** contrato para autorização (revisão PREP-01.1). **Não iniciar implementação automática.**  
**Implantação:** exclusivamente HOMOL (`DATABASE_ENV=preview` + `HOMOL_*`).

## Objetivos

1. Contratação formal.  
2. Origem por orçamento **aceito**.  
3. Origem por contratação externa com referência mínima à O.C. (registro leve; O.C. completa = 11C).  
4. OS individual **por serviço**.  
5. Registro **opcional** do sinal.  
6. Solicitação administrativa ao Financeiro.  
7. Confirmação financeira exclusiva de perfil autorizado.  
8. Agenda persistente, responsáveis e histórico de remarcação.

## Regras fechadas

- Sinal **não** bloqueia universalmente a OS.  
- Não inventar cobrança real, NF ou banco.  
- Agenda SERVSAM é a fonte da verdade (sem Google Calendar).  
- **Pendente:** uma OS por visita física distinta — não presumir.

## Schema proposto (esboço — não aplicar)

```prisma
enum EngagementOrigin { PROPOSAL_ACCEPTED EXTERNAL_PURCHASE_ORDER }
enum SignalStatus { NOT_APPLICABLE RECOMMENDED REQUESTED CONFIRMED_BY_FINANCE WAIVED }
enum ServiceOrderStatus { DRAFT SCHEDULED IN_PROGRESS DONE CANCELLED }

model Engagement {
  id             String
  organizationId String
  customerId     String
  proposalId     String?   // se origem orçamento aceito
  externalPoRef  String?   // referência mínima O.C. externa
  origin         EngagementOrigin
  // ...
}

model PaymentSignalEvent {
  id             String
  engagementId   String
  status         SignalStatus
  requestedById  String?
  confirmedById  String?   // exige permissão finance.*
  amountCents    Int?
  // sem % obrigatório
}

model ServiceOrder {
  id             String
  engagementId   String
  serviceLabel   String    // um serviço = uma OS
  status         ServiceOrderStatus
  // sem gate universal de sinal
}

model ScheduleEntry {
  id              String
  serviceOrderId  String
  startsAt        DateTime
  endsAt          DateTime?
  assigneeUserId  String?
}

model ScheduleChangeLog {
  id              String
  scheduleEntryId String
  previousStartsAt DateTime
  nextStartsAt     DateTime
  changedById      String
  reason           String?
}
```

## Ações de servidor (rascunho)

| Ação | Permissão | Notas |
| --- | --- | --- |
| `createEngagementFromProposal` | `proposal.approve` + nova `engagement.create` | Só `accepted` |
| `createEngagementFromExternalPo` | `engagement.create` | Exige `externalPoRef` mínimo |
| `requestPaymentSignal` | admin/comercial | Não confirma pagamento |
| `confirmPaymentSignal` | `finance.manage` (ou chave dedicada) | Só Financeiro |
| `waivePaymentSignal` | permissão explícita | Auditoria |
| `createServiceOrder` | `service_order.create` | 1 serviço → 1 OS; sinal opcional |
| `scheduleServiceOrder` / `reschedule…` | `schedule.create/update` | Grava `ScheduleChangeLog` |

## Rotas UI sugeridas

- `/sistema/contratacoes` (lista/detalhe)  
- `/sistema/ordens-servico`  
- `/sistema/agenda`  
- Atalhos a partir de orçamento aceito

## Auditoria

`ENGAGEMENT_CREATED`, `SIGNAL_REQUESTED`, `SIGNAL_CONFIRMED`, `SIGNAL_WAIVED`, `SERVICE_ORDER_CREATED`, `SCHEDULE_CREATED`, `SCHEDULE_RESCHEDULED` — sem tokens/segredos.

## Testes mínimos (antes de merge)

Unit de regras de sinal/OS; integration HOMOL; e2e criação OS sem sinal + com sinal confirmado; isolamento org.

## Plano de implantação HOMOL

1. Autorização escrita da 11B.  
2. Branch `sprint-11b-…`.  
3. Migration **só** Preview/HOMOL.  
4. Seed de permissões novas se necessário (sem alterar grants atuais sem pedido).  
5. Preview protegido.  
6. Sem Production / sem `main` automático.

## Riscos e correções (PREP-01.1)

| Risco | Mitigação no contrato |
| --- | --- |
| Duplicar contratação a partir do mesmo orçamento | Unique parcial `(organizationId, proposalId)` quando `proposalId` não nulo; UI bloqueia segundo `createEngagementFromProposal` |
| Duplicar OS do mesmo serviço | Unique `(engagementId, serviceKey)` ou equivalência estável do item de serviço |
| Confirmação financeira por não autorizado | Permissão **dedicada** `finance.signal.confirm` (nome a validar) — **não** reutilizar só `proposal.approve` |
| Misturar recomendado / solicitado / confirmado | Máquina de estados explícita em `SignalStatus`; Comercial só `REQUESTED`/`RECOMMENDED`; Financeiro só `CONFIRMED_BY_FINANCE` |
| Transições inconsistentes de OS | Tabela de transição permitida no serviço; testes de estado |
| O.C. sem orçamento interno | `EXTERNAL_PURCHASE_ORDER` com `externalPoRef` obrigatório; `proposalId` nulo permitido |
| Remarcações sem histórico | Toda mudança de agenda grava `ScheduleChangeLog` (quem, quando, de→para, motivo) |
| OS por visita física | **Pendente** — não modelar 1 OS = 1 visita até decisão; V1 = 1 OS por serviço |

## Permissão financeira recomendada

Propor `finance.signal.confirm` (ou equivalente) atribuída ao perfil Financeiro/Diretoria na seed da 11B.  
Validar com o cliente antes de migrar. Até lá, não implementar.

## Decisões necessárias para iniciar

- [ ] Autorizar 11B  
- [ ] Confirmar chave de permissão de confirmação financeira (`finance.signal.confirm`?)  
- [ ] Fechar se visita física gera OS separada  
- [ ] Escopo do registro mínimo de O.C. na 11B vs 11C  
- [ ] Política de unicidade engagement↔proposal e OS↔serviço
