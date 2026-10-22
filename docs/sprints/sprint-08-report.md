# Relatório da Sprint 8

**Data:** 22 de outubro de 2026  
**Natureza:** documentação e arquitetura. Nenhum comportamento de tela foi alterado. Não houve commit.

## 1. Resultado

A documentação viva deixa de tratar o repositório como Sprint 1. A V1 passa a ter fluxo mestre, mapa de domínios, modelo conceitual, relacionamentos, estados, matriz RBAC e recorte de escopo. O demo das Sprints 1 a 7 permanece.

Não foi criado `schema.prisma`. Não há banco, autenticação real nem API.

## 2. Arquivos criados

- `docs/architecture/v1/README.md`
- `docs/architecture/v1/functional-architecture.md`
- `docs/architecture/v1/master-flow.md`
- `docs/architecture/v1/domain-map.md`
- `docs/architecture/v1/conceptual-model.md`
- `docs/architecture/v1/relationships.md`
- `docs/architecture/v1/state-machines.md`
- `docs/architecture/v1/rbac.md`
- `docs/architecture/v1/scope.md`
- `docs/architecture/v1/documentation-audit.md`
- `docs/sprints/sprint-08.md`
- `docs/sprints/sprint-08-report.md`

## 3. Arquivos alterados

- `README.md`
- `.cursor/rules/servsam-mvp.mdc`
- `docs/architecture/overview.md`
- `docs/product-backlog.md`
- `docs/decision-log.md`
- `docs/mvp/production-pending.md` (nota de encaminhamento; a lista do demo foi mantida)
- `docs/future/mobile-field-epic.md`
- `docs/references/README.md`
- `docs/content/pending-client-validation.md`
- `Estrategia_MVP_Sprints_SERVSAM_e_Prompt_Cursor.md` (aviso histórico no topo; corpo intacto)

Históricos `docs/sprints/sprint-01*` a `sprint-07*` não foram reescritos.

## 4. Decisões

Registradas em `docs/decision-log.md`: fluxo mestre, cliente como agregador de relacionamento, OS como agregador da operação, RBAC configurável, agenda SERVSAM como fonte da verdade, financeiro gerencial e fila 9 a 20.

Recomendações de modelagem (não são pedido literal) estão marcadas nos documentos: aceite do cliente como "aprovação", atraso como alerta em vez de status `overdue`, união de papéis sem deny, RH profundo na V1.1, CRM de produção na V1.1.

## 5. Checks

Executados em 22/10/2026 no working tree, sem mudança de código de aplicação.

| Comando | Resultado |
| --- | --- |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npm test` | passou — 14 arquivos, 52 testes |
| `npm run build` | passou — Next.js 16.3.3 |

`npm run test:e2e` existe e não foi pedido nesta sprint. Não foi executado.

## 6. Ambiguidades que permanecem

Estão detalhadas em `docs/architecture/v1/documentation-audit.md`. Nenhuma foi "resolvida" inventando regra de negócio fechada onde o briefing não fechou. As de maior efeito na Sprint 9:

- significado de "processos" no perfil Administrativo;
- quem administra usuários e papéis (a matriz recomenda só Diretoria);
- células marcadas como inferidas na matriz RBAC;
- alçada interna versus aceite do cliente;
- renegociação financeira versus negociação comercial;
- modelo PDF, máscara do certificado, assinaturas e quando NR-33/NR-35 se aplicam;
- lista real de veículos;
- gatilho de pós-venda;
- profundidade de RH dentro da Sprint 12.

## 7. Riscos antes da Sprint 9

- Semear os quatro papéis com as células "inferido" sem confirmação do cliente fixa acesso errado.
- Certificado (Sprint 16) depende de licença da organização e do PDF oficial, que ainda não estão no repositório. A gestão larga de documentos está na Sprint 18.
- O demo guarda lote no produto, equipe como texto e `overdue` como status. A Sprint 9 não deve copiar isso para o Prisma como modelo definitivo.
- Direção/Compliance do demo e os quatro papéis da V1 não podem ser a mesma tabela sem um mapa explícito.
