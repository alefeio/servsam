# APRES-01 — Plano da massa fictícia de apresentação

**Branch:** `prep/apres-01-homol-presentation-data`  
**Base:** `fix/sec-p0-last-admin-concurrency` @ `c40ae97`  
**Estratégia:** B (`docs/sprints/prep-01-1-presentation-data-strategy.md`) — manter HOMOL + cenários `[APRES]`  
**Estado:** preparado (dry-run). **Sem escrita no HOMOL nesta entrega.**

## 1. Inventário (somente leitura)

Script: `scripts/homol-presentation-inventory.mjs`

| Checagem | Resultado |
| --- | --- |
| `DATABASE_ENV` | `preview` |
| Host fingerprint | `22e5c2dd2d93` |
| Organização | `servsam` |
| `[APRES]` existentes | 0 |
| Resíduos ativos | 2 `[E2E]` + 2 `[GATEF]` |
| Resíduos arquivados | 8 `[E2E]` |
| Clientes ativos totais | 4 (todos resíduos técnicos) |
| Orçamentos | 12 (`accepted` 8, `draft` 4) |

Detalhe atualizado: `docs/sprints/prep-01-homol-inventory.md`.

## 2. Três cenários fictícios

Identificação estável: `legalName` / `title` com prefixo `[APRES]` + `scenarioKey` nas notas.  
Sem CPF/CNPJ (omitidos de propósito). Contatos com e-mail `@apresentacao.servsam.local`. Endereços inventados.

### Cenário A — Condomínio fictício

| Campo | Valor |
| --- | --- |
| Cliente | `[APRES] Condomínio Demonstrativo Verde` |
| Contato | Contato Demonstrativo Alfa (síndico fictício) |
| Unidade | Torre Demonstrativa A — Belém/PA |
| Orçamento | `[APRES] Higienização avulsa — Condomínio Demonstrativo Verde` |
| Status alvo | `accepted` (via `draft` → `sent` → `accepted`) |
| Total | R$ 4.500,00 (`450000` cents) |
| Uso | Origem comercial da futura OS (OS ainda não persistente) |

### Cenário B — Hotel fictício

| Campo | Valor |
| --- | --- |
| Cliente | `[APRES] Hotel Demonstrativo Horizonte` |
| Contato | Contato Demonstrativo Beta |
| Unidade | Unidade Hoteleira Demonstrativa |
| Orçamento | `[APRES] Sanitização — Hotel Demonstrativo Horizonte` |
| Status alvo | `sent` |
| Total | R$ 6.800,00 (`680000` cents) |
| Uso | Negociação; O.C. externa só na DEMO-HF.1 (`/demonstracao`) |

### Cenário C — Empresa fictícia

| Campo | Valor |
| --- | --- |
| Cliente | `[APRES] Empresa Demonstrativo Porto Industrial` |
| Contato | Contato Demonstrativo Gama |
| Unidade | Planta Demonstrativa 1 — Ananindeua/PA |
| Orçamento | `[APRES] Serviços periódicos — Empresa Demonstrativo Porto Industrial` |
| Status alvo | `draft` |
| Total | R$ 8.600,00 (`860000` cents) = 12×450 + 4×800 |
| Uso | Periódico em rascunho; contrato/recorrência só na demo até sprints próprias |

## 3. Quantidade esperada de registros novos (1ª execução)

| Entidade | Qtd. |
| --- | --- |
| Clientes | +3 |
| Contatos | +3 |
| Unidades | +3 |
| Orçamentos | +3 (códigos oficiais `ORC-2026-00xx` via `nextProposalCode`) |
| Transições | 3 (`A`: sent+accepted, `B`: sent) |
| Usuários / papéis | 0 |
| Auditoria | entradas coerentes com o ator Diretoria (sem limpeza) |

Reexecução: 0 criações se já no alvo (idempotente).

## 4. Impacto esperado nos indicadores do Painel

O Painel (`/sistema`) usa `countActiveCustomers` e `getProposalSummary` sobre **todo** o ambiente.

| Indicador | Antes (leitura APRES-01) | Depois (se autorizado) |
| --- | --- | --- |
| Clientes ativos | 4 | 7 (+3 `[APRES]`; resíduos permanecem) |
| Orçamentos `draft` | 4 | 5 |
| Orçamentos `sent` | 0 | 1 |
| Orçamentos `accepted` | 8 | 9 |
| Orçamentos totais | 12 | 15 |

**Não** se altera a fórmula dos indicadores nem se excluem resíduos para “melhorar” o número.

## 5. Mecanismo

- Plano puro: `src/lib/platform/apres-01-plan.ts` (+ testes isolados).
- Script: `scripts/homol-provision-apres01.mjs`
  - Padrão: `--dry-run` / sem `CONFIRM` → nenhuma escrita.
  - Escrita: `CONFIRM=YES` **e** `APRES_DATA_AUTHORIZE=YES`.
  - Usa `createCustomer`, `addCustomerContact`, `addCustomerUnit`, `createProposal`, `transitionProposal`.
  - Não faz `UPDATE` direto de status aceito; não cria usuários; não roda migration/seed.

## 6. Autorização necessária para provisionar

Autorização humana explícita posterior, com ambos:

```bash
CONFIRM=YES APRES_DATA_AUTHORIZE=YES npx tsx scripts/homol-provision-apres01.mjs
```

Até lá: apenas inventário e dry-run.

## 7. Qualidade (sem escrita HOMOL)

| Comando | Resultado |
| --- | --- |
| Inventário read-only | PASS (`22e5c2dd2d93`, org `servsam`) |
| Dry-run provision | `awaiting_authorization` (0 writes) |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | 136 PASS (incl. idempotência APRES-01) |
| `npm run build` | PASS |
| E2E pertinentes (`public-routes`, `demo-system`) | 5 PASS |

Gate: **APRES-01 READY FOR DATA AUTHORIZATION**
