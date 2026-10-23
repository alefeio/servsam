# Product backlog

Backlog SERVSAM. Sprints 1 a 7 entregaram o MVP demonstrativo. A Sprint 8 realinhou a documentação da V1. A Sprint 9 entregou a fundação de produção. A Sprint 10 valida visualmente a V1 em `/demonstracao`. A implementação real dos domínios continua congelada.

Especificação: `docs/architecture/v1/`.

## Entregue

| Sprint | Escopo | Estado |
| --- | --- | --- |
| 1 | Site institucional, login demo, shell, dashboard inicial | Entregue |
| 2 | Massa demo coerente, métricas derivadas, restauração | Entregue |
| 3 | CRM: leads, oportunidades, propostas, clientes | Entregue no demo |
| 4 | Agenda e OS administrativa desktop | Entregue no demo |
| 5 | Contratos, documentos, compliance | Entregue no demo |
| 6 | Licitações, estoque, financeiro gerencial fictício | Entregue no demo |
| 7 | Relatórios, configurações, QA e documentação de aceite | Entregue |
| 8 | Arquitetura funcional e documentação da V1 | Entregue (só documentação) |
| 9 | PostgreSQL, Prisma, autenticação, usuários, papéis, permissões e auditoria de plataforma | Entregue |
| 10 | Validação visual e funcional da V1 em `/demonstracao` | Entregue no demo. Sem domínio novo no Prisma |
| 10.1 | Adequação da demonstração aos documentos operacionais do cliente | Entregue no demo. Sem domínio novo no Prisma |

O CRM demonstrativo continua no produto. Na produção, lead, oportunidade e Kanban ficam atrás do fluxo mestre (V1.1). A proposta demonstrativa foi reorganizada na Sprint 10. A implementação real de proposta continua fora desta sprint.

## Sprint ativa

A Sprint 10.1 está concluída como ajuste da demonstração. Nenhuma sprint de implementação de domínio está ativa.

`/sistema` permanece a fundação da Sprint 9. `/demonstracao` é o ambiente de apresentação ao cliente.

## Fila de produção congelada

Ordem fechada na Sprint 8 e **não renumerada**. A partir de 22/10/2026 essa fila deixa de ser o trabalho da sprint corrente. A Sprint 10 desta execução foi trocada por validação visual. O item "clientes reais" que ocupava o número 10 na tabela abaixo **não foi implementado**. Quando o cliente aprovar as telas, a primeira implementação de domínio continua sendo clientes, salvo nova decisão explícita. Não abrir a Sprint 11 nem as seguintes antes disso.

| Sprint | Foco previsto na Sprint 8 | Estado depois da mudança |
| --- | --- | --- |
| 9 | Fundação: PostgreSQL, Prisma, autenticação, usuários e RBAC configurável | Entregue |
| 10 | Clientes e estrutura administrativa (contatos e unidades) | Número usado pela validação visual. Domínio real não iniciado |
| 11 | Propostas e aprovação (aceite que libera agenda) | Congelada |
| 12 | Agenda, equipes e veículos. Colaborador no mínimo para escalar e alertar NR/ASO | Congelada |
| 13 | OS e execução | Congelada |
| 14 | Produtos e almoxarifado, com dados regulatórios, lote e unidade | Congelada |
| 15 | Relatórios técnicos e fotográficos, PDF modelo SERVSAM | Congelada |
| 16 | Certificados e atestados | Congelada |
| 17 | Contratos e financeiro gerencial | Congelada |
| 18 | Alertas transversais e dashboard operacional | Congelada |
| 19 | Licitações e relatórios gerenciais | Congelada |
| 20 | Hardening, auditoria, testes e implantação | Congelada |

Detalhe do que é V1, V1.1, futuro ou fora: `docs/architecture/v1/scope.md`.

## Fora desta fila

- Mobile de campo: `docs/future/mobile-field-epic.md`
- NF-e, contabilidade, folha, ERP fiscal, portal do cliente, frota completa, WhatsApp profundo, Google Calendar como agenda principal

## Decisões ainda abertas antes de codar papéis e PDF

Listadas em `docs/architecture/v1/documentation-audit.md`. As que mais afetam a Sprint 9 são o significado de "processos", quem administra papéis e a confirmação da matriz em `docs/architecture/v1/rbac.md`.

## Mudanças de escopo

Pedido novo entra neste arquivo e não reescreve o aceite das Sprints 1 a 7 nem o demo já navegável.
