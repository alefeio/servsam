# Inventário de telas — MVP demonstrativo

Referência: 28/08/2026. Todas as rotas abaixo exigem login demo, exceto `/demonstracao/login`.

## Acesso

| Rota | Título | Sprint |
| --- | --- | --- |
| `/demonstracao/login` | Login da demonstração | 1 |
| `/demonstracao` | Visão geral (dashboard) | 2 |

## Comercial e clientes

| Rota | Título | Sprint |
| --- | --- | --- |
| `/demonstracao/comercial` | Hub comercial | 3 |
| `/demonstracao/comercial/leads` | Leads | 3 |
| `/demonstracao/comercial/oportunidades` | Kanban de oportunidades | 3 |
| `/demonstracao/comercial/oportunidades/[id]` | Detalhe da oportunidade | 3 |
| `/demonstracao/comercial/propostas` | Propostas | 3 |
| `/demonstracao/comercial/propostas/[id]` | Detalhe da proposta | 3 |
| `/demonstracao/clientes` | Clientes | 3 |
| `/demonstracao/clientes/[id]` | Ficha do cliente | 3 |

## Operação

| Rota | Título | Sprint |
| --- | --- | --- |
| `/demonstracao/agenda` | Agenda administrativa | 4 |
| `/demonstracao/ordens-servico` | Ordens de serviço | 4 |
| `/demonstracao/ordens-servico/[id]` | Detalhe da OS | 4 |

## Governança

| Rota | Título | Sprint |
| --- | --- | --- |
| `/demonstracao/contratos` | Contratos | 5 |
| `/demonstracao/contratos/[id]` | Detalhe do contrato | 5 |
| `/demonstracao/documentos` | Documentos e compliance | 5 |
| `/demonstracao/documentos/[id]` | Detalhe do documento | 5 |

## Gestão integrada

| Rota | Título | Sprint |
| --- | --- | --- |
| `/demonstracao/licitacoes` | Licitações | 6 |
| `/demonstracao/licitacoes/[id]` | Detalhe da licitação | 6 |
| `/demonstracao/estoque` | Estoque | 6 |
| `/demonstracao/estoque/[id]` | Detalhe do produto | 6 |
| `/demonstracao/financeiro` | Financeiro gerencial | 6 |

## Consolidação MVP

| Rota | Título | Sprint |
| --- | --- | --- |
| `/demonstracao/relatorios` | Relatórios demonstrativos | 7 |
| `/demonstracao/configuracoes` | Configurações e perfis | 7 |

## Site institucional (público)

Home, Sobre, Serviços, Segmentos, Experiência, Conteúdos, Contato, Licenças, Privacidade — Sprint 1.

## Fora do inventário MVP

Mobile de campo, RBAC real, emissão fiscal — ver `docs/mvp/production-pending.md` e `docs/future/mobile-field-epic.md`.
