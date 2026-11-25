# Gate 11B.4 — Financeiro administrativo FIN-F0

**Status:** READY FOR REVIEW  
**Branch:** `feature/11b-4-finance-f0`  
**Base:** `fix/11b-3-acceptance` @ `d2aa06cc4b5d0735ae98b4213ab3169defd54fea`  
**SHA funcional:** `f430c4b90b23239926e309eb6e3b94b56be6750d`  
**HEAD publicado:** `8ba6de8ca36f90020769be1a7ee9b6cb7addeaef`  
**Preview protegido:** https://servsam-git-feature-11b-4-finance-f0-alefeios-projects.vercel.app — **READY** (auth Vercel)

## Migration e modelos

- Migration aditiva: `prisma/migrations/20261125120000_finance_f0`
- `BillingRequest` — solicitação comercial de providências fiscais (`requested` → `under_review` → `processed` / `cancelled`)
  - `processed` **não** emite NF-e; `invoiceIssuedExternally` + `externalDocumentRef` registram emissão externa
- `ReceiptEntry` — recebimento informado (`pending`) e confirmado manualmente pelo Financeiro (`confirmed`), com `rejected` / `cancelled` / `reversed`
- Valores em **centavos** (`Int`); índice único parcial por `idempotencyKey`
- Lock `pg_advisory_xact_lock` na confirmação/reversão por contratação

## Rotas e fluxos

| Superfície | Função |
|------------|--------|
| `/sistema/contratacoes/[id]` | Resumo contratado/confirmado/pendente/saldo; solicitar NF; informar recebimento; histórico |
| `/sistema/financeiro` | Painel FIN-F0 com indicadores, filtros e ações do Financeiro |

Degradação graciosa se a migration HOMOL ainda não estiver aplicada (`finance-availability`).

## Matriz de permissões (reuso)

| Papel | Solicitar NF / informar recebimento | Confirmar / processar | Ver painel |
|-------|--------------------------------------|------------------------|------------|
| ADMINISTRATIVO | `contract.manage` | não (`finance.manage` ausente) | não |
| FINANCEIRO | `contract.manage` | `finance.manage` | `finance.view` |
| GERENCIA | consulta comercial; sem `finance.*` | não | não |
| DIRETORIA | sim | sim | sim |

Sem seed/grants no HOMOL nesta entrega.

## Auditoria

Eventos: `BILLING_REQUEST_CREATED`, `BILLING_REQUEST_PROCESSED`, `BILLING_REQUEST_CANCELLED`, `RECEIPT_REVIEW_REQUESTED`, `RECEIPT_CONFIRMED`, `RECEIPT_REJECTED`, `RECEIPT_CANCELLED`, `RECEIPT_REVERSED`.

## Evidências de teste (Docker isolado)

| Gate | Resultado |
|------|-----------|
| lint | PASS |
| typecheck | PASS |
| unitários | PASS (174 passed / 30 skipped) |
| integração isolada | PASS (4 testes: OS + agenda + FIN-F0) |
| E2E isolado | PASS (4: 11B.2 + 11B.3 + 11B.4) |
| build | PASS (`DATABASE_ENV=development` local; Preview usa HOMOL) |
| Migration Docker | `20261125120000_finance_f0` aplicada (`hostHash` isolado `7a0d370fac87`) |
| Preflight HOMOL read-only | PASS — ver `gate-11b4-homol-preflight-result.json` |

## Preflight HOMOL

| Item | Valor |
|------|--------|
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| org | `servsam` |
| 11B.3 | aplicada |
| 11B.4 | **pendente** (única: `20261125120000_finance_f0`) |
| Tabelas FIN-F0 | ausentes |
| Executor | `scripts/homol-migrate-11b4.mjs` (plan/deploy; **não** executado) |

## Riscos e pendências

- Preview aponta ao HOMOL: UI financeira mostra aviso até a migration ser autorizada.
- Confirmação é manual; não há conciliação bancária.
- Dados HOMOL comerciais e OS preservados; migration 11B.4 ainda não aplicada lá.

## Escopo deliberadamente excluído

Contas a pagar/receber completas, bancos, cartões, DRE, IR, Open Finance, NF-e real, gateway, RH, visitas periódicas, `/demonstracao`, Production, merge `main`, migration/seed/grants no HOMOL.

---

**11B.4 READY FOR REVIEW**
