# Plano de limpeza HOMOL — resíduos Sprint 11A

**Estado:** proposta para **aprovação humana**. Nenhuma exclusão foi executada.  
**Inventário:** 2026-11-19 · `scripts/homol-residue-detail.mjs` · hostHash `22e5c2dd2d93` · org `servsam`

## Critério de elegibilidade

Somente registros cuja razão social / título começa com `[E2E]` ou `[GATEF]`, criados pelos testes automatizados da 11A (Playwright `sistema-core` e `gate-f-persistent-smoke`).  
Validação por **idHash** abaixo — não por limpeza ampla de organização nem por `TRUNCATE` / `migrate reset`.

## Inventário (máscaras; sem PII completa)

| # | Fonte | Cliente (hint) | idHash | Arquivado | Contatos | Unidades | Orçamento | Status | totalCents |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | e2e | `[E2E] Condomínio 760554` | `16e72833c801` | sim | 1 | 0 | `ORC-2026-0001` | accepted | 300000 |
| 2 | e2e | `[E2E] Condomínio 716926` | `ae831a0f0f9b` | sim | 1 | 0 | `ORC-2026-0002` | accepted | 300000 |
| 3 | gatef | `[GATEF] Cliente Homol 795902` | `3011a3744f54` | não | 1 | 1 | `ORC-2026-0003` | draft | 300000 |
| 4 | e2e | `[E2E] Condomínio 931843` | `84a558251e24` | sim | 1 | 1 | `ORC-2026-0004` | accepted | 300000 |
| 5 | gatef | `[GATEF] Cliente Homol 398561` | `0b07d1597331` | não | 1 | 1 | `ORC-2026-0005` | draft | 300000 |

Dependências por cliente: 1 contato cada; itens de proposta = 1 por orçamento; `relatedAuditLogCount` = 19 (somente leitura).  
Todos com `organizationMatches: true` (org SERVSAM).

## Operação proposta (após aprovação)

1. Reexecutar `node scripts/homol-residue-detail.mjs` e conferir que os **cinco idHash** de cliente e os códigos `ORC-2026-0001`…`0005` ainda batem.  
2. Em transação, **somente no HOMOL** (`DATABASE_ENV=preview` + `HOMOL_*`):
   - soft-delete (`deletedAt`) de `proposal_item` → `proposal` → `customer_contact` → `customer_unit` → `customer` **apenas** para os IDs confirmados; **ou**
   - se a política for manter trilha de auditoria sem reexibir na UI: arquivar orçamentos `draft` Gate F e filtrar prefixos na listagem de homologação (sem hard delete).  
3. **Não** apagar `AuditLog` (trilha de teste).  
4. **Não** tocar em usuários, papéis, organização, seed admin.  
5. **Não** apontar script para Production / store legado.  
6. Reinventar e anexar relatório “antes/depois” com contagens.

## Explicitamente fora

- `migrate reset`, `TRUNCATE`, drop de schema  
- Delete por `LIKE '%E2E%'` sem lista de IDs  
- Limpeza de toda a organização SERVSAM  
- Qualquer ação em Production

## Decisão solicitada

- [ ] Aprovar soft-delete dos 5 clientes + dependências listadas  
- [ ] Aprovar só arquivamento dos 2 Gate F ativos + filtro de UI  
- [ ] Manter resíduos visíveis até o fim da homologação do cliente  
- [ ] Outra (descrever)

Aprovador: _____________ Data: _____________
