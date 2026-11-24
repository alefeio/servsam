# 11B.2 HOMOL DEPLOY PASS

**Estado:** `11B.2 HOMOL DEPLOY PASS`  
**Data/hora (local):** 2026-11-24T17:19:19−03:00 → 2026-11-24T17:20:04−03:00  
**finished_at (UTC):** 2026-11-24T20:19:57.828Z  

## Código

| Campo | Valor |
| --- | --- |
| Branch | `fix/11b-2-qa-readiness` |
| SHA | `62e198b102ebae752ffdb7ac95b9c415861cc96c` |
| Working tree | limpa para deploy (apenas untracked `docs/presentation/apres-01-*`, fora do escopo) |
| Executor | `scripts/homol-migrate-11b2.mjs deploy` |
| Seed | **não** executado |

## Identidade do banco (anonimizada)

| Campo | Valor |
| --- | --- |
| database | `postgres` |
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| organização | `servsam` |
| CLI = preflight | sim |
| Production | não modificado |

## Gate 1 — Preflight

- evaluation.ok: true · blockers: []
- pendingCount: **1** → `20261124010000_service_orders`
- `service_order` ausente antes
- Contagens antes: customer **28** · proposal **21** · engagement **7** · received_purchase_order **4**

## Gate 2 — Execução

```text
Applying migration `20261124010000_service_orders`
All migrations have been successfully applied.
DEPLOY_EXIT=0
```

## Gate 3 — Auditoria

| Verificação | Resultado |
| --- | --- |
| `_prisma_migrations` | registrada |
| `finished_at` | 2026-11-24T20:19:57.828Z |
| `rolled_back_at` | null |
| tabela `service_order` | presente |
| enum `ServiceOrderStatus` | presente |
| unique parcial `service_order_active_engagement_item_unique` | presente |
| FKs | organization, engagement, engagement_item, customer, customer_unit |
| índices | pkey + 5 índices + unique parcial |
| pendentes | **0** |
| contagens depois | customer 28 · proposal 21 · engagement 7 · OC 4 · service_order **0** |
| users / role_permission | 2 / 132 (sem seed) |

## Gate 4 — Compatibilidade (somente leitura)

- Queries de contratação + itens: OK (ex.: CTR-2026-0005..0007)
- `SELECT` em `service_order`: OK (0 linhas)
- Grants `service_order.*`: 12
- Usuários ativos: 2 (login disponível no banco)
- Preview HEAD `62e198b`: GitHub/Vercel **success**  
  URL: https://servsam-hgxucy008-alefeios-projects.vercel.app  
  Alias branch: https://servsam-git-fix-11b-2-qa-readiness-alefeios-projects.vercel.app  
- Proteção Vercel Authentication ativa (HTTP 302 → login Vercel)
- **OS de teste não criada** (conforme escopo)

## Riscos remanescentes

1. Emissão manual controlada de OS ainda não autorizada nesta execução.
2. Preview protegido exige autenticação Vercel para validação UI humana.
3. Sprint 11B.3 (agenda) não iniciada.

## Autorização

Autorização humana explícita do responsável para aplicar somente `20261124010000_service_orders` no HOMOL aprovado, sem seed/reset/Production.
