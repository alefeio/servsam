# 11B.3 — Homologação operacional controlada

## Resultado

**11B.3 OPERATIONAL ACCEPTANCE PASS**

Validação feita na UI real (Next local `127.0.0.1:3463` apontado ao HOMOL Preview aprovado), com papel **DIRETORIA**, Server Actions existentes e prefixo `[HOMOL-QA-11B3]`.  
Não é a suíte Playwright Docker; Preview Vercel permanece protegido por SSO (Ready).

## 1. Data/hora e usuário de teste

| Item | Valor |
|------|--------|
| Execução (America/Belém) | 25/11/2026, ~09:06–09:11 |
| Papel | DIRETORIA |
| Identidade do testador | hash `b90393b46338` (sem credenciais) |
| Ambiente UI | `Operação real - Homologação` |

## 2. Branch e SHA

| Item | Valor |
|------|--------|
| Branch | `fix/11b-3-acceptance` |
| HEAD na abertura | `dbe9d1a9147ab793d93ab2bd3851410a9931b024` |
| Preview | https://servsam-git-fix-11b-3-acceptance-alefeios-projects.vercel.app — **Ready** |

## 3. Identidade anonimizada do banco

| Item | Valor |
|------|--------|
| `DATABASE_ENV` | `preview` |
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| Organização | `servsam` |
| Migrations pendentes/incompletas | **0** |
| Runtime UI | HOMOL via `scripts/homol-11b3-start-local-ui.mjs` |

## 4. Registros criados (tipo → ID)

| Tipo | ID / código | Estado final |
|------|-------------|--------------|
| Colaborador | `d292604c-c4d7-4877-933b-20dd41349679` · `[HOMOL-QA-11B3] Técnico de validação` | **Inativo** |
| Cliente | `60e327ef-dce3-4a85-b580-85b933071298` | Ativo (fictício QA) |
| Orçamento | `2454550f-07c1-4f0d-aa7b-7ac7c76b31c6` · ORC-2026-0022 | Aceito → contratação |
| Contratação | `ae4ad592-8976-4197-bd41-dc6b8fc847f4` · CTR-2026-0008 | Ativa |
| OS | `8296fbd4-1dfe-428b-aa15-0e7b6db7254d` · **OS-2026-0002** | **Cancelada** |
| Agendamento (1ª versão) | `62211fa2-82cd-44b5-ba85-0cb1b3d64d5f` | **Cancelado** (histórico de remarcação) |
| Agendamento (remarcado) | `d635d7c5-410c-4117-83f2-236c341fdd0a` | **Cancelado** |

Nenhum registro comercial preexistente foi editado. Dados manuais anteriores sem o prefixo QA (`OS-2026-0001`, colaborador “Teste”) foram preservados intactos.

## 5. Operações realizadas

1. Login DIRETORIA (Gate 1).
2. Cadastro de colaborador fictício.
3. Cliente → orçamento (1 serviço) → envio → aceite → contratação → emissão de OS.
4. Agendamento 27/11/2026 09:00–11:00 (America/Belém) com o colaborador QA.
5. Conferência Agenda **Dia / Semana / Mês** + lista.
6. Remarcação para 28/11/2026 14:00–16:00 com motivo documentado.
7. Logout + login; persistência confirmada.
8. Cancelamento do agendamento → OS voltou a **Emitida**.
9. Cancelamento da OS fictícia.
10. Inativação do colaborador (campo Situação → Inativo).

Sem faturamento, NF, cobrança, pagamento, grants, seed, migrate ou delete.

## 6. Estados OS / Agenda

| Momento | OS | Agenda |
|---------|----|--------|
| Após emitir | `issued` | sem vigente |
| Após agendar | `scheduled` | vigente 27/11 09–11 |
| Após remarcar | `scheduled` | vigente 28/11 14–16; versão anterior no histórico |
| Após cancelar compromisso | `issued` | histórico com 2 cancelados |
| Encerramento | `cancelled` | 0 agendamentos ativos da OS QA |

## 7. Persistência após novo login

Screenshot `12-after-relogin.png`: OS-2026-0002 visível na agenda (lista) após sair e entrar novamente.

## 8. Evidências Dia / Semana / Mês

Pasta: `docs/architecture/v1/artifacts-11b3-operational/`

- `07-agenda-day.png` / `07-agenda-week.png` / `07-agenda-month.png`
- `11-agenda-rescheduled-day.png` / `week` / `month`
- `08-agenda-lista.png`, `13-os-back-to-issued.png` (histórico de remarcação/cancelamento)
- `16-employee-inactivated.png`

## 9. Auditoria

Trilha correspondente no HOMOL (ações principais):

- `EMPLOYEE_CREATED` → `CUSTOMER_CREATED` → `PROPOSAL_*` → `ENGAGEMENT_CREATED`
- `SERVICE_ORDER_CREATED` → `APPOINTMENT_CREATED` → `SERVICE_ORDER_STATUS_CHANGED` (issued→scheduled)
- `APPOINTMENT_RESCHEDULED` + cancelamento da versão anterior
- `APPOINTMENT_CANCELLED` + retorno da OS para emitida
- `SERVICE_ORDER_CANCELLED`
- `EMPLOYEE_UPDATED` (inativação)

Detalhe: `artifacts-11b3-operational/qa-verify.json`.

## 10. Contagens anteriores e posteriores

Snapshot imediato **antes** do cenário QA (postaudit Gate 1 desta execução):

| Métrica | Antes | Depois | Δ esperado |
|---------|-------|--------|------------|
| Clientes total | 28 | 29 | +1 QA |
| Clientes ativos | 20 | 21 | +1 QA |
| Arquivados | 8 | 8 | 0 |
| Propostas ativas | 21 | 22 | +1 QA |
| Contratações ativas | 7 | 8 | +1 QA |
| O.C. ativas | 4 | 4 | 0 |
| OS (`deletedAt` nulo) | 1 | 2 | +1 QA (cancelada, sem delete) |
| Colaboradores | 1 | 2 | +1 QA (inativo) |
| Agendamentos | 2 | 4 | +2 histórico QA |
| Usuários | 2 | 2 | 0 |
| Audit logs | 349 | ≥366 | +ações QA |

Identidade do banco e migrations **inalteradas**.  
`ADMINISTRATIVO` continua **sem** `employee.manage`. Tabelas financeiras (`payment`/`invoice`/`finance_entry`) ausentes.

## 11. Problemas e limitações

1. Preview Vercel exige SSO — aceite de telas feito via UI local autenticada no mesmo HOMOL (hostHash/instanceId aprovados).
2. Inativação de colaborador não tem botão “Inativar”; usa o select **Situação** + Salvar (fluxo normal da UI).
3. Já existiam no HOMOL registros manuais sem prefixo QA (`OS-2026-0001`, colaborador “Teste”); não foram alterados.
4. Grants ADMINISTRATIVO não alterados (fora de escopo).
5. 11B.4 não iniciada.

## Restrições respeitadas

Sem grants, migrate, seed, reset, delete/truncate, Production, merge `main`, E2E Playwright apontando ao HOMOL, alteração de `/demonstracao`.

---

**11B.3 OPERATIONAL ACCEPTANCE PASS**
