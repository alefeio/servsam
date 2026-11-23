# Gate 11B.1 — Contratação real e O.C. recebida

Status: **11B.1 PUBLISHED — READY FOR FINAL REVIEW**

## Branch e publicação

| Item | Valor |
|---|---|
| Branch | `feature/11b-real-commercial-operations` |
| Base | `c40ae97` (`fix/sec-p0-last-admin-concurrency`) |
| SHA remoto | `b0985db0c35ca8e726a9bb3dc00ca545d61b2207` |
| Preview | https://servsam-k6v1btwnr-alefeios-projects.vercel.app (protegido) |
| Remoto | publicado sem force push; sem merge em `main` |

## Quality Gate (fechamento)

| Check | Resultado |
|---|---|
| lint / typecheck / unit / integration / build | OK (execução pré-push) |
| E2E `sistema-11b1` fluxos A e B | 2 passed (`npm run test:e2e:preview`) |
| Auditoria migration | registrada; 11A íntegra |
| Grants HOMOL `contract.*` | 8/8 já concedidos; sem escrita necessária |

## Escopo entregue

No `/sistema` autenticado (PostgreSQL + RBAC + auditoria):

1. **Origem A** — orçamento `accepted` → “Gerar contratação”.
2. **Origem B** — registrar O.C. recebida do contratante → “Gerar contratação” (sem orçamento interno).

Não inclui OS, agenda, financeiro de sinal nem painel 11B.5.

## Modelos

| Entidade | Tabela | Código |
|---|---|---|
| O.C. recebida | `received_purchase_order` (+ itens) | `OC-AAAA-NNNN` |
| Contratação | `engagement` (+ itens) | `CTR-AAAA-NNNN` |

Origens: `proposal` | `purchase_order`.

Unicidade:

- uma contratação por `proposalId`;
- uma contratação por `purchaseOrderId`;
- O.C. ativa única por `(organizationId, customerId, externalNumber)` (índice parcial);
- itens com `id` UUID estável (base para múltiplas OS na 11B.2).

## Migration — auditoria da aplicação antecipada

Arquivo: `prisma/migrations/20261123140000_engagements_purchase_orders/migration.sql`

Auditoria somente leitura (`node scripts/audit-11b1-migration.mjs`), 23/11/2026:

| Checagem | Resultado |
|---|---|
| Ambiente | `preview` / host hash `22e5c2dd2d93` |
| Organização | `servsam` presente |
| Production | não tocada |
| `_prisma_migrations` | registrada em `2026-11-23T17:03:11.190Z`, sem rollback |
| Tabelas 11A | presentes; contagens preservadas (ex.: 15 customers, 15 proposals) |
| Tabelas 11B.1 | presentes (vazias no momento da auditoria inicial) |
| Uniques/índices | todos os esperados presentes |
| Drift corretivo | nenhum; migration aditiva compatível com código anterior |

**Nota de aplicação antecipada:** a migration foi aplicada via `npm run db:preview:migrate` durante o QA do Gate 11B.1, antes deste fechamento. **Não reaplicar.** Não há migration corretiva pendente.

Separação legado/Production: o host Prisma pode coincidir; a URL efetiva vem de `.env.gate0.preview.local` (`HOMOL_*`), não de `RUNTIME_DATABASE_URL` de Production.

## Permissões no HOMOL

Chaves: `contract.view`, `contract.manage`.

Preflight somente leitura (`node scripts/preflight-11b1-contract-grants.mjs`):

| Papel | contract.view | contract.manage |
|---|---|---|
| ADMINISTRATIVO | já concedido | já concedido |
| GERENCIA | já concedido | já concedido |
| FINANCEIRO | já concedido | já concedido |
| DIRETORIA | já concedido | já concedido |

`needsGrant: 0` — nenhuma escrita HOMOL necessária. Script de escrita permanece gated (`CONFIRM=YES` + `GRANT_AUTHORIZE=YES` + `GRANT_ACTOR_EMAIL`) se grants faltarem em outro ambiente.

## Rotas

| Rota | Permissão |
|---|---|
| `/sistema/ordens-compra` | `contract.view` |
| `/sistema/ordens-compra/nova` | `contract.manage` |
| `/sistema/ordens-compra/[id]` | `contract.view` (+ manage para gerar CTR) |
| `/sistema/contratacoes` | `contract.view` |
| `/sistema/contratacoes/[id]` | `contract.view` |

## Regras de negócio verificadas

- Só `accepted` gera contratação pela origem A.
- Proposta / O.C. não duplicam contratação (unique + checagem + concorrência).
- O.C. funciona sem orçamento interno.
- Número externo único por cliente na org (parcial `deletedAt IS NULL`).
- Escopo por `organizationId` em cliente/unidade/proposta/O.C.
- Itens e totais copiados para a contratação.
- Soft-delete não reabre geração (unique permanente).
- Auditoria: `PURCHASE_ORDER_CREATED`, `ENGAGEMENT_CREATED`.

## Testes

- Unit: `engagements.test.ts` + endurecimento em `persistent-core.test.ts`
- Integration: cenários 11B.1 em `persistent-core.integration.test.ts`
- E2E: `e2e/sistema-11b1.spec.ts` (fluxos A e B) via `npm run test:e2e:preview`

## Scripts de auditoria

- `scripts/audit-11b1-migration.mjs` — leitura
- `scripts/preflight-11b1-contract-grants.mjs` — leitura; escrita só com autorização explícita

## Riscos remanescentes

1. Soft-delete de contratação mantém o vínculo único (não reabre geração).
2. Anexo binário da O.C. fica para 11C.
3. E2E escreve registros `[E2E]` no HOMOL de Preview (mesmo padrão da 11A); não usa fixtures APRES.
4. Preview Vercel depende do deploy da branch após o push.

## Fora deste gate

11B.2+, agenda, financeiro, APRES, `/demonstracao`, Production, merge em `main`.
