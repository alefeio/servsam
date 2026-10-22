# Auditoria da documentação — Sprint 8

**Data:** 22/10/2026.  
**Método:** leitura dos Markdown do repositório e confronto com as rotas em `src/app` e com o backlog.

## Achado principal

O código entrega o MVP das Sprints 1 a 7. Parte dos documentos vivos ainda instruía o agente a implementar só a Sprint 1 e afirmava que os módulos além da visão geral não existiam.

## Classificação

| Arquivo | Classe | Ação na Sprint 8 |
| --- | --- | --- |
| `README.md` | Vivo, desatualizado | Reescrito no trecho de estado, limitações e estrutura |
| `.cursor/rules/servsam-mvp.mdc` | Vivo, desatualizado | Regra deixou de citar Sprint 1 como fase atual |
| `docs/architecture/overview.md` | Vivo, desatualizado | Passa a descrever o demo como está e aponta a V1 |
| `docs/product-backlog.md` | Vivo, incompleto | Sprints 1–7 preservadas; 8–20 incluídas |
| `docs/decision-log.md` | Vivo | Decisões da Sprint 8 acrescentadas. Histórico de agosto mantido |
| `docs/mvp/production-pending.md` | Aceite do demo | Nota no topo: a fila de produção agora é a V1, não esta lista solta |
| `docs/future/mobile-field-epic.md` | Fora de escopo | Nota de que continua fora da V1 |
| `docs/references/README.md` | Índice | Passa a apontar `docs/architecture/v1/` |
| `docs/architecture/data-provenance.md` | Vivo e ainda correto | Sem mudança de regra |
| `docs/content/content-inventory.md` | Inventário de 28/08/2026 | Sem mudança. Continua válido para o site e o demo |
| `docs/content/pending-client-validation.md` | Vivo | Acrescentadas pendências operacionais trazidas pelo briefing da Sprint 8 |
| `docs/mvp/screen-inventory.md` | Aceite do demo | Sem mudança. As rotas listadas existem |
| `docs/mvp/presentation-script.md` | Roteiro do demo | Sem mudança. Não descreve a V1 |
| `docs/sprints/sprint-01.md` … `sprint-07-report.md` | Histórico | Sem mudança. Descrevem o que aquelas sprints fizeram, inclusive o estado "planejado" da época |
| `docs/sprints/sprint-01-audit.md` | Histórico | Sem mudança |
| `Estrategia_MVP_Sprints_SERVSAM_e_Prompt_Cursor.md` | Histórico do planejamento de agosto | Aviso no topo. O corpo não foi reescrito |
| `AGENTS.md`, `CLAUDE.md` | Gerados pelo Next.js | Sem mudança de produto |
| `docs/architecture/v1/*` | Novo, especificação viva | Criado nesta sprint |

## Inconsistências que eram instrução errada

1. README: "Módulos além de Visão geral estão planejados, não implementados." Falso desde as Sprints 3 a 7. As doze entradas da sidebar estão implementadas como demo.
2. `.cursor/rules/servsam-mvp.mdc`: "Implemente apenas a sprint ativa (hoje: Sprint 1)" e "Não implemente Sprints 2 a 7". As sprints 2 a 7 já estão no código.
3. `docs/architecture/overview.md`: "a massa coerente chega na Sprint 2" e "snapshot do dashboard em arquivo estático". A massa está em `src/data/demo`, com cópia mutável no `localStorage`.
4. A regra pedia estado "Módulo planejado" para rotas futuras das sprints 2 a 7. Essas rotas agora têm tela. O catch-all `[...module]` continua no código para href ainda listado como planejado, mas a navegação atual só aponta módulos implementados.

## Inconsistências de produto, não de documento velho

1. Dois vocabulários de perfil. Demo: Direção e Compliance. V1: Administrativo, Gerência, Financeiro, Diretoria. Não são a mesma lista.
2. O fluxo mestre não passa por lead nem por Kanban. O demo é organizado ao redor do comercial. Os dois convivem; a prioridade de produção muda.
3. Contrato e licitação não aparecem na seta do fluxo mestre e continuam no produto. Ficaram como vias laterais.
4. A palavra "processos" no perfil Administrativo não tem módulo correspondente.
5. "Aprovação" não diz se é aceite do cliente ou alçada interna. A spec adota aceite do cliente e marca a alçada como pendente.
6. "Negociações" no financeiro não diz se é renegociação de parcela ou negociação comercial. A spec adota renegociação de parcela.
7. Relatório técnico pede PDF modelo SERVSAM e até 6 fotos por página. O modelo não está no repositório. Não está dito o total de fotos, nem quem assina, nem como a assinatura é capturada no desktop.
8. Certificado pede numeração automática sem máscara.
9. NR-33 e NR-35 "quando aplicável" sem lista de tipos de serviço.
10. Veículos F1, F2, F3, Saveiro e Kombi são exemplos do briefing, sem placa, ano ou confirmação de que a lista está completa.
11. Unidades UN, L, ML, KG e G são sementes, não necessariamente o catálogo fechado.
12. Pós-venda é citado como fonte de alerta sem gatilho.
13. RH operacional é domínio confirmado e também "considerar futuramente". A spec coloca o mínimo na Sprint 12 e o dossiê na V1.1, porque o backlog 9–20 não tem sprint de RH.
14. `overdue` no demo é status. A V1 propõe alerta. Isso é recomendação de modelagem, não pedido literal do briefing.
15. Há 15 propostas demo e 10 itens. Irrelevante para a V1, útil para não tratar o fixture como cobertura completa.

## O que não foi feito de propósito

- Não se reescreveu o histórico das Sprints 1 a 7 para parecer que elas já eram a V1.
- Não se removeu o catch-all nem qualquer tela demo.
- Não se criou `schema.prisma`.
