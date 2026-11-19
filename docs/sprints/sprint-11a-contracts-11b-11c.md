# Roadmap pós-11A — contratos 11B / 11C (feedback 19/11/2026)

**Data:** 19/11/2026.  
**Estado:** planejamento. **Nada deste documento está implementado** (sem tabelas/rotas novas além da 11A).  
Consolidação oficial: `sprint-11a-client-feedback-2026-11-19.md`.

## Como ler

| Marcação | Significado |
| --- | --- |
| **Confirmado** | Resposta oficial do cliente |
| **Proposta de arquitetura** | Desenho técnico sugerido; não codificado |
| **Pendente** | Ainda sem fechamento |

## Encaixe na fila (sem renumerar 10–20)

| Entrega | Escopo | Estado |
| --- | --- | --- |
| **11A** | Clientes, contatos, unidades, orçamentos em `/sistema` | Homologação técnica |
| **11B** | Contratação, sinal administrativo quando aplicável, **OS por serviço**, agendamento persistente | Planejada |
| **11C** | O.C. recebida, contratos, recorrência, relação documentos comerciais ↔ OS | Planejada |
| **Financeiro** | Fases próprias (`sprint-11a-finance-inventory-2026-11-19.md`) | Inventário solicitado |
| **RH** | Posterior + permissões sensíveis | Posterior |

## Pré-condições 11A — Confirmado

`Customer` / `Proposal` / `DocumentSequence` / RBAC / auditoria / HOMOL isolado.  
Gancho comercial: `Proposal.accepted` **ou** contratação formalizada pelo cliente (O.C. etc.) para origem da OS na 11B+.

## Regras confirmadas que o roadmap deve respeitar

### Sinal

- Não obrigatório em todos os casos; **recomendado** em serviços avulsos.  
- Não bloqueia universalmente a OS.  
- Comercial **solicita** ao Financeiro; Financeiro **confirma** recebimento quando aplicável.  
- Três eventos: aceite comercial → solicitação admin/fiscal → confirmação financeira.  
- Sem confirmação automática, sem presumir 50%, sem NF real nesta etapa.

### O.C. e documentos

- Orçamento SERVSAM = proposta interna.  
- O.C. = documento **recebido** do contratante (não só contrato periódico).  
- OS = documento interno de execução; **cada serviço tem uma OS**.  
- Pode haver O.C. sem orçamento interno prévio obrigatório.  
- **Pendente:** visitas físicas distintas do mesmo serviço → OS separadas?

### Agenda

- Sem Google Calendar.  
- Alterar data/hora com persistência; responsável + histórico de remarcações.  
- Sem inconsistências data/status; conflitos explícitos sem inventar bloqueio rígido.  
- Drag-and-drop não obrigatório.

## 11B — Contratação, sinal (quando aplicável), OS, agenda

### Objetivo — Confirmado como prioridade de produto

1. Formalizar contratação a partir do orçamento aceito **ou** de entrada com documento do cliente.  
2. Registrar sinal administrativamente **quando aplicável** (sem gate universal).  
3. Emitir **OS por serviço**.  
4. Agendamento persistente e ajustável.

### Proposta de arquitetura (não migrar agora)

```prisma
// Esboço — NÃO aplicar nesta entrega
model ProposalSignal { /* opcional; status esperado/solicitado/confirmado_financeiro/dispensado */ }
model ServiceOrder { /* uma por serviço; origem proposalId e/ou customerPurchaseOrderId */ }
model Schedule { /* data/hora, responsável, histórico de remarcações */ }
```

| Tema | Confirmado | Proposta | Pendente |
| --- | --- | --- | --- |
| Gate da OS | Aceite/contratação basta; sinal não bloqueia | `createServiceOrder` sem exigir sinal | — |
| Sinal | Opcional / recomendado avulso | Evento + solicitação ao Financeiro | %/valor típico |
| Pagamento | Só Financeiro confirma | Sem webhook automático | Forma do “recebido” |
| OS | 1 serviço → 1 OS | Cabeçalho + estados V1 | OS por visita física? |
| Agenda | Ajustável, persistente | `Schedule` + audit de remarque | Política de conflito |

### Fora da 11B

O.C. completa / contratos / financeiro amplo / RH / NF / Google Calendar / execução de campo.

## 11C — O.C., contratos, recorrência

### Objetivo — Confirmado como prioridade seguinte

1. Registrar **O.C. recebida** do cliente (avulsa ou ligada a contrato).  
2. Contratos periódicos e recorrência.  
3. Relacionar documentos comerciais (orçamento, O.C., contrato) às OS.

### Proposta de arquitetura (não migrar agora)

```prisma
model CustomerPurchaseOrder { /* número externo, customerId, opcional contractId / proposalId */ }
model Contract { /* vigência, periodicidade */ }
// OS pode nascer de Proposal aceita OU de CustomerPurchaseOrder / Contract
```

| Tema | Confirmado | Pendente |
| --- | --- | --- |
| O.C. não é só periódico | sim | Campos obrigatórios / anexo |
| O.C. não substitui OS | sim | — |
| Contratação sem orçamento interno | permitida | Fluxo de tela exato |
| Recorrência → visitas/OS | desejada | Automação vs manual |

### Fora da 11C

Financeiro amplo (AP/AR, DRE, Open Finance), RH, estoque, portal.

## Financeiro — fases próprias

Inventário completo das capturas: `sprint-11a-finance-inventory-2026-11-19.md`.  
**Não** confundir com 11C. Reutilizar User/Role/Customer; Supplier separado; Empresas a esclarecer; agendas financeira ≠ operacional.

## Ordem sugerida (proposta)

1. Aceite do checklist 11A na UI.  
2. Hotfix demo 10.2 (branch isolada) — alinhamento narrativo.  
3. **11B** após autorização explícita.  
4. **11C**.  
5. Financeiro F1… conforme inventário.  
6. RH.

## Hipóteses removidas do planejamento ativo

Sinal sempre obrigatório · Comercial confirma recebimento · O.C. só periódica · O.C. = OS · Agenda imutável.
