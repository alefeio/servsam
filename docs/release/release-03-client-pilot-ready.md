# RELEASE-03 — Client Pilot Ready

**Veredito:** **RELEASE-03 ACCOUNTS READY — VERCEL ACCESS PENDING**

| Classificação | Resultado |
| --- | --- |
| CLIENT ACCOUNTS | **READY** |
| VERCEL EXTERNAL ACCESS | **PENDING** (ação humana no painel) |
| HOSTED PREVIEW ACCEPTANCE | **BLOCKED** (Deployment Protection sem sessão dos titulares) |
| ROLE SEPARATION | **VERIFIED** (UI local HOMOL + grants; sem escrita de negócio) |
| CLIENT CHECKLIST | **READY** |
| NEW USERS | **3** |
| ROLE PERMISSION MATRIX | **UNCHANGED** |
| EXISTING BUSINESS RECORDS | **UNCHANGED** |
| MIGRATIONS EXECUTED | **0** |
| PRODUCTION | **UNCHANGED** |
| MAIN | **UNCHANGED** |

**Data:** 2026-11-27  
**Branch:** `fix/11b-4-finance-qa`  
**HEAD de partida desta retomada:** `82d890342462b33737adac0909c177b603920b82`  
**Autorização:** formal do responsável (provisionamento HOMOL + convites Vercel restritos + validação sem escrita)

**URL de entrega:** https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app/sistema/login  
**Deployment READY citado:** https://servsam-ct9upi5pw-alefeios-projects.vercel.app  
**Checklist:** `docs/release/servsam-v1-client-pilot-checklist.md`

---

## Preflight (antes do provisionamento)

Identidade confirmada: `postgres` · `DATABASE_ENV=preview` · hostHash `22e5c2dd2d93` · instanceId `0786bd682d75` · org `servsam` · **8** migrations · **0** pendentes.

| Métrica | Valor pré |
| --- | --- |
| Usuários | 2 |
| Clientes / propostas / contratações | 30 / 23 / 9 |
| Billing / receipts | 1 / 1 |
| E-mails piloto | **todos ausentes** |

Operador legítimo: conta DIRETORIA `*.servsam.local` com `user.manage` (usada como `assignedById` / ator de auditoria).

Artefato: `docs/release/release-03-preflight-before.json`.

---

## Provisionamento

Script auditado: `scripts/release-03-provision-users.mjs`  
(`CONFIRM=YES` + `RELEASE_03_AUTHORIZE=YES`; Better Auth hash; sem INSERT cru).

| Nome | E-mail | Papel | Status |
| --- | --- | --- | --- |
| Diretor | `diretoria@servsam.com` | DIRETORIA | criado · ativo · credential OK |
| Administrador | `administrativo@servsam.com` | ADMINISTRATIVO | criado · ativo · credential OK |
| Financeiro | `financeiro@servsam.com` | FINANCEIRO | criado · ativo · credential OK |

Auditoria: `USER_CREATED` ×3 + `ROLE_ASSIGNED` ×3.  
Usuários: **2 → 5**. Contas preexistentes preservadas. Matriz de grants **inalterada** (sem `employee.manage` no ADMINISTRATIVO; FINANCEIRO com `finance.manage` / sem `user.manage`).

### Credenciais

Senhas temporárias individuais geradas e gravadas **somente** em:

`.credentials/release-03-pilot.local.json` (gitignored; **não** versionado)

Entregar ao responsável por canal seguro 1:1.  
Não usar Resend de teste como prova de entrega aos três `@servsam.com` (remetente HOMOL típico limitado). Preferir envelope local + troca posterior.

---

## Acesso Vercel (Deployment Protection)

| Item | Estado |
| --- | --- |
| Proteção | **Ativa** (Preview → login Vercel) |
| Desativação / bypass permanente / tokens | **Não** |
| Convites aos 3 e-mails | **PENDING — humano** |
| Admin de equipe / env / logs / billing | **Não** concedido |

### Caminho humano exato

1. Abrir [Vercel Dashboard](https://vercel.com) → projeto **servsam**.  
2. **Settings** → **Deployment Protection** (ou **Vercel Authentication**).  
3. Manter proteção **ligada**.  
4. Convidar individualmente: `diretoria@servsam.com`, `administrativo@servsam.com`, `financeiro@servsam.com` como acesso ao Preview (visitante/share do deployment — **não** Member/Admin do time).  
5. Pedir que cada titular aceite o e-mail da Vercel.  
6. Só então abrir a URL de login SERVSAM.

Se o plano atual só permitir membros da equipe: **não** promover a Admin; reportar limitação e decidir com o responsável (sem contratar plano automaticamente).

---

## Validação de perfis

### Preview hospedado

**BLOCKED** — sem sessão autenticada na Deployment Protection nesta execução automatizada.

### UI local → HOMOL (complementar; sem escrita de negócio)

`scripts/release-03-validate-roles-ui.mjs` · artefatos em `docs/release/artifacts-release-03/`.

| Papel | Menus comprovados | Ausências comprovadas |
| --- | --- | --- |
| DIRETORIA | Comercial, OS, Agenda, Colaboradores, Financeiro, Usuários, Perfis | — |
| ADMINISTRATIVO | Clientes, Orçamentos, Contratações, O.C., OS, Agenda, Colaboradores | Financeiro (menu), Usuários, Perfis |
| FINANCEIRO | Comercial + Financeiro | Usuários, Perfis |

Nota: ADMINISTRATIVO sem `finance.view` no grant HOMOL → módulo **Financeiro** oculto no menu; solicitação fiscal / informar recebimento permanecem nos fluxos de contratação conforme `contract.manage` (inspeção de grants + código FIN-F0). Confirmação/reversão exige `finance.manage` (ausente neste papel).

---

## Auditoria final

Artefato: `docs/release/release-03-audit-after.json`

| Critério | Resultado |
| --- | --- |
| Usuários | 5 |
| Novas contas piloto | 3 |
| Negócio (clientes/propostas/CTR/billing/receipts) | Inalterado vs pré |
| Migrations | 0 executadas |
| Production / main | Intactas (`main` = `c8bc57f…`) |

---

## Entrega ao cliente (quando Vercel estiver pronto)

1. Responsável obtém senhas em `.credentials/release-03-pilot.local.json` (máquina local / vault).  
2. Concluir convites Vercel (seção acima).  
3. Smoke hospedado: proteção → login SERVSAM → painel → logout (um perfil basta para desbloquear HOSTED; idealmente os três).  
4. Enviar URL + `servsam-v1-client-pilot-checklist.md` por canal seguro (**sem** senhas em chat aberto).  
5. Não enviar mensagem comercial automática.

### Revogação

Desativar usuários piloto · remover e-mails da allowlist Vercel · rotacionar senhas do envelope · preservar auditoria.
