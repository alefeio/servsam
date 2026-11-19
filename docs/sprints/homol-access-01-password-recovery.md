# HOMOL ACCESS-01 — Recuperação de senha

**Branch:** `hotfix/homol-access-01-password-recovery`  
**Base:** `sprint-11a-persistent-core` (`dd28911`)  
**Escopo:** Better Auth + e-mail transacional (Resend) + UI `/sistema`. Sem 11B, sem merge `main`, sem Production.

## Fluxo

1. Login → link **Esqueci minha senha** → `/sistema/esqueci-senha`  
2. `authClient.requestPasswordReset` (Better Auth) com `redirectTo` = origem atual + `/sistema/redefinir-senha`  
3. Token em `verification` (`reset-password:…`), TTL **3600 s**, uso único  
4. E-mail via Resend (se configurado); contas **inativas** não recebem e-mail (token removido)  
5. Link BA → callback com `?token=` → `/sistema/redefinir-senha`  
6. `authClient.resetPassword` → `revokeSessionsOnPasswordReset: true` → voltar ao login (sem auto-login)

Mensagem pública uniforme: *“Se este e-mail estiver cadastrado…”* (sem enumeração).

## Arquivos principais

- `src/lib/platform/auth.ts` — `sendResetPassword`, `onPasswordReset`, revogação de sessões  
- `src/lib/platform/email.ts` — Resend / modo teste  
- `src/lib/platform/password-reset.ts` — paths, redirect allowlist, validação de senha  
- `src/features/platform/forgot-password-form.tsx`, `reset-password-form.tsx`  
- `src/app/sistema/esqueci-senha/page.tsx`, `redefinir-senha/page.tsx`  
- `src/features/platform/production-login-form.tsx` — link  
- `e2e/password-recovery.spec.ts`  
- Auditoria: `PASSWORD_RESET_REQUESTED` | `COMPLETED` | `DENIED_INACTIVE` (sem token)

## Variáveis (sem valores)

| Variável | Onde | Uso |
| --- | --- | --- |
| `RESEND_API_KEY` | servidor / Preview | API Resend |
| `RESEND_FROM_EMAIL` | servidor / Preview | Remetente de **domínio verificado** |
| `BETTER_AUTH_SECRET` | já existente | Sessão / tokens |
| `DATABASE_ENV=preview` + `HOMOL_*` | Preview | Isolamento HOMOL |

## Segurança

- Token temporário e de uso único (consume no reset)  
- Rate limit Better Auth (janela 60s / 20)  
- Resposta uniforme existência/inexistência  
- Inativo: sem e-mail  
- Revogação de sessões no sucesso  
- Sem auto-login pós-reset  
- Sem redirecionamento para origem arbitrária (`originCheck` + path fixo)  
- Sem tokens em logs/auditoria  

## Conta de teste `alexandrefpenha@gmail.com`

| Item | Resultado |
| --- | --- |
| Existe no HOMOL | **NÃO** |
| Provisionamento necessário | **SIM** (autorização humana; perfil proposto Diretoria) |
| Recuperação sem conta | Impossível — cadastro prévio obrigatório |

## Provedor de e-mail

- Implementação Resend pronta.  
- `RESEND_API_KEY` pode existir no ambiente local; **não** foi confirmado no Preview Vercel nem remetente de domínio verificado.  
- **Envio real:** BLOCKED até `RESEND_*` no Preview + domínio verificado + conta provisionada.  
- Se uma chave local apareceu em logs de terminal, **rotacionar** no painel Resend.

## Testes

| Suite | Estado |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | PASS |
| Unit (`npm test`) | PASS (125) |
| Unit helpers (`password-reset.test.ts`) | PASS |
| Integration HOMOL (`password-reset.integration.test.ts` + plataforma) | PASS — ack uniforme, inativo sem e-mail, token único, expirado, senha fraca, login novo/antigo, sessões revogadas, papéis intactos |
| E2E Preview (`password-recovery` + auth + core) | PASS (3) |
| Envio real / login pós-reset do e-mail de teste | BLOCKED (conta ausente + Resend Preview + convite Vercel) |

## Ações humanas pendentes

1. Definir `RESEND_FROM_EMAIL` com domínio verificado no Resend.  
2. Adicionar `RESEND_API_KEY` e `RESEND_FROM_EMAIL` ao ambiente **Preview** (e rotacionar se vazou).  
3. Autorizar provisionamento de `alexandrefpenha@gmail.com` com perfil Diretoria no HOMOL.  
4. Convidar o e-mail na Vercel Authentication do Preview.  
5. Redeploy Preview desta branch e repetir o teste real de e-mail.
