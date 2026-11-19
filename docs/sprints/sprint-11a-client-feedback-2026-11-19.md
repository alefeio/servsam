# Consolidação do feedback do cliente — 19/11/2026

**Branch:** `sprint-11a-persistent-core`  
**Referência remota:** `083a1fe` (+ este commit documental)  
**Escopo deste pacote:** só documentação e planos. Sem migration, sem limpeza HOMOL, sem merge `main`, sem Sprint 11B.

## 1. Regras comerciais confirmadas

### Sinal

| Regra | Status |
| --- | --- |
| Não é obrigatório em todos os casos | **Confirmado** |
| Recomendado em serviços avulsos | **Confirmado** |
| Ausência do sinal **não** bloqueia universalmente a emissão da OS | **Confirmado** |
| Comercial solicita nota / trâmite ao Financeiro | **Confirmado** |
| Financeiro confirma se o pagamento foi recebido (quando aplicável) | **Confirmado** |
| Confirmação automática de pagamento | **Proibido** nesta etapa |
| Presumir sinal de 50% | **Proibido** |
| Emissão fiscal real | **Fora** desta etapa |

Três acontecimentos distintos:

1. **Aceite comercial** (orçamento / contratação).  
2. **Solicitação administrativa/fiscal ao Financeiro** (nota / cobrança do sinal quando houver).  
3. **Confirmação do pagamento pelo Financeiro**, quando aplicável.

### Ordem de Compra (O.C.)

| Regra | Status |
| --- | --- |
| O.C. é documento **recebido** do contratante quando já há contratação/proposta fechada | **Confirmado** |
| O.C. **não** é exclusiva de contratos periódicos | **Confirmado** |
| Orçamento SERVSAM ≠ O.C. ≠ OS | **Confirmado** |
| Pode haver contratação com O.C. **sem** orçamento interno prévio obrigatório | **Confirmado** |
| Cada serviço possui uma OS | **Confirmado** |
| Visitas físicas distintas de um mesmo serviço exigem OS separadas? | **Pendente** |

### Agenda

| Regra | Status |
| --- | --- |
| Não integrar Google Calendar | **Confirmado** |
| Permitir alterar data/horário; persistir | **Confirmado** |
| Registrar responsável e histórico de remarcações | **Confirmado** |
| Impedir inconsistências de data/status | **Confirmado** |
| Conflitos de equipe/horário explícitos, sem política definitiva de bloqueio inventada | **Confirmado** (política fina ainda **pendente**) |
| Drag-and-drop obrigatório | **Não exigido** — o confirmado é conseguir ajustar agendamentos |

### Hipóteses **superadas** (remover do planejamento ativo)

- Sinal sempre obrigatório antes da OS.  
- Comercial confirma recebimento do pagamento.  
- O.C. só em contrato periódico.  
- O.C. substitui OS.  
- Agendamento sem possibilidade de alteração.

## 2. Alterações de fluxo (modelo mental)

```text
[Orçamento SERVSAM] ──aceite──► contratação
        │                         │
        │                         ├── (opcional) solicitação ao Financeiro / sinal
        │                         │         └── confirmação de pagamento (Financeiro)
        │                         │
        └── ou entrada com O.C. do cliente (sem orçamento interno obrigatório)
                                  │
                                  ▼
                         OS por serviço ──► Agendamento persistente (ajustável)
```

Arquitetura deve aceitar OS originada de **orçamento aceito** **ou** de **contratação formalizada pelo cliente** (ex.: O.C.).

## 3. Inventário financeiro (capturas)

Ver `docs/sprints/sprint-11a-finance-inventory-2026-11-19.md`.  
Nenhuma tabela financeira criada nesta etapa.

## 4. Roadmap revisado

| Entrega | Escopo |
| --- | --- |
| **11B** | Contratação, registro administrativo do sinal quando aplicável, OS por serviço, agendamento persistente |
| **11C** | O.C. recebida, contratos, recorrência, relação documentos comerciais ↔ OS |
| **Financeiro** | Fases próprias conforme inventário das capturas |
| **RH** | Posterior, com permissões para dados sensíveis |

Detalhe: `sprint-11a-contracts-11b-11c.md`.

## 5. Pendências ainda existentes

- Visitas físicas vs quantidade de OS no mesmo serviço.  
- Política fina de conflito de agenda (alerta vs bloqueio).  
- Percentual/valor típico do sinal quando recomendado (não fixar 50%).  
- Interpretação de “Empresas” no financeiro (multiempresa?).  
- Priorização e fases do inventário financeiro / Open Finance / NF.  
- Aceite formal do checklist 11A pelo cliente na UI.  
- Datas de abertura de 11B/11C.

## 6. Demonstração 10.2

Plano de hotfix isolado (sem aplicar aqui): `sprint-10-2-signal-oc-hotfix-plan.md`.

## 7. Acesso à homologação 11A

Procedimento atualizado: `sprint-11a-client-access-runbook.md` (seção “Responsável do projeto”).  
Credenciais **não** estão neste repositório nem nesta conversa.
