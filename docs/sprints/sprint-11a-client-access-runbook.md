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

## Fora deste runbook

Criar cliente/orçamento reais, abrir Production, liberar acesso anônimo, iniciar 11B.
