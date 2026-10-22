# Sprint 9 - Fundação de produção

**Status:** DONE  
**Data:** 22/10/2026

## Objetivo

Criar a fundação real de `/sistema`: PostgreSQL, Prisma, autenticação, organização, usuários, papéis, permissões e auditoria de plataforma. O demo em `/demonstracao` permanece em fixture e `localStorage`.

## Fora desta sprint

Clientes, propostas, agenda, ordens de serviço, contratos, estoque, financeiro, certificados, relatórios técnicos, RH operacional, portal do cliente, Google Calendar, mobile, NF-e, painel completo de auditoria e upload de fotos. Esses itens seguem nas Sprints 10 a 20.

## Banco

| Uso | Variável |
| --- | --- |
| Prisma CLI, migrations, generate e seed | `POSTGRES_URL` |
| Runtime do Next.js | `RUNTIME_DATABASE_URL` |
| Presentes no provedor, não lidas pelo código | `DATABASE_URL`, `PRISMA_DATABASE_URL` |

`DATABASE_ENV` rotula o alvo (`development`, `preview` ou `test`). Migration e seed recusam `VERCEL_ENV=production` e recusam um rótulo fora desses três. A estratégia normal é migration versionada. `db push` não é o caminho de produção.

Neste ambiente as quatro URLs apontam para o mesmo PostgreSQL direto. O código mantém a divisão para o dia em que o runtime passar a usar conexão com pool e a migration continuar na conexão direta.

## Setup local

1. Copiar `.env.example` para `.env.local`. O `.env.local` não é versionado.
2. Preencher `DATABASE_ENV`, `POSTGRES_URL`, `RUNTIME_DATABASE_URL`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL`.
3. Definir `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` (mínimo de 8 caracteres). A senha não entra no repositório nem na interface.
4. `npm install`
5. `npm run db:migrate`
6. `npm run db:seed`
7. `npm run dev` e abrir `/sistema/login`

O seed é idempotente. Organização, permissões e papéis são atualizados por chave. Associação de permissão que já existe não é recriada nem revogada. Se o usuário inicial já existe, a senha não muda.

## Autenticação

Better Auth, somente no servidor de `/sistema`. E-mail e senha. O hash fica em `Account.password`. Cadastro público desligado. Usuário inativo não conclui a sessão. Credencial inválida e conta inativa devolvem a mesma mensagem: "E-mail ou senha inválidos." Cookie de sessão do Better Auth. Origem confiável igual a `BETTER_AUTH_URL`. Server Actions do Next.js cobrem o CSRF dos formulários. A sessão do demo (`servsam.demo.session`) não é lida aqui.

## RBAC

Autorização por chave, no servidor, em `requireAuthenticatedUser`, `requirePermission` e `hasPermission`. Esconder botão não autoriza a ação. As funções de criar usuário, editar usuário, ativar conta, criar papel e alterar permissão também recusam o ator sem a chave correspondente.

O papel sistema `DIRETORIA` não pode perder `user.manage`, `role.manage` e `audit.view`. Isso evita uma administração sem dono. Módulo de negócio não consulta o código do papel.

## Auditoria

Eventos: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `USER_CREATED`, `USER_UPDATED`, `USER_ACTIVATED`, `USER_DISABLED`, `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_ASSIGNED`, `ROLE_REMOVED`, `PERMISSION_GRANTED`, `PERMISSION_REVOKED`.

Campos: `organizationId`, `actorUserId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`. Senha, hash, token e chave de API são removidos do metadata. Não há tela de consulta. O painel continua previsto para a Sprint 20.

## APIMG

`APIMG_API_KEY` e `APIMG_UPLOAD_URL` já estão no ambiente e são segredo de servidor. Não há `NEXT_PUBLIC_` para elas. Não há cliente de upload nesta sprint. O uso real começa na Sprint 13 (evidência da execução) e na Sprint 15 (relatório fotográfico).

No projeto de referência, o upload é um POST do arquivo para a URL completa, com cabeçalho `X-API-Key` e campo `file`. A resposta traz a URL pública e metadados do arquivo. A chave permanece no servidor.

## Testes

`src/lib/platform/platform.test.ts` cobre chaves, metadata e o isolamento do código de produção em relação ao demo.

`src/lib/platform/platform.integration.test.ts` usa o PostgreSQL de desenvolvimento apontado por `RUNTIME_DATABASE_URL`. Cria registros com e-mail único e apaga o que criou. Recusa `DATABASE_ENV=production` e `VERCEL_ENV=production`. Não há banco de teste separado: as quatro URLs deste ambiente são o mesmo banco de desenvolvimento.

`e2e/production-auth.spec.ts` cobre a proteção da rota, o login e o logout quando `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` estão no ambiente.

## Critérios de aceite

Fundação no ar, migration reproduzível, seed idempotente, login, sessão, logout, rota privada no servidor, inativo bloqueado, RBAC por chave, papéis atribuíveis, permissões editáveis, diretoria administrando usuários e papéis, auditoria dos eventos listados, nenhum segredo real versionado, demo preservado, `/sistema` sem `localStorage`, e os checks de lint, typecheck, teste, build e e2e registrados no relatório.
