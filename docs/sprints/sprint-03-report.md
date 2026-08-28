# Relatório da Sprint 3

**Data:** 28 de agosto de 2026  
**Responsável:** Alexandre Feio (execução assistida no Cursor)

## 1. Resultado

A Sprint 3 foi entregue: fluxo comercial demonstrativo do lead à proposta, com kanban de oportunidades, fichas de cliente com múltiplas unidades, propostas com itens e ações simuladas persistidas no navegador.

## 2. Massa e entidades novas

| Entidade | Quantidade |
| --- | --- |
| Leads | 12 |
| Unidades de cliente | 9 |
| Itens de proposta | 10 |

Extensões em `DemoDataset`: `clientUnits`, `leads`, `proposalItems`.

## 3. Telas entregues

- `/demonstracao/comercial` — hub comercial
- `/demonstracao/comercial/leads` — filtros e qualificação
- `/demonstracao/comercial/oportunidades` — kanban
- `/demonstracao/comercial/oportunidades/[id]` — ficha de oportunidade
- `/demonstracao/comercial/propostas` — lista de propostas
- `/demonstracao/comercial/propostas/[id]` — detalhe com itens e ações
- `/demonstracao/clientes` — lista de clientes
- `/demonstracao/clientes/[id]` — ficha com unidades

## 4. Ações simuladas

- Qualificar/descartar lead
- Avançar, ganhar, perder e reabrir oportunidade
- Enviar, aceitar e recusar proposta
- Persistência via `localStorage` e restauração pelo shell demo

## 5. Principais arquivos

- `src/types/demo-entities.ts`
- `src/data/demo/leads.ts`, `client-units.ts`, `proposal-items.ts`
- `src/lib/demo/crm-actions.ts`, `validate-dataset.ts`
- `src/features/crm/*`, `src/features/clients/*`

## 6. Testes

Novos: `crm-actions.test.ts`. Atualizado: `validate-dataset.test.ts`.

## 7. Próximo passo

Sprint 4 — agenda administrativa e ordens de serviço desktop.
