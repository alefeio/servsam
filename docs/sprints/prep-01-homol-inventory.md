# PREP-01 / APRES-01 — Inventário HOMOL (somente leitura)

**Atualizado em:** 2026-11-23 (APRES-01)  
**Host fingerprint:** `22e5c2dd2d93`  
**Org:** `servsam`  
**`DATABASE_ENV`:** `preview`  
**Script:** `scripts/homol-presentation-inventory.mjs`  
**Sem exclusão, TRUNCATE, migration, Production ou provisionamento nesta leitura.**

## Contagens

| Métrica | Valor |
| --- | --- |
| Usuários | 2 (ativos, Diretoria) |
| Clientes totais | 12 |
| Clientes ativos | 4 |
| Clientes arquivados | 8 |
| Contatos ativos | 12 |
| Unidades ativas | 10 |
| Orçamentos | 12 (`accepted` 8, `draft` 4) |
| Audit logs | 263 |

## Classificação por kind (ativos / arquivados)

| Kind | Ativos | Arquivados |
| --- | --- | --- |
| APRES | 0 | 0 |
| E2E | 2 | 8 |
| GATEF | 2 | 0 |
| OTHER | 0 | 0 |

## Resíduos ativos (aparecem na UI padrão)

| idHash | Hint | Kind | Orç. |
| --- | --- | --- | --- |
| `96c605c9dfe8` | `[E2E] Condomínio 699154` | E2E | 1 draft |
| `2693f237ebb1` | `[E2E] Condomínio 515706` | E2E | 1 draft |
| `0b07d1597331` | `[GATEF] Cliente Homol 398561` | GATEF | 1 draft |
| `3011a3744f54` | `[GATEF] Cliente Homol 795902` | GATEF | 1 draft |

## Observações para apresentação

- Painel “Clientes ativos” = 4, todos resíduos técnicos até o provisionamento `[APRES]` autorizado.
- O Painel contabiliza o ambiente inteiro; não se altera a fórmula para omitir E2E/GATEF.
- Plano `[APRES]`: `docs/presentation/apres-01-dataset-plan.md`.
- Runbook: `docs/presentation/apres-01-runbook.md`.

## Proposta segura (não executada nesta etapa)

1. Autorizar `CONFIRM=YES APRES_DATA_AUTHORIZE=YES` no script `homol-provision-apres01.mjs`.  
2. Opcional depois: soft-archive seletivo de resíduos (plano separado).  
3. **Não** apagar `AuditLog`.  
4. Manter usuários Diretoria intactos.
