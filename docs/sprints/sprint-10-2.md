# Sprint 10.2 — Adequação da demonstração (Orçamento, sinal, agenda e RH)

A Sprint 10.1 alinhou a demonstração aos documentos operacionais. As prioridades seguintes pedem Orçamento como ponto de partida comercial, registro do sinal antes da OS, agenda em calendário, O.C. nos contratos periódicos e RH ampliado.

Esta sprint atualiza somente `/demonstracao`, em fixture e `localStorage`. Não há modelo novo no Prisma. `/sistema` não recebe esses fluxos. A home pública não muda. Google Calendar continua desligado. O financeiro amplo aguarda orientação; só o mínimo do sinal entra agora.

## Fluxo principal para validação

```text
Orçamento → Aceite → Registro do sinal → OS → Agendamento → Execução → Entregáveis
```

Contratos periódicos (paralelo): Contrato → O.C. vinculada → visitas/agenda. A emissão de OS individual por visita permanece pendente de validação do cliente.

## O que a demonstração passa a mostrar

1. Nomenclatura **Orçamento** na interface (internamente `DemoProposal`; rotas `/comercial/propostas` preservadas). “Proposta Comercial” pode aparecer em documentos.
2. Indicadores comerciais derivados: emitidos, aceitos, convertidos em contratação, taxa de conversão e valores em negociação.
3. Registro demonstrativo do sinal após o aceite, liberando a emissão da OS. Sem cobrança real.
4. Emissão da OS separada do agendamento: OS emitida sem data fictícia automática.
5. Agenda com visualização em calendário (dia/semana/mês), só dados locais.
6. Ordem de Compra (O.C.) associada a contratos periódicos, distinta da OCS/formalização do orçamento avulso.
7. RH em Colaboradores: férias, faltas, atestados, advertências, suspensões e ocorrências estruturadas, só com dados fictícios e sem informação clínica sensível.

## O que continua hipótese

- Exceções à exigência do sinal antes da OS.
- Se cada visita de contrato/O.C. gera OS individual.
- Escopo completo do Financeiro.

Lista em `docs/content/pending-client-validation.md` e roteiro `docs/sprints/sprint-10-2-client-demo-guide.md`.

## Compatibilidade

- Hotel Amazonas e jornadas das Sprints 10 e 10.1 preservados.
- Menu mobile e correção do React #185 mantidos.
- Massa antiga no `localStorage` continua válida via hydrate/merge.

## Fora desta sprint

- Domínios de negócio no Prisma.
- Cobrança real, NF-e, integração Google Calendar.
- Merge automático em `main` (somente Preview Vercel).
- Financeiro além do mínimo do sinal.
