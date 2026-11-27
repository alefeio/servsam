# RELEASE-01 — Aceite operacional financeiro (FIN-F0)

**Veredito:** **PASS LOCAL — HOSTED PREVIEW PENDING**

| Classificação | Resultado |
| --- | --- |
| FIN-F0 OPERATIONAL FLOW | **PASS** (UI local apontada ao HOMOL aprovado) |
| HOSTED PREVIEW ACCEPTANCE | **BLOCKED** (Deployment Protection / login Vercel sem sessão automatizável) |
| ROLE SEPARATION | **PARTIAL** (só contas DIRETORIA no HOMOL; matriz de grants lida; demais papéis PENDING) |

**Data:** 2026-11-26 (America/Belem)  
**Branch:** `fix/11b-4-finance-qa`  
**SHA:** `e3c64f6d66289a9e15b4dea5394141596ac67d05`  
**Preview (referência):** https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app  
**Deployment de referência:** https://servsam-1fyf283ol-alefeios-projects.vercel.app  

Sem migrations, seed, grants, limpeza, Production ou merge em `main` nesta execução.

---

## Ambiente efetivamente utilizado

| Item | Valor |
| --- | --- |
| Homologação financeira (escrita autorizada) | UI Next.js local `http://127.0.0.1:3463` com `DATABASE_ENV=preview` → HOMOL |
| Preview hospedado | Tentativa de acesso; redirecionado para `vercel.com/login` (Deployment Protection **ativa**, não desabilitada) |
| Conta de operação | Diretoria (`*.servsam.local`) — papel DIRETORIA com `finance.manage` + `contract.manage` |
| Organização | `servsam` |

## Identidade anonimizada do banco

| Item | Antes | Depois |
| --- | --- | --- |
| DATABASE_ENV | preview | preview |
| database | postgres | postgres |
| hostHash | `22e5c2dd2d93` | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` | `0786bd682d75` |
| Migrations aplicadas | 8 / 0 pendentes | 8 / 0 pendentes |
| Tabelas `billing_request` / `receipt_entry` | íntegras | íntegras |

Identidade preservada. Nenhuma migration executada nesta execução (`MIGRATIONS EXECUTED: 0`).

Artefatos RO: `release-01-inventory-before.json`, `release-01-inventory-after.json`.

---

## Gate 1 — Segurança e inventário

PASS.

- Contagens pré-teste (base de comparação): clientes 29 (ativos 21 / arquivados 8), propostas 22, contratações 8, O.C. 4, OS 2, colaboradores 2, agenda 4, usuários 2, audit 369, billing 0, receipts 0.
- Usuários ativos: 2 × DIRETORIA (domínios `servsam.local` e `gmail.com`). Sem ADMINISTRATIVO / FINANCEIRO / GERENCIA provisionados.
- Grants efetivos lidos (sem alteração). Destaques:
  - **ADMINISTRATIVO:** `contract.manage`, sem `finance.manage` / `finance.view`; `employee.view` (sem `employee.manage`).
  - **FINANCEIRO:** `finance.manage` + `finance.view`; sem `employee.manage`.
  - **GERENCIA:** comercial/agenda/OS; sem `finance.*`; com `employee.manage`.
  - **DIRETORIA:** inclui `finance.manage`, `user.manage`, `employee.manage`, etc.

---

## Gate 2 — Preview hospedado

**BLOCKED** para aceite pela UI hospedada.

1. Navegação ao Preview redireciona para login Vercel (Deployment Protection).
2. Proteção **não** foi desabilitada.
3. Não há bypass de automação configurado no repositório.
4. Evidência complementar: UI local no mesmo HOMOL (Gates 3–7) — **não substitui** a homologação hospedada.

Módulos verificados na UI local (nav): Painel, Clientes, Orçamentos, Contratações, Ordens de compra, Ordens de serviço, Colaboradores, Agenda, Financeiro.

Screenshots: `artifacts-release-01/01-painel.png`, `02-nav-*.png`.

---

## Gates 3–7 — Cenário `[HOMOL-QA-11B4]`

### Registros criados (somente cenário autorizado)

| Entidade | ID | Código / rótulo |
| --- | --- | --- |
| Cliente | `35c1516b-a5c3-41f2-8163-4f0ef3c05f2b` | `[HOMOL-QA-11B4] Empresa de homologação financeira` |
| Orçamento | `97ec34ba-fd9e-4713-baed-e42797113118` | ORC-2026-0023 · `[HOMOL-QA-11B4] Validação financeira` |
| Contratação | `99f6bf74-83e9-486a-a97c-63bfe15afd0b` | CTR-2026-0009 · total **R$ 1.000,00** |
| BillingRequest | `752a40f8-170e-471a-8c3a-52e7d6321266` | status final `processed` · `invoiceIssuedExternally=false` |
| ReceiptEntry | `29311b29-d2b9-4e43-b473-799e30332d5a` | status final `reversed` |

Serviço: `Serviço fictício de homologação`. Sem CPF/CNPJ/telefone reais. Sem OS/agenda adicionais neste cenário.

### Solicitação fiscal

1. Solicitada com descrição/observações explicitamente de simulação.
2. Marcada **Em análise**.
3. Processamento administrativo **sem** marcar “Nota emitida externamente”.
4. Persistência e painel Financeiro conferidos.

### Recebimento parcial

| Momento | Contratado | Confirmado | Aguardando | Saldo de referência |
| --- | --- | --- | --- | --- |
| Após informar R$ 400 | R$ 1.000,00 | R$ 0,00 | R$ 400,00 | R$ 1.000,00 |
| Após confirmar R$ 250 | R$ 1.000,00 | R$ 250,00 | R$ 0,00 | R$ 750,00 |
| Após reverter | R$ 1.000,00 | R$ 0,00 | R$ 0,00 | R$ 1.000,00 |

**Semântica do saldo (aplicação):**

- **Saldo de referência** = contratado − confirmado (não desconta pendente).
- **Limite para novas solicitações** = contratado − (pendente + confirmado). Com R$ 400 pendentes, disponível ≈ R$ 600.

Persistência DB do recebimento:

- `requestedAmountCents` = 40000  
- `amountCents` = 25000  
- `confirmedManually` = true  
- status final = `reversed`  
- motivo: `[HOMOL-QA-11B4] Encerramento de simulação financeira`  
- Diferença não confirmada na UI: R$ 150,00  
- Sem parcela automática adicional (1 único `receipt_entry`)

### Integridade

| Check | Resultado |
| --- | --- |
| Rejeição de valor acima do disponível (pendente + novo) | PASS (UI) |
| Bloqueio de confirmação > solicitado | PASS (preview UI) |
| Reais ↔ centavos | PASS |
| Solicitado ≠ receita confirmada | PASS |
| OS independente de sinal | Evidência automatizada Docker (`finance.integration.test.ts` — “OS sem sinal”); sem criar OS neste cenário |
| Lançamentos duplicados | PASS (1 billing + 1 receipt) |

### Persistência e reversão

Reload + logout/login: solicitação processada e recebimento confirmado persistiram; após reversão, status `Revertido`, totais líquidos zerados, lançamento **não** excluído. Sem movimentação bancária real.

Screenshots-chave: `09-receipt-pending-400.png`, `11-receipt-confirmed-250.png`, `13-after-reload.png`, `15-after-reverse.png`, `16-financeiro-after-reverse.png`.

---

## Gate 8 — Permissões por papel

| Papel | Conta no HOMOL | Validação funcional nesta execução |
| --- | --- | --- |
| DIRETORIA | 2 ativas | PASS — jornada completa (solicitar, informar, confirmar, reverter) |
| ADMINISTRATIVO | nenhuma | **PENDING** — grants: comercial ok; sem `finance.manage` (não confirma) |
| FINANCEIRO | nenhuma | **PENDING** — grants incluem `finance.manage` |
| GERENCIA | nenhuma | **PENDING** — grants comerciais; sem `finance.*` |

Não foram criados usuários nem concedidos grants para forçar PASS. Evidência complementar: suíte Docker/integração FIN-F0 já existente.

`employee.manage`: presente em DIRETORIA e GERENCIA; **ausente** em ADMINISTRATIVO e FINANCEIRO nos grants persistidos (não pressupor catálogo de seed = grants HOMOL).

---

## Gate 9 — Auditoria final

| Critério | Resultado |
| --- | --- |
| Identidade do banco | Preservada |
| Migrations | Inalteradas (8) |
| Registros comerciais preexistentes | Intactos (deltas só +1 cliente/proposta/contratação do cenário) |
| Usuários | 2 → 2 (**NEW USERS: 0**) |
| Permissões | Sem alteração (**GRANTS CHANGED: 0**) |
| Novos registros | Restritos a `[HOMOL-QA-11B4]` |
| Recebimento confirmado ativo | 0 |
| NF / banco real | Nenhum |
| Production / main | Intactos (`main` = `c8bc57f…`; HEAD da branch não está em `main`) |

### Contagens antes → depois

| Métrica | Antes | Depois | Δ |
| --- | --- | --- | --- |
| Clientes (total) | 29 | 30 | +1 |
| Clientes ativos | 21 | 22 | +1 |
| Propostas ativas | 22 | 23 | +1 |
| Contratações ativas | 8 | 9 | +1 |
| OS ativas | 2 | 2 | 0 |
| Usuários | 2 | 2 | 0 |
| Audit logs | 369 | 384 | +15 |
| Billing requests | 0 | 1 | +1 |
| Receipt entries | 0 | 1 | +1 |

Auditoria do cenário (ações):  
`CUSTOMER_CREATED` → `PROPOSAL_*` → `ENGAGEMENT_CREATED` → `BILLING_REQUEST_CREATED` → `BILLING_REQUEST_UNDER_REVIEW` → `BILLING_REQUEST_PROCESSED` → `RECEIPT_REVIEW_REQUESTED` → `RECEIPT_CONFIRMED` → `RECEIPT_REVERSED`.

Registros fictícios **preservados** para auditoria (sem limpeza).

---

## Limitações e bloqueios

1. **HOSTED PREVIEW PENDING** — exige sessão humana na Deployment Protection Vercel + login `/sistema`.
2. **ROLE SEPARATION PARTIAL** — falta provisionar contas ADMINISTRATIVO / FINANCEIRO / GERENCIA (autorização RELEASE-02/03).
3. Scripts de apoio locais (`scripts/release-01-*.mjs`) — não alteram código funcional da aplicação.

---

## Conclusão RELEASE-01

A jornada financeira FIN-F0 foi comprovada de ponta a ponta no HOMOL aprovado via UI local, com valores, persistência, integridade e reversão conforme o contrato.

**RELEASE-01 não é declarado PASS pleno** enquanto a validação hospedada permanecer bloqueada.

Próximo passo autorizado (sem iniciar RELEASE-03): concluir evidência humana no Preview protegido e seguir a preparação somente leitura já documentada em RELEASE-02.
