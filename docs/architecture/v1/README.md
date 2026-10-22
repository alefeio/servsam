# Arquitetura funcional da V1

Especificação viva a partir da Sprint 8 (22/10/2026). O MVP demonstrativo das Sprints 1 a 7 permanece no código e não é apagado.

A Sprint 8 escreveu esta pasta como especificação, antes de banco. A Sprint 9 implementou só a fundação: PostgreSQL, Prisma, autenticação, usuários, papéis, permissões e auditoria de plataforma. Clientes, propostas, agenda, ordens e os demais domínios continuam conceituais. O schema real está em `prisma/schema.prisma`. O relatório da implementação está em `docs/sprints/sprint-09-report.md`.

| Documento | Conteúdo |
| --- | --- |
| [functional-architecture.md](./functional-architecture.md) | Decisões, hierarquia e limites |
| [master-flow.md](./master-flow.md) | Fluxo mestre e vias laterais |
| [domain-map.md](./domain-map.md) | Domínios do demo e da V1 |
| [conceptual-model.md](./conceptual-model.md) | Entidades e correspondência com o demo |
| [relationships.md](./relationships.md) | Relacionamentos |
| [state-machines.md](./state-machines.md) | Estados de proposta, agenda, OS, execução, certificado e financeiro |
| [rbac.md](./rbac.md) | User, Role, Permission e matriz inicial |
| [scope.md](./scope.md) | V1, V1.1, futuro e fora do escopo |
| [documentation-audit.md](./documentation-audit.md) | Auditoria da documentação do repositório |

O backlog de implementação está em `docs/product-backlog.md` (Sprints 9 a 20).

Leituras que continuam válidas e não foram reescritas:

- `docs/mvp/` — aceite do protótipo demonstrativo
- `docs/sprints/sprint-01.md` a `sprint-07-report.md` — histórico das sprints já entregues
- `docs/content/` — proveniência do site e pendências de validação do cliente
