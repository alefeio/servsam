# SERVSAM

Site institucional e sistema interno demonstrativo da SERVSAM - Serviços de Saneamento e Meio Ambiente.

Esta fase valida arquitetura de informação, interface, terminologia e fluxos. Não é o sistema definitivo, não usa banco de dados e não processa dados reais de clientes.

## Stack

- Next.js 16 (App Router)
- React 19 e TypeScript strict
- Tailwind CSS v4 e shadcn/ui
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

Para produção local:

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

## Credenciais da demonstração

- E-mail: `direcao@demo.servsam.local`
- Senha: `servsam-demo`

A senha não é um segredo. Ela aparece na tela de login e existe só como fixture. A sessão fica no navegador e não representa autenticação de produção.

Acesso: `/demonstracao/login`

## Estrutura

```text
src/app/(public)          rotas institucionais
src/app/(demo)            login, shell e dashboard
src/data/official         conteúdo verificado ou de briefing
src/data/demo             ficção explícita
src/lib/repositories      fronteira para futura API
src/features              domínio (institucional, auth demo, dashboard)
docs/                     sprints, conteúdo, arquitetura e épicas futuras
```

## Limitações

- Sem banco, Prisma, API real ou envio de e-mail.
- Formulário de orçamento é simulado.
- Dashboard usa snapshot fictício.
- Módulos além de Visão geral estão planejados, não implementados.
- Homologação não deve ser indexada.
- Fluxo mobile de campo não faz parte desta etapa.

## Conteúdo

Informações institucionais vêm do site atual e de registros públicos. Cases, artigos, clientes e indicadores são fictícios e marcados na interface. Veja `docs/content/content-inventory.md`.
