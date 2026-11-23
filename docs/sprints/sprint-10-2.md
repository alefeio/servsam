# Sprint 10.2 — Adequação da demonstração (Orçamento, sinal, agenda e RH)

> **Atualização DEMO-HF (`hotfix/demo-10-2-signal-oc`):** o feedback de 19/11/2026 superou a hipótese “sinal obrigatório antes da OS” e “O.C. só em periódico”. O fluxo vigente da demo está no roteiro `sprint-10-2-client-demo-guide.md` e no relatório `demo-hf-10-2-report.md`. O texto abaixo descreve o escopo original da 10.2 e aponta o que o hotfix corrigiu.

A Sprint 10.1 alinhou a demonstração aos documentos operacionais. A 10.2 atualizou `/demonstracao` (fixture + `localStorage`): Orçamento como ponto de partida, sinal demonstrativo, agenda em calendário, O.C. e RH ampliado.

Somente `/demonstracao`. Sem modelo novo no Prisma. `/sistema` fora. Google Calendar desligado.

## Fluxo vigente após o hotfix (19/11/2026)

```text
Orçamento → Aceite → (opcional) solicitação Comercial → (opcional) confirmação Financeiro
                  └→ OS → Agendamento/remarcação → Execução → Entregáveis

O.C. recebida do cliente (avulso | periódico | sem orçamento interno) → contratação → OS
```

- Sinal é **recomendado** quando aplicável; **não** bloqueia universalmente a OS.
- Comercial solicita; Financeiro confirma (eventos simulados).
- O.C. é documento do contratante ≠ orçamento SERVSAM ≠ OS.
- Agenda permite remarcar com histórico no `localStorage`.

## O que a 10.2 original entregou

1. Nomenclatura **Orçamento** na UI (internamente `DemoProposal`; rotas `/comercial/propostas`).
2. Indicadores comerciais derivados.
3. Registro demonstrativo do sinal (a 10.2 ainda tratava o sinal como pré-requisito da OS — **corrigido no hotfix**).
4. Emissão da OS separada do agendamento.
5. Agenda dia/semana/mês.
6. O.C. em contratos periódicos (a 10.2 ainda não cobria O.C. avulsa/direta — **ampliado no hotfix**).
7. RH estruturado (férias, faltas, atestados, advertências, suspensões, ocorrências fictícias).

## O que continua pendente do cliente

- Se cada visita física distinta exige OS separada.
- Política fina de bloqueio por conflito de agenda.
- Percentuais / formas de pagamento reais.
- Escopo completo do Financeiro na V1.

## Compatibilidade

- Hotel Amazonas e jornadas 10 / 10.1 preservados.
- Massa antiga no `localStorage` via hydrate/merge (inclui `receivedPurchaseOrders` e `scheduleHistory` após o hotfix).

## Fora desta sprint / do hotfix

- Domínios no Prisma, cobrança real, NF-e, Google Calendar, merge automático em `main`, Production.
