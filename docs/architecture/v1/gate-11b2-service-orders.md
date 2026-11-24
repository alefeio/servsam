# Gate 11B.2 — Ordens de Serviço reais

Status: **11B.2 READY FOR REVIEW**

## Branch

| Item | Valor |
|---|---|
| Branch | `feature/11b-2-service-orders` |
| Base | `137e11c` (`feature/11b-real-commercial-operations`) |
| SHA | `b51a8a4df8fb61ac0c3756424af1e8ae54c7d203` |
| Merge em `main` | não |

## Quality Gate

| Check | Resultado |
|---|---|
| lint / typecheck / unit / build | OK |
| integration | 27 passed; suíte OS completa **skipped** até migration HOMOL |
| E2E escrita | skip consciente (sem banco isolado) |
| Grants `service_order.*` | 12/12 já concedidos |
| Migration HOMOL | **não aplicada** — aguarda autorização |

## Gate 0 — Isolamento E2E

Ver `gate-11b2-e2e-isolation.md`.

- Sem banco isolado provisionado; nova infra paga não autorizada.
- Specs de escrita fazem **skip** fora de `DATABASE_ENV=test` + `E2E_ISOLATED_*`.
- Resíduos `[E2E]` no HOMOL não são limpos.
- Evidência de domínio: integração com orgs descartáveis (após migration autorizada).

## Schema

Modelo `ServiceOrder` + enum `ServiceOrderStatus` (`issued`, `scheduled`, `in_progress`, `completed`, `cancelled`).

- Código `OS-AAAA-NNNN` via `document_sequence` (`service_order`).
- Vínculos: `engagementId`, `engagementItemId`, cliente/unidade.
- Unique parcial: uma OS ativa por `engagementItemId` (`status <> cancelled` e `deletedAt IS NULL`).
- Quantidade contratada é referência; não vira visitas.

Migration proposta (não aplicada ao HOMOL neste fechamento):

`prisma/migrations/20261124010000_service_orders/migration.sql`

Preflight: `node scripts/preflight-11b2-service-orders-migration.mjs`

## Operações

- Create / list / detail / by engagement / cancel (só `issued` → `cancelled`) / history.
- Auditoria: `SERVICE_ORDER_CREATED`, `SERVICE_ORDER_CANCELLED`.
- Sem transições de agenda/execução nesta sprint.

## Rotas

- `/sistema/ordens-servico`
- `/sistema/ordens-servico/[id]`
- Contratação: coluna OS + **Emitir OS** por item elegível

## Permissões

Reuso: `service_order.view|create|update` (já no seed Administrativo).

Preflight: `node scripts/preflight-11b2-service-order-grants.mjs`

## Pendências de implantação HOMOL

1. Autorizar e aplicar migration `20261124010000_service_orders`.
2. Confirmar grants (preflight); escrever só com autorização.
3. Provisionar banco isolado para E2E de escrita (sem custo novo sem autorização).

## Fora de escopo

11B.3 agenda, financeiro, execução técnica, certificado/PDF, `/demonstracao`, Production, merge `main`.
