# SERVSAM

Site institucional e sistema interno da SERVSAM - Serviços de Saneamento e Meio Ambiente.

O repositório tem duas camadas:

1. **MVP demonstrativo (Sprints 1 a 7, entregue).** Site público e sistema desktop com dados fictícios. Valida navegação, linguagem e fluxos. Não é o sistema de produção.
2. **Fundação de produção (Sprint 9, entregue).** PostgreSQL, Prisma, login real, usuários, papéis e permissões em `/sistema`. Os módulos de negócio da V1 continuam na fila. Especificação em `docs/architecture/v1/`. Relatório em `docs/sprints/sprint-09-report.md`.

## Stack

- Next.js 16 (App Router)
- React 19 e TypeScript strict
- Tailwind CSS v4 e shadcn/ui
- PostgreSQL, Prisma 7 e Better Auth no ambiente `/sistema`
- Zod, Lucide React
- Vitest, Testing Library e Playwright

## Instalação

```bash
npm install
```

## Execução

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Se o visual aparecer sem estilos (HTML cru), pare todos os servidores Next.js locais e reinicie com cache limpo:

```bash
npm run dev:clean
```

Para produção local do demo:

```bash
npm run start:fresh
```

> **Importante:** não rode `npm run dev` e `npm run start` ao mesmo tempo. Os dois compartilham a pasta `.next` e isso pode invalidar os arquivos CSS servidos ao navegador.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run dev:clean` | limpa `.next` e inicia o dev |
| `npm run build` | build de produção local |
| `npm run build:clean` | limpa `.next` e gera build |
| `npm run start` | servir o build (exige build válido) |
| `npm run start:fresh` | build limpo + servidor de produção |
| `npm run clean` | remove cache `.next` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | testes unitários e de componente |
| `npm run test:e2e` | smoke tests Playwright |
| `npm run db:migrate` | cria e aplica migration no banco de desenvolvimento |
| `npm run db:deploy` | aplica migrations já versionadas |
| `npm run db:seed` | carga idempotente da organização, papéis e usuário inicial |

## Credenciais da demonstração

- Direção: `direcao@demo.servsam.local`
- Compliance: `compliance@demo.servsam.local`
- Senha dos dois: `servsam-demo`

A senha não é um segredo. Ela aparece na tela de login e existe só como fixture. A sessão fica no navegador e não representa autenticação de produção. Estes perfis não são os papéis da V1 (Administrativo, Gerência, Financeiro, Diretoria).

Acesso do demo: `/demonstracao/login`

O ambiente real fica em `/sistema/login`. O e-mail e a senha do primeiro usuário vêm de `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env.local`. Essa senha não aparece na interface e não é a senha do demo.

## O que o demo já tem

Site: Início, Sobre, Serviços, Segmentos, Experiência, Licenças, Conteúdos, Contato e Privacidade.

Sistema, em desktop, após o login:

- Visão geral
- Comercial (leads, oportunidades em Kanban, propostas)
- Clientes
- Agenda
- Ordens de serviço
- Contratos
- Licitações
- Estoque
- Financeiro
- Documentos
- Relatórios
- Configurações

Ações como mudar status ou exportar relatório alteram uma cópia local. O botão "Restaurar dados demonstrativos" devolve a massa original. Exportação de relatório gera arquivo `.demo.txt`, não PDF oficial.

## Estrutura

```text
src/app/(public)          rotas institucionais
src/app/(demo)            login, shell e módulos demonstrativos
src/app/sistema           login e administração real
src/lib/platform          autenticação, RBAC e auditoria
prisma/                   schema, migrations e seed
src/data/official         conteúdo verificado ou de briefing
src/data/demo             ficção explícita
src/lib/repositories      fronteira do demo
src/features              domínio (site, CRM, operação, gestão, demo, plataforma)
docs/architecture/v1      especificação funcional da V1
docs/                     sprints, conteúdo, aceite do MVP e épicas futuras
```

## Limitações do que está implementado

- O demo continua sem banco. O formulário de orçamento do site é simulado.
- Indicadores, clientes operacionais e financeiro do demo são fictícios.
- `/sistema` tem login, usuários, papéis e auditoria de plataforma. Cliente, proposta, agenda, OS, contrato, estoque, financeiro, certificado, relatório técnico e RH de produção ainda não têm tabela.
- Homologação não deve ser indexada (`robots` bloqueia o site inteiro).
- Fluxo mobile de campo não faz parte do demo nem da V1.

## Próxima implementação

A Sprint 10.1 ajustou o demo aos documentos operacionais, ainda sem implementação real. A implementação real de clientes continua congelada até o cliente aprovar as telas. Não abrir a Sprint 11 antes disso.

Backlog: `docs/product-backlog.md`. Setup local da fundação: `docs/sprints/sprint-09.md`.

## Conteúdo

Informações institucionais vêm do site atual e de registros públicos. Cases, artigos, clientes e indicadores são fictícios e marcados na interface. Veja `docs/content/content-inventory.md`.
