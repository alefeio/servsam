# APRES-01 — Plano da massa fictícia de apresentação

**Branch:** `prep/apres-01-homol-presentation-data`  
**Base:** `fix/sec-p0-last-admin-concurrency` @ `c40ae97`  
**SHA APRES-01.1a:** `ef35f3cc361cc1939a49bb9a0cfd98051dc6388c`  
**Preview protegido:** https://servsam-cy8kc2wo0-alefeios-projects.vercel.app  
**Estratégia:** B (`docs/sprints/prep-01-1-presentation-data-strategy.md`) — manter HOMOL + cenários `[APRES]`  
**Estado APRES-01.1a:** lock de sessão dedicada. **Sem escrita no HOMOL nesta entrega.**

## 1. Inventário (somente leitura)

Script: `scripts/homol-presentation-inventory.mjs` (com Gate A de identidade)

| Checagem | Resultado |
| --- | --- |
| `DATABASE_ENV` | `preview` |
| Host fingerprint | `22e5c2dd2d93` |
| Instance ID (aprovado via env) | obrigatório — ver `HOMOL_APPROVED_INSTANCE_ID` |
| Organização | `servsam` |
| `[APRES]` existentes | 0 |
| Resíduos ativos | 2 `[E2E]` + 2 `[GATEF]` |
| Resíduos arquivados | 8 `[E2E]` |
| Clientes ativos totais | 4 (todos resíduos técnicos) |
| Orçamentos | 12 (`accepted` 8, `draft` 4) |

Detalhe: `docs/sprints/prep-01-homol-inventory.md`.

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

## 5. Mecanismo (APRES-01.1)

- Identidade: `scripts/lib/homol-identity.mjs` + `scripts/homol-print-instance-id.mjs`
- Guardas: `src/lib/platform/apres-01-guards.ts`
- Plano: `src/lib/platform/apres-01-plan.ts`
- Script: `scripts/homol-provision-apres01.mjs`
  - Dry-run por padrão.
  - Escrita: `CONFIRM=YES` + `APRES_DATA_AUTHORIZE=YES` + `APRES_ACTOR_EMAIL`.
  - Ator pretendido (mediante autorização): `alexandrefpenha@gmail.com` — sem auto-seleção, sem seed.
  - Advisory lock em `pg.Client` dedicado (não pool Prisma); `assertAlive` entre cenários; `finally` na mesma sessão.
  - Revalidação do plano; progresso por cenário; retomada idempotente.
  - Serviços de negócio apenas; sem `UPDATE` artificial de aceito; numeração oficial preservada.

### Verificações que impedem banco incorreto

1. `approved_instance_id_missing` — falta `HOMOL_APPROVED_INSTANCE_ID` no env.
2. `instance_id_mismatch` — `sha256(system_identifier:current_database)` live ≠ aprovado.
3. `unexpected_homol_host_hash` — host ≠ `22e5c2dd2d93`.
4. `target_matches_legacy_runtime_url` — fingerprint da URL completa igual ao `RUNTIME_DATABASE_URL` legado.
5. `refusing_production` / `DATABASE_ENV must be preview`.

Observação: em Prisma Postgres o pathname da URL é genérico; a separação legado×HOMOL usa o hash da URL completa + `instanceId` (`system_identifier` + `current_database()`).

Hostname sozinho **não** libera escrita.

## 6. Autorização necessária para provisionar

```bash
CONFIRM=YES APRES_DATA_AUTHORIZE=YES APRES_ACTOR_EMAIL=alexandrefpenha@gmail.com npx tsx scripts/homol-provision-apres01.mjs
```

Até autorização humana: apenas inventário e dry-run.

## 7. Qualidade (sem escrita HOMOL)

| Comando | Resultado |
| --- | --- |
| Inventário + identidade | PASS (`instanceId` + marcadores + ≠ legado) |
| Dry-run | `awaiting_authorization` (0 writes) |
| Lock concorrente (integração) | PASS — A segura, B recusado, A libera, B adquire |
| Lock + erro + finally | PASS — B adquire após falha de A |
| Sessão perdida | PASS — `assertAlive` / acquire bloqueiam |
| `npm run lint` / `typecheck` / `test` / `build` | PASS (150 unit; integração lock ok) |

Gate: **APRES-01.1a READY FOR WRITE AUTHORIZATION**

### Riscos remanescentes

- Atomicidade global inexistente (transações por serviço); retomada depende de idempotência.
- Pooler de transação incompatível com session lock — exige URL HOMOL direta.
- Escrita ainda depende de autorização humana explícita (`CONFIRM` + `APRES_DATA_AUTHORIZE` + ator).
