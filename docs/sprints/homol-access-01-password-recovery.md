# HOMOL ACCESS-01 — Recuperação de senha

**Branch:** `hotfix/homol-access-01-password-recovery`  
**Base:** `sprint-11a-persistent-core` (`dd28911`)  
**Commits de referência:** `a3b7e2f` (feature) · `fc7ac54` (docs/provisionamento)  
**Preview atual:** `https://servsam-h0pqqixn1-alefeios-projects.vercel.app`  
**Proteção:** Vercel Authentication (Deployment Protection ativa)  
**Escopo:** Better Auth + Resend (`onboarding@resend.dev` só HOMOL) + UI `/sistema`. Sem 11B, sem merge `main`, sem Production.

## Fluxo

1. Login → **Esqueci minha senha** → `/sistema/esqueci-senha`  
2. `authClient.requestPasswordReset` com `redirectTo` = `/sistema/redefinir-senha` (path relativo)  
3. Token em `verification` (`reset-password:…`), TTL **3600 s**, uso único  
4. E-mail via Resend; contas **inativas** não recebem e-mail (token removido)  
5. Callback Better Auth → `/sistema/redefinir-senha?token=…`  
6. `authClient.resetPassword` → `revokeSessionsOnPasswordReset: true` → login manual (sem auto-login)

Mensagem pública uniforme: *“Se este e-mail estiver cadastrado…”*.

## Arquivos principais

- `src/lib/platform/auth.ts`, `email.ts`, `password-reset.ts`  
- `src/features/platform/forgot-password-form.tsx`, `reset-password-form.tsx`, `production-login-form.tsx`  
- `src/app/sistema/esqueci-senha/`, `redefinir-senha/`  
- `e2e/password-recovery.spec.ts`  
- `scripts/homol-user-lookup.mjs` (somente leitura)  
- `scripts/homol-provision-access01.mjs` (dry-run por padrão; execução só com `CONFIRM=YES`)  
- Auditoria: `PASSWORD_RESET_REQUESTED` | `COMPLETED` | `DENIED_INACTIVE`

## Variáveis (sem valores)

| Variável | Onde | Uso |
| --- | --- | --- |
| `RESEND_API_KEY` | Preview + local | API Resend |
| `RESEND_FROM_EMAIL` | Preview + local | Remetente HOMOL: `onboarding@resend.dev` |
| `BETTER_AUTH_SECRET` | Preview | Sessão / tokens |
| `DATABASE_ENV=preview` + `HOMOL_*` | Preview | Isolamento HOMOL (sem fallback legado) |

## Segurança

- Token temporário e de uso único  
- Rate limit Better Auth (60s / 20)  
- Resposta uniforme existência/inexistência  
- Inativo: sem e-mail  
- Revogação de sessões no sucesso  
- Sem auto-login pós-reset  
- `redirectTo` relativo + `trustedOrigins` (inclui alias localhost/127.0.0.1 em local)  
- Sem tokens em logs/auditoria  

## Gate Resend (HOMOL)

| Item | Resultado |
| --- | --- |
| `RESEND_*` no Preview | Presentes (`vercel env ls preview`) |
| Remetente local / combinado | `onboarding@resend.dev` |
| Destinatário `alexandrefpenha@gmail.com` | **Autorizado** — probe Resend aceito (sem link de recuperação) |
| Domínio `servsam.com.br` | Não exigido neste momento |

## Conta `alexandrefpenha@gmail.com` (HOMOL)

| Item | Resultado |
| --- | --- |
| Host HOMOL (fingerprint) | `22e5c2dd2d93` (sem contato Production) |
| Organização `servsam` | Presente |
| Conta | **EXISTE** (provisionada com autorização explícita) |
| Ativa | **SIM** |
| Perfil Diretoria | **CONFIGURADO** |
| Credencial Better Auth | Presente (hash); senha em texto **não** persistida nem impressa |
| Senha operacional | Definir via **Esqueci minha senha** no Preview |

Script: `scripts/homol-provision-access01.mjs` — criação atômica (user + credential + role + auditoria) em transação; senha aleatória só em memória para gerar o hash e depois descartada.

## Vercel Authentication

1. Painel Vercel → projeto `servsam` → Deployment Protection / Vercel Authentication.  
2. Convidar `alexandrefpenha@gmail.com`.  
3. Aceitar o convite no e-mail da Vercel.  
4. Abrir o Preview atual e autenticar na tela da Vercel **antes** do login SERVSAM.  
5. **Não** desativar Deployment Protection.

Estado: proteção **ativa** no deployment; confirmação de que o e-mail já está na allowlist = **ação humana** (não verificável só pelo CLI sem sessão do usuário).

## Testes reexecutados

| Suite | Estado |
| --- | --- |
| lint / typecheck | PASS |
| `npm test` | PASS (126) |
| `test:integration` | PASS (19) |
| `build` | PASS (`/sistema/esqueci-senha`, `/sistema/redefinir-senha`) |
| `test:e2e:preview` | PASS (3) |
| Probe Resend (sem reset) | PASS |
| Recuperação real + login admin | **BLOCKED** — conta HOMOL inexistente + convite Vercel a confirmar |

## Ações humanas pendentes

1. **Autorizar** provisionamento HOMOL (`CONFIRM=YES` no script) **ou** criar via operador com `user.manage`.  
2. Confirmar/convidar `alexandrefpenha@gmail.com` na Vercel Authentication.  
3. Após (1)+(2): abrir Preview → Esqueci minha senha → confirmar recebimento do e-mail → redefinir → login → Clientes/Orçamentos/Usuários.  
4. Informar ao Cursor apenas a confirmação de recebimento (sem senha/token).
