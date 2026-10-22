# Escopo

**Data:** 22/10/2026.

A V1 é o sistema web desktop de produção do fluxo mestre, mais os módulos já demonstrados que o backlog coloca nas Sprints 9 a 20. O site institucional acompanha, sem sprint própria de reescrita.

## V1

Entra nas Sprints 9 a 20. Ver `docs/product-backlog.md`.

- PostgreSQL, Prisma, autenticação, usuários e RBAC configurável.
- Clientes, contatos e unidades.
- Proposta, aceite do cliente e abertura de agenda a partir desse aceite.
- Agenda SERVSAM, equipe e veículo.
- Colaborador no nível necessário para escalar OS e alertar ASO, NR-33 e NR-35.
- Ordem de serviço e execução.
- Produto com dados regulatórios, lote, unidade de medida e movimentação.
- Relatório técnico com fotos e PDF no modelo SERVSAM.
- Certificado/atestado com numeração, produtos, licenças e PDF oficial.
- Contratos e financeiro gerencial: receber, parcelas, pagamentos, vencimentos, renegociação de parcela, receita, despesa básica, alertas.
- Licitações.
- Alertas transversais e dashboard operacional.
- Relatórios gerenciais.
- Auditoria, testes e implantação.
- Site institucional já existente, ainda com conteúdo pendente de validação.

## V1.1

Arquitetura já considerada, sem sprint numerada. Não bloqueia a abertura da Sprint 9 e não deve furar a fila do fluxo mestre.

- Persistência de produção de leads, oportunidades e Kanban.
- Dossiê de RH além do mínimo da Sprint 12: advertências, EPI, histórico longo e biblioteca de treinamentos.
- Regra de pós-venda (o alerta existe como tipo; o gatilho não).
- Alçada interna de quem pode enviar proposta ou registrar aceite, se o cliente definir.
- Versão de proposta e política de cancelamento de rascunho, se os estados atuais não bastarem.
- Mais de uma execução no mesmo número de OS.

## Futuro

Não está na V1 nem na V1.1. Pode ser contratado depois, com desenho próprio.

- Google Calendar apenas como integração. A agenda SERVSAM continua fonte da verdade.
- Épico mobile de campo, em `docs/future/mobile-field-epic.md`, com contrato separado.
- Portal externo do cliente, se um dia for produto.
- Manutenção de frota acima de "qual veículo está na OS".
- Integração operacional com WhatsApp. O link `wa.me` do site público não é essa integração.

## Fora do escopo atual

Não implementar e não desenhar schema para:

- aplicativo mobile;
- PWA offline;
- geolocalização;
- câmera mobile;
- emissão de NF-e;
- contabilidade completa;
- folha de pagamento completa;
- ERP fiscal;
- portal externo do cliente;
- manutenção completa de frota;
- integrações profundas com WhatsApp;
- Google Calendar como fonte da verdade.

Itens repetidos em "futuro" e aqui estão fora agora. "Futuro" só indica que não foram recusados para sempre. Nenhum deles entra nas Sprints 9 a 20.

## Dependências que a ordem das sprints precisa respeitar

A ordem 9 a 20 foi aceita. Estas dependências não mudam a ordem; evitam que uma sprint comece sem insumo.

| Sprint | Precisa antes |
| --- | --- |
| 11 Propostas | Clientes (10) e catálogo mínimo de serviço |
| 12 Agenda | Clientes; colaborador e veículo ao menos cadastráveis |
| 13 OS | Agenda e proposta aceita ou contrato |
| 15 Relatório | OS e o modelo PDF SERVSAM, que ainda não está no repositório |
| 16 Certificado | OS, produtos regulatórios (14), licenças da organização e responsável técnico |
| 17 Financeiro | Cliente e, no fluxo padrão, OS ou contrato |
| 18 Alertas | Datas de validade já gravadas nos módulos anteriores |

Risco principal: a Sprint 16 exige licença da SERVSAM e layout oficial, e a gestão larga de documentos só aparece na Sprint 18. A licença precisa de um cadastro mínimo na Sprint 16, mesmo que a caixa de alertas venha depois.

## O que não é escopo de nenhuma destas linhas

Refatorar a UI do demo na Sprint 8, apagar módulos demonstrativos ou trocar `localStorage` por banco antes da Sprint 9.
