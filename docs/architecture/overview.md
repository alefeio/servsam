# Visão da arquitetura

Há duas descrições válidas, com papéis diferentes.

| Camada | Onde está | O que é |
| --- | --- | --- |
| Demo em execução | Este arquivo, seções abaixo | Next.js 16, sem banco, Sprints 1 a 7 |
| V1 de produção | `docs/architecture/v1/` e `/sistema` | Fundação da Sprint 9 no ar. Domínios de negócio ainda especificados |

## Demo em execução

Monólito modular em Next.js 16 (App Router). Não há banco, API externa nem backend separado.

### Experiências

- Site institucional público, responsivo, em `src/app/(public)`.
- Sistema demonstrativo desktop-first, em `src/app/(demo)/demonstracao`.

Os módulos da sidebar (visão geral, comercial, clientes, agenda, ordens de serviço, contratos, licitações, estoque, financeiro, documentos, relatórios e configurações) têm página própria. O catch-all de módulo planejado permanece no código e não é a navegação atual.

### Camadas

1. `src/data/official` e `src/data/demo`: conteúdo classificado e massa fictícia.
2. `src/lib/repositories`: fronteira estável para troca futura por API.
3. `src/lib/demo`: regras de CRM, operação, compliance, gestão e relatório sobre essa massa.
4. `src/features`: composição de tela por domínio.
5. `src/components`: UI e layout.
6. `src/app`: rotas, metadata e SEO.

### Convenções

- Server Components por padrão.
- Client Components só para interação (formulário, menu, login, shell, quadros e ações do demo).
- Código em inglês; interface em português do Brasil.
- Sem `fetch` em páginas. Sem `any`.

### Persistência do demo

- Sessão em `localStorage` (`servsam.demo.session`).
- Massa seed em `src/data/demo`. Alterações do usuário ficam em `localStorage` (`servsam.demo.dataset`).
- "Restaurar dados demonstrativos" substitui a cópia local pelo seed.
- Não há sincronização entre navegadores nem trilha de auditoria.

### O que a V1 muda na hierarquia, não neste demo

Cliente passa a ser o agregador de relacionamento. Ordem de serviço passa a ser o agregador da operação. O fluxo mestre e as entidades estão em `docs/architecture/v1/master-flow.md` e `docs/architecture/v1/conceptual-model.md`.

A Sprint 9 criou a fundação de acesso. Cliente, ordem de serviço e o restante do fluxo mestre continuam sem tabela de produção.
