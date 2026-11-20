# PREP-01 — Inventário HOMOL (somente leitura)

**Data:** 2026-11-20  
**Host fingerprint:** `22e5c2dd2d93`  
**Org:** `servsam`  
**Script:** `scripts/homol-presentation-inventory.mjs`  
**Sem exclusão, TRUNCATE, migration ou Production.**

## Contagens

| Métrica | Valor |
| --- | --- |
| Usuários | 2 (ambos ativos, perfil Diretoria) |
| Clientes totais | 7 |
| Clientes ativos | 2 |
| Clientes arquivados | 5 |
| Contatos ativos | 7 |
| Unidades ativas | 5 |
| Orçamentos | 7 (5 `accepted`, 2 `draft`) |
| Audit logs | 209 |

## Resíduos de teste

### Ativos (aparecem na UI padrão)

| idHash | Hint | Kind | Orç. | Contatos | Unidades |
| --- | --- | --- | --- | --- | --- |
| `0b07d1597331` | `[GATEF] Cliente Homol 398561` | GATEF | 1 draft | 1 | 1 |
| `3011a3744f54` | `[GATEF] Cliente Homol 795902` | GATEF | 1 draft | 1 | 1 |

### Arquivados (só com filtro)

5 clientes `[E2E]` com orçamentos `accepted` (`ORC-2026-0001`…`0002`, `0004`, `0006`, `0007`).

**Candidatos “OTHER” para apresentação:** nenhum.

## Inconsistências / observações

- Painel “Clientes ativos” = 2, mas ambos são resíduos Gate F — narrativa de demo fica técnica.  
- Orçamentos aceitos de E2E arquivados ainda existem (cliente arquivado; proposta não necessariamente arquivada).  
- Não há bloqueio inventariado de arquivamento nesta leitura; a regra de negócio “cliente com orçamento em andamento” permanece no código.

## Proposta segura (não executada)

1. Autorizar soft-delete/arquivamento seletivo dos 7 clientes `[E2E]`/`[GATEF]` + dependências (ver `sprint-11a-homol-cleanup-plan.md`, atualizar idHashes).  
2. **Não** apagar `AuditLog`.  
3. Após limpeza, cadastrar **2–3 clientes fictícios** de apresentação (sem PII real) + orçamentos rascunho/enviado/aceito.  
4. Manter usuários Diretoria intactos.  
5. Reexecutar inventário antes/depois.

## Decisão solicitada

- [ ] Aprovar limpeza seletiva dos resíduos  
- [ ] Manter resíduos e aceitar Painel “sujo” na apresentação  
- [ ] Outra: _____________
