# Visão da arquitetura

O MVP SERVSAM é um monólito modular em Next.js 16 (App Router). Nesta fase não há banco, API externa nem backend separado.

## Experiências

- Site institucional público, responsivo, em `src/app/(public)`.
- Sistema demonstrativo desktop-first, em `src/app/(demo)/demonstracao`.

## Camadas

1. `src/data/official` e `src/data/demo`: conteúdo classificado.
2. `src/lib/repositories`: fronteira estável para troca futura por API.
3. `src/features`: regras e composição por domínio.
4. `src/components`: UI e layout.
5. `src/app`: rotas, metadata e SEO.

## Convenções

- Server Components por padrão.
- Client Components só para formulário, menu mobile, login e shell autenticado.
- Código em inglês; interface em português do Brasil.
- Sem `fetch` em páginas. Sem `any`.

## Persistência desta sprint

- Sessão demo em `localStorage`.
- Snapshot do dashboard em arquivo estático.
- Restaurar dados apenas registra um marco local; a massa coerente chega na Sprint 2.
