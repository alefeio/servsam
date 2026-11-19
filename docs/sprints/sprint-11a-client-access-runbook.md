# Runbook — acesso do cliente à homologação 11A

Procedimento interno SERVSAM. **Não contém senhas.** Credenciais só em vault / canal seguro 1:1.

## Contexto

| Item | Valor |
| --- | --- |
| App | Preview `/sistema` (Clientes e Orçamentos) |
| URL de referência | `https://servsam-dkf2g3bpj-alefeios-projects.vercel.app` |
| Proteção | Vercel Authentication (deployment protection) |
| Auth app | Better Auth (e-mail/senha); `disableSignUp: true` |
| Banco | HOMOL Preview (`HOMOL_*`); não é Production |

O cliente precisa de **duas** autorizações: (1) entrar no deployment Vercel; (2) usuário em `/sistema`.

## 1. Provisionar acesso ao Preview protegido

1. No painel Vercel do projeto `servsam` → Deployment Protection / Vercel Authentication.  
2. Convidar o **e-mail individual** do homologador (conta pessoal/corporativa dele).  
3. Confirmar que o convite foi aceito antes da sessão de teste.  
4. Enviar ao cliente **apenas a URL do Preview** + instrução de login Vercel — sem senha de `/sistema` neste mesmo canal público (issue/chat aberto).

**Revogação:** remover o e-mail da allowlist Vercel quando a homologação terminar.

## 2. Provisionar usuário Better Auth (`/sistema`)

Pré-requisito: operador com permissão `user.manage` (ex.: perfil Diretoria) já autenticado no Preview HOMOL, **ou** seed admin via vault (nunca colar senha em doc/git).

1. Abrir `/sistema/configuracoes/usuarios` (ou fluxo equivalente de criação).  
2. Criar usuário com:
   - nome do homologador;
   - e-mail institucional individual (preferencialmente o mesmo da Vercel);
   - senha forte gerada no vault / gerenciador — **entregue só por canal seguro**;
   - papel recomendado para o roteiro 11A: **Gerência** (vê/cria clientes e orçamentos; sem financeiro) **ou** Diretoria se for testar também administração de usuários.  
3. Confirmar `isActive = true`.  
4. Pedir ao cliente o primeiro login e, se a política interna exigir, troca de senha no primeiro acesso (hoje: informar troca manual com operador se necessário).

**Não** criar conta compartilhada “cliente@…” pública.  
**Não** usar usuários do demo (`/demonstracao`).  
**Não** cadastrar cliente real da SERVSAM nesta etapa de provisionamento — o cliente cadastra dados de **teste** no roteiro.

## 3. Verificar autenticação e autorização

| Check | Como |
| --- | --- |
| Vercel | Cliente abre a URL e passa da tela de proteção com o e-mail convidado |
| Login app | `/sistema/login` → Better Auth → Painel |
| Autorização | Menu Clientes/Orçamentos visível; criar um cliente de teste funciona |
| Negativa (opcional) | Perfil sem `customer.create` não cria cliente |

## 4. Encerrar / revogar

1. Desativar o usuário em `/sistema` (`isActive = false`) **ou** remover papéis.  
2. Remover e-mail da Vercel Authentication.  
3. Rotacionar senha no vault se tiver sido compartilhada temporariamente.  
4. Não é necessário apagar auditoria.

## 5. Bloqueios conhecidos

- Preview **não** é público: sem convite Vercel o cliente vê tela de autenticação da Vercel, não o login SERVSAM.  
- Cada novo deploy Preview pode gerar URL `*.vercel.app` diferente; confirmar qual URL está na allowlist / message ao cliente.  
- `BETTER_AUTH_URL` compartilhado no painel é ignorado em Preview (usa host do deployment).  
- Sign-up público está desligado (`disableSignUp: true`).

## 6. Recuperação de senha (ACCESS-01)

Fluxo documentado em `homol-access-01-password-recovery.md`.

1. Em `/sistema/login`, usar **Esqueci minha senha**.  
2. Informar o e-mail da conta **já cadastrada** e ativa.  
3. Abrir o link do e-mail (Preview protegido + Deployment Protection).  
4. Definir nova senha em `/sistema/redefinir-senha` e entrar pelo login.  

Requer `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (domínio verificado) no ambiente Preview. Sem isso o envio real fica BLOCKED.

## 7. Responsável do projeto (homologação 11A) — sem credenciais neste doc

O responsável precisa testar `/sistema` no Preview HOMOL, mas **senhas não circulam** em chat, Git, logs ou relatórios. Use o procedimento abaixo.

**Situação 19/11/2026:** o e-mail de teste informado para ACCESS-01 **ainda não existe** no HOMOL. Recuperação sozinha não cria conta — é preciso provisionamento autorizado (seção 6.3 / 7.3) antes do fluxo de e-mail.

### 7.1 Identificar a conta administrativa inicial (autorizado)

1. Em máquina confiável, abrir o vault / gerenciador de senhas da equipe **ou** o `.env.local` local (gitignored).  
2. Localizar `SEED_ADMIN_EMAIL` (e, se existir no vault, a senha correspondente a `SEED_ADMIN_PASSWORD`).  
3. **Não** imprimir, colar em issue nem commitar esses valores.  
4. Se o e-mail seed existir no HOMOL (usuário criado no seed da Sprint 9/11A), esse é o admin inicial — tipicamente com papel Diretoria / `user.manage`.

### 7.2 Se a senha administrativa **não** estiver disponível

**Não** resetar senha nem criar usuário sem autorização explícita do dono do vault.

Opções seguras (escolher com autorização):

| Opção | Quem executa | Notas |
| --- | --- | --- |
| A | Operador com vault | Recupera `SEED_ADMIN_*` e entrega a senha só por canal 1:1 |
| B | Operador já logado no Preview com `user.manage` | Cria conta individual nova (passo 6.3) sem revelar o seed |
| C | Autorização escrita + sessão assistida | Rodar seed/reseed **somente HOMOL** (`DATABASE_ENV=preview` + `HOMOL_*`) com novos `SEED_*` no ambiente local — **nunca** Production; senha nova só no vault |

A senha da **demonstração** (`/demonstracao`) **não** autentica `/sistema`.

### 7.3 Criar conta individual de homologação

1. Passar pela **Deployment Protection** Vercel com e-mail convidado (seção 1).  
2. Entrar em `/sistema/login` com uma conta que tenha `user.manage` (seed ou outra).  
3. Em Usuários, criar usuário individual (nome + e-mail do responsável).  
4. Gerar senha forte no vault; atribuir perfil **Diretoria** (teste completo incl. usuários) ou **Gerência** (clientes/orçamentos sem financeiro).  
5. Entregar senha **somente** por canal seguro 1:1.  
6. Testar: login → Painel → criar cliente de teste → F5 → logout → login → dados persistidos.  
7. Ao terminar a campanha de teste, desativar o usuário e revogar o e-mail na Vercel (seção 4).

### 7.4 Bloqueios

- Sem convite Vercel → não chega ao login SERVSAM.  
- Sem `SEED_*` / vault / operador `user.manage` → não há como provisionar nesta conversa.  
- Este runbook **não** executa reset nem criação automática de usuários.

## Fora deste runbook

Criar cliente/orçamento reais da SERVSAM, abrir Production, liberar acesso anônimo, iniciar 11B, excluir resíduos HOMOL sem aprovação.
