# Sprint 10 — Relatório

**Status:** DONE na demonstração  
**Data:** 22/10/2026

A Sprint 10 não implementou o domínio `Customer`. Ela virou a validação visual da V1 em `/demonstracao`. A fundação da Sprint 9 em `/sistema` permanece. A fila original 10–20 da Sprint 8 não foi renumerada e está congelada em `docs/product-backlog.md`.

## Telas alteradas

- Dashboard (`/demonstracao`): prioriza o que precisa de atenção agora. Cartões de serviços de hoje, da semana, OS abertas, propostas pendentes, certificados a emitir, contratos a vencer e financeiro em atraso. Próximas ações apontam para a jornada do Hotel Amazonas.
- Ficha do cliente: dados cadastrais e linha do tempo.
- Proposta: condições comerciais, desconto, marca d'água, prévia e o caminho rascunho → enviada → aprovada, com recusada, expirada e cancelada nomeadas.
- Agenda: visão diária, além da semanal e da mensal. Compromisso mostra serviço, cliente, endereço, horário, equipe e veículo. Google Calendar aparece como não ligado.
- Ordem de serviço: tipo, veículo, agenda, prévia do termo e atalho para a execução e para o relatório fotográfico.
- Financeiro: situação Em aberto, Pago, Vencido e Negociado, parcela e janelas de 30, 60 e 90 dias.
- Produtos: nome comercial, princípio ativo, grupo químico, fabricante, registro, antídoto, ficha, FISPQ, lote e validade. A baixa continua fictícia.
- Contrato: resumo dos serviços.
- Documentos: mapa do repositório, mantendo o título "Documentos e compliance".
- Relatórios gerenciais: link para o relatório fotográfico. A exportação demo anterior permanece.
- Configurações: identidade, marca d'água, licenças, assinaturas e modelos. Usuários reais continuam em `/sistema`.
- Sidebar: fluxo do cliente primeiro. Comercial, licitações e relatórios gerenciais ficam em Apoio. Nada disso foi apagado.

## Telas criadas

- `/demonstracao/ordens-servico/[id]/execucao`
- `/demonstracao/relatorios/fotograficos` e `/demonstracao/relatorios/fotograficos/[id]`
- `/demonstracao/certificados` e `/demonstracao/certificados/[id]`
- `/demonstracao/colaboradores` e `/demonstracao/colaboradores/[id]`

## Fluxo demonstrativo

Hotel Amazonas Plaza (DEMO), CNPJ numérico `04.882.110/0001-36`, contrato `contract-004`.

1. Cliente `client-hotel-amazonas`
2. Proposta `prop-005` / DEMO-005, aprovada, R$ 9.800
3. Agenda em 28/08/2026, veículo F2, situação Em execução
4. OS `os-demo-04`, tipo RSV – Reservatórios
5. Execução `exec-os-demo-04`, iniciada, aceite pendente
6. Relatório `rel-foto-hotel`, seis fotos locais
7. Certificado `cert-hotel-001` / AT-DEMO-2026-014, prévia
8. Financeiro `fin-025` (parcela 2/2, em aberto) e `fin-026` (negociado)
9. A mesma ficha do cliente reúne a linha do tempo

O Restaurante Mangue Azul guarda o CNPJ alfanumérico `A1.B2C.3D4/0001-55` como exemplo de cliente avulso. Veículos de exemplo nas OS: F1, F2, F3, Saveiro e Kombi.

## Navegação

Grupo Fluxo: Visão geral, Clientes, Propostas, Agenda, Ordens de serviço, Relatório fotográfico, Certificados, Financeiro.

Grupo Apoio: Contratos, Produtos, Colaboradores, Documentos, Comercial, Licitações, Relatórios, Configurações.

O item ativo usa o href mais específico, para Propostas não acender Comercial e para o relatório fotográfico não acender Relatórios.

## Fixtures

Reaproveitados e enriquecidos: clientes, proposta DEMO-005, itens, OS, contrato, produto hipoclorito e lançamentos financeiros.

Novos em `src/data/demo/visual-records.ts`: colaboradores Ana e Bruno, certificado, relatório fotográfico e execução. `hydrateDemoDataset` completa registros novos sem apagar status que o navegador já alterou. Se a massa local estiver velha, "Restaurar dados demonstrativos" recomeça do seed.

## Campos incluídos

Cliente: razão social, nome fantasia, CNPJ/CPF, endereço, contatos, e-mail, responsável, observações, tipo de relacionamento.

Proposta: numeração, itens, quantidades, valores, desconto, pagamento, entrada, prazo, validade, condições, taxa de cancelamento, observações, marca d'água.

Agenda e OS: serviço, cliente, local, data, horário, equipe, veículo, tipo, status visual.

Execução: início, conclusão, equipe, produtos, quantidades, checklist, observações, fotos, responsável, assinatura reservada, aceite.

Relatório: descrição, antes, depois, NR-33, NR-35, até seis fotos, assinaturas reservadas.

Certificado: número, tipo, serviço, data, validade, produto, princípio ativo, grupo químico, registro, licenças, responsável técnico.

Produto: dados regulatórios, lote, validade, estoque, unidade.

Contrato: vigência, valor, serviços, periodicidade, reajuste, documentos, alerta.

Financeiro: contratos e OS ligados, vencimento, parcela, situação, 30/60/90.

Colaborador: função, ASO, NR-33, NR-35, EPI, treinamento, advertência.

## Decisões de UX

- A reunião anda por um único cliente, em vez de uma tabela solta em cada módulo.
- Planejamento da OS e execução são telas diferentes.
- Relatório e certificado têm prévia própria e uma faixa de que o layout é fictício e pendente de validação.
- Fotos são assets locais. Não há upload.
- O dashboard deixou de usar gráficos decorativos.
- Avisos de demonstração continuam, sem repetir um banner em cada cartão.
- Desktop segue sendo o alvo. A sidebar continua oculta abaixo de 1024px, como antes.

## O que ainda é só demonstração

Persistência no navegador, status simulados, prévia que não gera PDF oficial, estoque sem baixa, financeiro sem cobrança, agenda sem Google Calendar, fotos sem APIMG, colaboradores sem folha, configurações visuais sem edição real. Usuários, papéis e auditoria reais não foram duplicados: ficam em `/sistema`.

## O que apresentar e o que perguntar

O roteiro interno está em `docs/sprints/sprint-10-client-demo-guide.md`.

Perguntas para a reunião:

- A ordem da sidebar corresponde ao dia a dia?
- Falta campo na proposta, na OS, no relatório ou no certificado?
- RSV, poço, coleta, CIP, ETE, ETA e retrolavagem são lista fechada ou texto livre?
- Os veículos de exemplo estão certos?
- O que o módulo de pessoas deve guardar além de ASO, NR, EPI, treinamento e advertência?
- Os quatro status financeiros e as janelas de 30/60/90 bastam para a V1?
- Qual é o arquivo oficial do relatório e do certificado? As prévias atuais não são esse arquivo.
- Quais alertas viram tarefa e quais são só aviso?
- A aprovação da proposta libera o agendamento sozinha?

## Diferença para o demo anterior

O demo das Sprints 1 a 7 tinha CRM, agenda administrativa, OS, contratos, estoque, financeiro e relatórios gerenciais, com o comercial no topo. Esta sprint coloca o fluxo cliente → histórico na frente, separa execução de planejamento e cria relatório fotográfico, certificado e colaboradores. Os gráficos do dashboard saíram. CRM, Kanban e licitações continuam acessíveis, com prioridade menor.

## Checks

| Comando | Resultado |
| --- | --- |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npm test` | 17 arquivos, 66 testes, passou |
| `npm run build` | passou |
| `npm run test:e2e` | 8 testes, passou |

A primeira execução do Playwright logo depois do `next build` devolveu "Página não encontrada" em rotas que o build tinha gerado. Limpar `.next` e subir o `next dev` de novo eliminou o 404. A suíte seguinte ficou 7 a 1 por seletores ambíguos no teste novo (`Planejamento` e `ASO`). Os seletores foram apertados e a suíte completa passou: 8 testes, incluindo a jornada do Hotel Amazonas e o login de `/sistema`.

## Regressões

Nenhuma regressão ficou aberta. O 404 era o cache de build misturado com o servidor de desenvolvimento, não uma rota removida.

## Riscos

- Uma sessão antiga no navegador pode esconder campos novos até a restauração. A hidratação tenta completar a massa sem apagar edições.
- O certificado e o relatório podem ser lidos como documento oficial se a faixa de pendência for ignorada na reunião.
- O cartão "Contratos a vencer" conta contratos com status `expiring`. O contrato do hotel está `active` e aparece pelo atalho e pela ficha, não por esse número.
- A lista de alertas do dashboard mostra no máximo 12 itens.
- APIMG segue configurada e sem uso. Upload real continua depois da aprovação visual.

## O que só deve ser implementado depois da aprovação

Não abrir a implementação real agora. Quando o cliente aprovar as telas, a primeira peça de domínio continua sendo cliente, contatos e unidades no PostgreSQL — o item que a Sprint 8 tinha numerado como 10 e que esta sprint não construiu. Em seguida, na ordem congelada: proposta, agenda com equipe e veículo, OS e execução, produtos, relatório e PDF oficial, certificado, contratos e financeiro, alertas e só então licitações e hardening.

Não criar, antes disso, `Customer`, `Proposal`, `Schedule`, `ServiceOrder`, `TechnicalReport`, `Certificate`, `Product`, `Employee`, `Contract` ou `FinancialEntry` no Prisma. Não ligar APIMG nem Google Calendar. Não fazer commit desta sprint até haver um pedido explícito.
