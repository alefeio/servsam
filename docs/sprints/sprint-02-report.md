# Relatório da Sprint 2

**Data:** 28 de agosto de 2026  
**Responsável:** Alexandre Feio (execução assistida no Cursor)

## 1. Resultado

A Sprint 2 foi entregue: massa demonstrativa coerente em `src/data/demo/`, métricas derivadas no dashboard executivo, filtro de período, restauração funcional da massa via localStorage e testes de validação/referências.

## 2. Massa demonstrativa

| Entidade | Quantidade |
| --- | --- |
| Clientes | 12 |
| Oportunidades | 25 |
| Propostas | 15 |
| Ordens de serviço | 18 |
| Contratos | 6 |
| Documentos | 8 |
| Produtos | 12 |
| Transações financeiras | 24 |

Todos com `provenance` `DEMO_FICTIONAL` e IDs estáveis. Três clientes reutilizam aliases dos cases da Sprint 1 (Rio Guamá, Horizonte Amazônia, Porto Verde).

## 3. Dashboard executivo

Indicadores derivados da massa (não hardcoded):

- Cards: faturamento, propostas abertas, taxa de conversão, serviços agendados, contratos a vencer, inadimplência
- Gráficos em barras CSS: receita por mês, vendas por categoria
- Funil comercial (Lead → Fechado/Perdido)
- Agenda resumida, alertas (documentos, propostas, OS atrasadas, estoque, contratos)
- Ranking de produtividade fictício por técnico
- Filtro de período demonstrativo (jun–ago/2026)

## 4. Principais arquivos

- `src/types/demo-entities.ts`
- `src/data/demo/clients.ts`, `opportunities.ts`, `proposals.ts`, `work-orders.ts`, `contracts.ts`, `documents.ts`, `products.ts`, `financial-transactions.ts`, `demo-dataset.ts`
- `src/lib/demo/validate-dataset.ts`, `metrics.ts`, `dataset-store.ts`
- `src/features/dashboard/dashboard-view.tsx`, `use-demo-dataset.ts`
- `src/lib/repositories/demo-repository.ts` (atualizado)

Removido: `dashboard-snapshot.ts` (substituído por derivação).

## 5. Restauração

O botão **Restaurar dados demonstrativos** limpa `servsam.demo.dataset` no localStorage e notifica o dashboard via `useSyncExternalStore`, recarregando a massa seed.

## 6. Testes e comandos

| Comando | Resultado |
| --- | --- |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npm test` | 20 testes em 9 arquivos, passou |
| `npm run build` | passou (40 páginas estáticas) |

Novos testes: `validate-dataset.test.ts`, `metrics.test.ts`.

## 7. Fora do escopo (mantido)

- CRM interativo (Sprint 3)
- Telas completas de módulos
- Mobile de campo (projeto futuro separado)
- Banco de dados / API real

## 8. Próximo passo

Sprint 3 — CRM demonstrativo (leads, oportunidades, propostas navegáveis).
