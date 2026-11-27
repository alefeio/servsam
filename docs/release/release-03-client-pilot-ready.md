# RELEASE-03 — Client Pilot Ready

**Veredito:** **RELEASE-03 PARTIAL — CLIENT ACCESS PENDING**

| Classificação | Resultado |
| --- | --- |
| HOSTED PREVIEW ACCEPTANCE | **BLOCKED** |
| CLIENT ACCOUNTS | **PENDING** |
| EXTERNAL ACCESS | **PENDING** |
| ROLE SEPARATION | **INSPECTED** (grants HOMOL; contas piloto ainda inexistentes) |
| CLIENT CHECKLIST | **READY** |
| PRODUCTION | **UNCHANGED** |
| MAIN | **UNCHANGED** |
| EXISTING BUSINESS RECORDS | **UNCHANGED** |
| ROLE PERMISSION MATRIX | **UNCHANGED** |
| MIGRATIONS EXECUTED | **0** |

**Data:** 2026-11-27  
**Branch:** `fix/11b-4-finance-qa`  
**HEAD de partida:** `e3c64f6d66289a9e15b4dea5394141596ac67d05`  
**HEAD final (docs):** tip de `fix/11b-4-finance-qa` após commits `docs(release):…` (publicados no remoto)  
**URL de entrega prevista:** https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app/sistema/login  

Sem FIN-F1 / 11C / RH, sem Production, sem merge em `main`, sem alteração de código funcional.

---

## Gate 1 — Consolidação documental

Documentos confirmados localmente e publicados nesta execução:

- `docs/architecture/v1/release-01-financial-operational-acceptance.md`
- `docs/architecture/v1/release-01-inventory-before.json` / `after.json` (nomes de operador anonimizados)
- `docs/architecture/v1/artifacts-release-01/`
- `docs/release/release-02-client-access-readiness.md`
- `docs/release/servsam-v1-client-pilot-checklist.md`
- `docs/release/release-03-preflight-before.json`
- este relatório

Na auditoria anterior esses arquivos **não** estavam no remoto; a publicação fecha essa lacuna. HEAD final após o push: ver commit de docs nesta branch.

---

## Gate 2 — Preflight somente leitura

Artefato: `docs/release/release-03-preflight-before.json`

| Check | Resultado |
| --- | --- |
| Branch | `fix/11b-4-finance-qa` |
| Banco | hostHash `22e5c2dd2d93` · instanceId `0786bd682d75` · database `postgres` · org `servsam` |
| Migrations | **8** finalizadas · **0** pendentes |
| FIN-F0 | `billing_request` / `receipt_entry` / `requestedAmountCents` OK |
| Production / main | Intactas (`main` = `c8bc57f…`; HEAD da feature fora de `main`) |

### Snapshot (antes de qualquer provisionamento)

| Métrica | Valor |
| --- | --- |
| Clientes | 30 (22 ativos) |
| Propostas | 23 |
| Contratações | 9 |
| O.C. | 4 |
| OS | 2 |
| Colaboradores / agenda | 2 / 4 |
| Usuários | 2 (ambos DIRETORIA) |
| Billing / receipts | 1 / 1 |
| Audit logs | 384 |

### E-mails piloto autorizados (existência)

| E-mail | Situação |
| --- | --- |
| `diretoria@servsam.com` | **Ausente** |
| `administrativo@servsam.com` | **Ausente** |
| `financeiro@servsam.com` | **Ausente** |

Nenhuma conta pré-existente desses três e-mails → não houve redefinição de senha nem alteração de papéis.

---

## Gate 3 — Validação dos acessos existentes (inspeção)

| Item | Evidência | Tipo |
| --- | --- | --- |
| Operador com `user.manage` | Papel DIRETORIA no HOMOL inclui `user.manage`; 2 usuários DIRETORIA ativos | Inspeção de grants/usuários |
| Criação de usuário | `createPlatformUser` exige `user.manage`, cria credential Better Auth + papéis + `USER_CREATED` | Inspeção de código (`accounts.ts`) |
| Cadastro público | `disableSignUp: true` em Better Auth | Inspeção de código (`auth.ts`) |
| Recuperação de senha | Fluxo ACCESS-01 (`/sistema/esqueci-senha`) documentado e implementado | Inspeção + runbook |
| E-mail Preview | `RESEND_API_KEY` e `RESEND_FROM_EMAIL` presentes em Preview (valores Hidden; não expostos). Também: `DATABASE_ENV`, `HOMOL_*`, `BETTER_AUTH_SECRET` | `vercel env ls` (somente nomes) |

Não foi usado seed/SQL/grants para contornar autenticação.

---

## Gate 4 — Provisionamento de usuários

**Não executado.**

Motivo: esta execução **não contém autorização formal explícita** do responsável no formato “Autorizo o provisionamento…”. O próprio briefing condiciona a criação à autorização específica.

Contas planejadas (quando autorizadas):

| Nome | E-mail | Papel |
| --- | --- | --- |
| Diretor | `diretoria@servsam.com` | DIRETORIA |
| Administrador | `administrativo@servsam.com` | ADMINISTRATIVO |
| Financeiro | `financeiro@servsam.com` | FINANCEIRO |

Regras a respeitar na próxima autorização:

- Usar papéis já existentes; **não** alterar matriz de permissões.
- **Não** conceder `employee.manage` ao ADMINISTRATIVO.
- **Não** conceder permissões extras ao FINANCEIRO.
- Preferir senha via “Esqueci minha senha” (sem registrar senhas em git/docs/logs).
- Fluxo oficial: UI `/sistema` com `user.manage` **ou** script auditado equivalente com `CONFIRM=YES` após autorização escrita.

---

## Gate 5 — Acesso externo (Deployment Protection)

| Item | Situação |
| --- | --- |
| Proteção | **Ativa** — Preview redireciona para login Vercel |
| Desativação global | **Não** realizada |
| Bypass permanente / tokens | **Não** gerados |
| Convites aos 3 e-mails | **PENDING** — ação humana no painel Vercel |
| Acesso a projeto/env/logs/billing/repo | **Não** concedido |

### Alternativas (aguardando decisão)

1. **Preferida:** Vercel Authentication / Deployment Protection — convidar apenas os 3 e-mails como visitantes do deployment (sem tornar admins da equipe).  
2. Se o plano atual **não** permitir convidados externos restritos: reportar limitação do plano e aguardar decisão (upgrade pago **não** automático; ou sessão assistida com operador já autorizado).  
3. **Não** usar Shareable Link / protection bypass permanente.

Nesta sessão automatizada não foi possível administrar a allowlist Vercel.

---

## Gate 6 — Homologação do Preview hospedado

**BLOCKED** — sem comprovação de login SERVSAM no deployment hospedado.

Evidência: navegação a `/sistema/login` no Preview resulta em `vercel.com/login` (SSO Deployment Protection).  
Localhost **não** substitui esta etapa (já usado no RELEASE-01).

Roteiro humano pendente:

1. Aceitar convite Vercel com e-mail autorizado.  
2. Abrir a URL de entrega.  
3. Passar pela proteção Vercel.  
4. Login SERVSAM → painel → nav (Clientes, Orçamentos, Contratações, O.C., OS, Colaboradores, Agenda, Financeiro) → logout.  
5. Sem novos registros financeiros/comerciais nesta etapa.

---

## Gate 7 — Separação de responsabilidades (inspeção de grants)

Contas piloto ainda inexistentes → verificação **por grants persistidos** + testes isolados anteriores, **não** por operação autenticada dos três perfis.

| Papel | Comprovado por inspeção | Ainda não testado com conta piloto |
| --- | --- | --- |
| ADMINISTRATIVO | Tem `contract.*` / comercial / OS / agenda; **sem** `finance.manage` / `finance.view`; `employee.view` (sem `employee.manage`); sem `user.manage` | Login e menus reais |
| FINANCEIRO | Tem `finance.manage` + `finance.view`; sem `user.manage` / `role.manage`; sem `employee.manage` | Login e ações financeiras |
| DIRETORIA | Tem `user.manage`, `role.manage`, `audit.view`, `finance.manage`, etc. | Conta `diretoria@servsam.com` |

Matriz de permissões **não** foi alterada.

---

## Gate 8 — Entrega

| Item | Estado |
| --- | --- |
| URL | https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app/sistema/login |
| Domínio customizado / DNS | **Não** configurado |
| Checklist cliente | `docs/release/servsam-v1-client-pilot-checklist.md` — **READY** |
| Aviso | Ambiente de homologação; sem NF real, sem movimentação bancária, sem dados sensíveis reais |

---

## Gate 9 — Auditoria de encerramento

| Critério | Resultado |
| --- | --- |
| Novos usuários piloto | **0** (não autorizados nesta execução) |
| Grants / roles matrix | Inalterados |
| Clientes / propostas / contratações / O.C. / OS / agenda / colaboradores / financeiro | Inalterados vs preflight |
| Migrations | 0 executadas |
| Production / main | Intactas |
| Usuários preexistentes | Intactos (2 × DIRETORIA) |

---

## Ações humanas restantes (exatas)

1. **Autorização formal escrita** do responsável para provisionar os três usuários HOMOL (`diretoria@` / `administrativo@` / `financeiro@servsam.com`) e, se desejado, preferência por senha via recuperação de e-mail.  
2. No painel Vercel → Deployment Protection: **convidar** os três e-mails (sem admin de equipe / sem bypass).  
3. Após (1): criar as três contas pelo fluxo oficial e confirmar papéis.  
4. Smoke **hospedado** (Gate 6) e, se possível, login de cada perfil para fechar ROLE SEPARATION VERIFIED.  
5. Entregar URL + checklist ao cliente por canal seguro (**sem** senhas em chat aberto).  

Não enviar mensagens comerciais automaticamente. Não iniciar RELEASE seguinte / FIN-F1 / 11C / RH.

---

## Procedimento de revogação (quando o piloto encerrar)

1. Desativar usuários piloto (`isActive = false`) ou remover papéis.  
2. Remover e-mails da allowlist Vercel Authentication.  
3. Rotacionar qualquer senha temporária no vault.  
4. Preservar auditoria; não limpar dados de negócio sem autorização.
