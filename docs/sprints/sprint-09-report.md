# Relatório da Sprint 9

**Data:** 22 de outubro de 2026  
**Natureza:** fundação de produção em `/sistema`. O demo em `/demonstracao` foi preservado. Não houve commit.

## 1. Resultado

PostgreSQL e Prisma 7 passam a sustentar organização, usuário, papel, permissão e auditoria. O login de `/sistema` é real, com senha apenas em hash, sessão no servidor e autorização por chave. O demo continua em fixture e `localStorage`, com a senha fictícia visível só na tela dele.

A conexão real foi validada: a migration inicial foi aplicada, o seed rodou duas vezes sem duplicar o usuário inicial, e os testes de integração leram e gravaram nesse banco.

## 2. Variáveis de banco

| Variável | Quem lê | Função |
| --- | --- | --- |
| `POSTGRES_URL` | Prisma CLI, `prisma generate` quando a URL existe, migration e seed | Operação administrativa e schema |
| `RUNTIME_DATABASE_URL` | Prisma Client no Next.js e nos testes de integração | Runtime |
| `DATABASE_URL` | Ninguém no código | Presente no provedor |
| `PRISMA_DATABASE_URL` | Ninguém no código | Presente no provedor |
| `DATABASE_ENV` | Guarda de migration e seed | Rótulo `development`, `preview` ou `test`. Não escolhe outro banco |

A divisão segue o projeto de referência: runtime e migration podem divergir quando o provedor separar conexão com pool e conexão direta. Neste ambiente as quatro URLs são o mesmo PostgreSQL direto (`sslmode=require`, host do provedor Prisma, schema `public`). Nenhuma é um pooler hoje. `DATABASE_URL` e `PRISMA_DATABASE_URL` estão redundantes para o código e foram mantidas no `.env.example` porque o provedor as entrega.

`npm run db:migrate` e `npm run db:seed` recusam `VERCEL_ENV=production` e exigem `DATABASE_ENV` em `development`, `preview` ou `test`.

## 3. Schema

Arquivo: `prisma/schema.prisma`. Migration: `prisma/migrations/20261022140103_platform_foundation`.

Modelos:

- `Organization`
- `User` (`organizationId`, `isActive`; sem coluna de papel e sem senha)
- `Session`, `Account`, `Verification` (exigidos pelo Better Auth; a senha fica em `Account.password`)
- `Role`, `Permission`
- `UserRole`, `RolePermission` (com autor e instante, para auditoria)
- `AuditLog`

Não há `Customer`, `Proposal`, `Schedule`, `ServiceOrder` nem as demais entidades da Sprint 8.

## 4. Seed

`prisma/seed.ts`, comando `npm run db:seed`.

Cria a organização `SERVSAM` (`slug` `servsam`), as permissões, os papéis `ADMINISTRATIVO`, `GERENCIA`, `FINANCEIRO` e `DIRETORIA`, e as associações que ainda não existem. Associação já existente não é apagada: uma edição feita na tela sobrevive a um novo seed.

O usuário inicial só é criado quando `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` estão definidos. A senha não está no repositório. Se o e-mail já existe, o seed não troca a senha. O valor local fica só no `.env.local`.

## 5. Autenticação

Better Auth 1.7 com adaptador Prisma. Cadastro público desligado. Verificação de e-mail desligada nesta sprint, embora possa existir chave de envio no ambiente: não há fluxo de confirmação.

- Login em `/sistema/login` com e-mail e senha.
- Hash gerado pelo próprio Better Auth.
- Cookie de sessão httpOnly. Em base `https`, o cookie segue o modo seguro da biblioteca.
- Logout em `/sistema`.
- Layout de `/sistema/(app)` chama `requireAuthenticatedUser` e redireciona para o login.
- Usuário inativo é barrado na criação da sessão e de novo depois do sign-in, com a mesma mensagem de credencial inválida.
- Origem confiável: `BETTER_AUTH_URL`. Formulários usam Server Actions, com a checagem de origem do Next.js.
- Rate limit da biblioteca fica desligado só quando `VITEST=true`.

A sessão demo não é consultada. A senha `servsam-demo` não aparece em `/sistema`.

## 6. RBAC

Helpers: `requireAuthenticatedUser`, `requirePermission`, `hasPermission`, `userHasPermission`. A permissão efetiva é a união das chaves dos papéis. Não há deny.

Telas:

- `/sistema/login`
- `/sistema`
- `/sistema/configuracoes/usuarios` — listar, criar, editar nome, ativar, desativar, atribuir e remover papéis. Sem exclusão de usuário.
- `/sistema/configuracoes/perfis` — listar, ver permissões, criar papel e editar permissões para quem tem `role.manage`.

Quem não tem `user.manage` ou `role.manage` recebe recusa no servidor, mesmo que o objeto do ator carregue o código `DIRETORIA`.

### Permissões iniciais

`dashboard.view`; `customer.view`, `customer.create`, `customer.update`; `proposal.view`, `proposal.create`, `proposal.update`, `proposal.send`, `proposal.approve`; `schedule.view`, `schedule.create`, `schedule.update`; `service_order.view`, `service_order.create`, `service_order.update`, `service_order.execute`; `technical_report.view`, `technical_report.create`; `certificate.view`, `certificate.create`, `certificate.issue`; `contract.view`, `contract.manage`; `stock.view`, `stock.manage`; `finance.view`, `finance.manage`; `employee.view`, `employee.manage`; `vehicle.view`, `vehicle.manage`; `tender.view`, `tender.manage`; `document.view`, `document.manage`; `report.managerial.view`, `report.financial.view`; `user.view`, `user.manage`; `role.view`, `role.manage`; `audit.view`.

Não há chave de processos, de leads nem de alerta. Alerta continua dependendo da chave do domínio, como a Sprint 8 pediu.

### Perfis semente

| Papel | Concessão |
| --- | --- |
| `ADMINISTRATIVO` | Clientes, proposta (ver, criar, editar, enviar), OS, relatório técnico e certificado como explícitos. Dashboard, aceite de proposta, agenda, colaborador (ver), veículo (ver), contrato (ver) e documento (ver) como inferidos |
| `GERENCIA` | Todas as chaves, exceto financeiro, relatórios financeiros, usuários, papéis e auditoria. Tudo explícito |
| `FINANCEIRO` | O conjunto administrativo, mais financeiro e relatório financeiro explícitos. `contract.manage` e `tender.view` inferidos. Sem `tender.manage` |
| `DIRETORIA` | Todas as chaves, explícitas, inclusive `user.manage`, `role.manage` e `audit.view` |

`proposal.send` cobre "enviar". `technical_report.create` cobre "emitir". A base `inferred` fica no código do seed e no metadata `basis` do `PERMISSION_GRANTED` gravado na carga. Não há coluna de base no banco.

O papel `DIRETORIA` não pode ficar sem as três chaves de administração. É salvaguarda operacional, não regra de negócio do tipo "se o papel é diretoria, libera o módulo".

## 7. Eventos auditados

`LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `USER_CREATED`, `USER_UPDATED`, `USER_ACTIVATED`, `USER_DISABLED`, `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_ASSIGNED`, `ROLE_REMOVED`, `PERMISSION_GRANTED`, `PERMISSION_REVOKED`.

## 8. APIMG e o projeto de referência

O projeto de referência consultado foi o site em `AleFeio/Projetos/site`. Não foi alterado.

Padrões reutilizados de forma adaptada:

- runtime só em `RUNTIME_DATABASE_URL`;
- migration só em `POSTGRES_URL`;
- `DATABASE_URL` e `PRISMA_DATABASE_URL` ignoradas pelo código;
- guarda para não migrar produção da Vercel;
- placeholder de URL durante `prisma generate` e durante o build, quando a variável ainda não existe;
- upload APIMG no servidor: POST na URL completa, cabeçalho `X-API-Key`, campo `file`, resposta com URL pública e metadados.

Incompatibilidades:

- O usuário de referência tem um campo `role` com valores fixos. O SERVSAM não copia isso.
- No referência, runtime com pool e migration direta já são URLs diferentes. Aqui as quatro URLs ainda coincidem.
- A referência já envia imagem. O SERVSAM não ganhou módulo de upload: não há tela nem entidade que grave a URL nesta sprint.

A integração deve começar de fato na Sprint 13, para evidência da execução da ordem de serviço, e de novo na Sprint 15, para o relatório fotográfico. A chave não pode ir para Client Component.

## 9. Testes adicionados

- `src/lib/platform/platform.test.ts` — união de chaves, exclusão de financeiro, chaves da diretoria, base inferida da agenda, limpeza de segredo no metadata, papéis das variáveis de banco, ausência de `localStorage` e da senha demo em `/sistema`, presença dos helpers de autorização.
- `src/lib/platform/platform.integration.test.ts` — senha errada, login, inativo, recusa pelo nome do papel, concessão de permissão, desativação, criação de papel, criação de usuário com atribuição de papel, eventos de auditoria.
- `e2e/production-auth.spec.ts` — rota privada, login real, tela de usuários e logout.

Os testes de integração escrevem no banco de desenvolvimento e apagam os registros que criam. Não migram fixture do demo.

## 10. Arquivos

Criados na sprint, entre código e documentação:

- `prisma/schema.prisma`
- `prisma/migrations/20261022140103_platform_foundation/migration.sql`
- `prisma/seed.ts`
- `prisma.config.ts`
- `scripts/run-prisma.ts`
- `src/lib/db/urls.ts`
- `src/lib/db/prisma.ts`
- `src/lib/platform/permissions.ts`
- `src/lib/platform/auth.ts`
- `src/lib/platform/auth-client.ts`
- `src/lib/platform/audit.ts`
- `src/lib/platform/access.ts`
- `src/lib/platform/authenticate.ts`
- `src/lib/platform/accounts.ts`
- `src/lib/platform/roles.ts`
- `src/lib/platform/actions.ts`
- `src/lib/platform/platform.test.ts`
- `src/lib/platform/platform.integration.test.ts`
- `src/features/platform/production-login-form.tsx`
- `src/features/platform/production-shell.tsx`
- `src/features/platform/users-admin.tsx`
- `src/features/platform/roles-admin.tsx`
- `src/app/sistema/login/page.tsx`
- `src/app/sistema/(app)/layout.tsx`
- `src/app/sistema/(app)/page.tsx`
- `src/app/sistema/(app)/configuracoes/usuarios/page.tsx`
- `src/app/sistema/(app)/configuracoes/perfis/page.tsx`
- `src/app/api/auth/[...all]/route.ts`
- `e2e/production-auth.spec.ts`
- `.env.example`
- `docs/sprints/sprint-09.md`
- `docs/sprints/sprint-09-report.md`

Alterados: `package.json`, `package-lock.json`, `.gitignore`, `eslint.config.mjs`, `vitest.config.ts`, `next.config.ts`, `playwright.config.ts`, `e2e/contact-form.spec.ts`, `README.md`, `.cursor/rules/servsam-mvp.mdc`, `docs/product-backlog.md`, `docs/decision-log.md`, `docs/architecture/overview.md` e os textos de status em `docs/architecture/v1/`.

`.env.local` recebeu apenas `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` e continua fora do Git. O cliente gerado em `src/generated/prisma` também fica de fora.

## 11. Checks

Executados em 22/10/2026, no working tree, sem commit.

| Comando | Resultado |
| --- | --- |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npm test` | passou — 16 arquivos, 63 testes |
| `npm run build` | passou — Next.js 16.3.3, repetido depois de `allowedDevOrigins`. `/sistema` e `/sistema/login` dinâmicos. O demo continua nas rotas estáticas |
| `npm run test:e2e` | passou — 7 testes, inclusive login real, usuários, logout e o demo |

O Playwright usa `http://127.0.0.1`. O Next.js 16 bloqueia recursos de desenvolvimento vindos desse host. `next.config.ts` libera `127.0.0.1` só para o dev server. A espera do e2e de produção é de 30 segundos depois do clique em entrar, porque o hash da senha é lento de propósito. O checkbox de consentimento do contato é acionado pelo papel acessível, porque o controle visual e o input oculto compartilham o mesmo rótulo.

O navegador interativo desta sessão não estava disponível. O fluxo de tela foi exercido pelo Playwright.

## 12. Divergências em relação à Sprint 8

- Chaves pontilhadas no lugar de `customers`, `proposals`, `financial` e das demais chaves grossas. A matriz e as células inferidas foram preservadas.
- `proposal.send` separada de criar e editar. Emitir relatório técnico cabe em `technical_report.create`.
- Chaves extras para licitação, documento e os dois recortes de relatório, porque a matriz da Sprint 8 já distinguia essas linhas.
- `Session`, `Account` e `Verification` existem porque o Better Auth precisa delas.
- A senha não é coluna de `User`.
- Auditoria de plataforma começou agora. O painel e a imagem antes/depois continuam na Sprint 20.
- Reexecutar o seed não revoga permissão editada na tela.
- Diretoria tem uma trava nas três chaves de administração.
- Verificação de e-mail não é exigida.
- Não há cliente APIMG no código.

## 13. Riscos

- Várias células da matriz seguem inferidas e ainda precisam de confirmação do cliente. "Processos" continua sem chave.
- O hash de senha é lento de propósito. Os testes de integração levam dezenas de segundos e por isso o Vitest roda um arquivo por vez.
- Os testes de integração usam o banco de desenvolvimento. Eles recusam o rótulo `production`, e mesmo assim esse banco não deve ser o de produção.
- Um novo seed não corrige senha já gravada.
- A trava da Diretoria impede remover a administração desse papel até a regra ser revista.
- O aviso do driver `pg` sobre `sslmode=require` permanece. A URL do ambiente não foi alterada.
- O pacote local de engines do Prisma anuncia Node 22. O projeto segue em Node 20 e a instalação concluiu com esse aviso.

## 14. Pendências para a Sprint 10

- Abrir a sprint só por pedido explícito.
- Modelar `Customer`, `CustomerContact` e `CustomerUnit` com `organizationId`.
- Não copiar fixture do demo para essas tabelas.
- Confirmar com o cliente as células inferidas antes de tratar a matriz como fechada.
- Manter `/demonstracao` e `/sistema` separados.

Não iniciar a Sprint 10 neste relatório.

Atualização posterior, em 22/10/2026: a Sprint 10 foi aberta com outro objetivo. Ela não modelou `Customer`. A validação visual ficou em `/demonstracao` e a fila de domínios reais foi congelada. Ver `docs/sprints/sprint-10.md` e `docs/product-backlog.md`.
