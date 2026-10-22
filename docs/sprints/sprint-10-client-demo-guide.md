# Roteiro interno — apresentação da Sprint 10

Documento para quem conduz a reunião. Não é material para entregar ao cliente. Tudo abaixo é fictício e vive em `/demonstracao`. A data de referência da massa é 28/08/2026.

Entrar com `direcao@demo.servsam.local` e a senha visível na tela de login (`servsam-demo`). Se a massa local estiver antiga, usar "Restaurar dados demonstrativos" no topo.

## 1. Dashboard

- Rota: `/demonstracao`
- Registro: visão geral, com atalhos do Hotel Amazonas
- Ação: ler os cartões de hoje, da semana, OS abertas, propostas, certificados, contratos e atraso. Abrir "Revisar o atestado pendente" só se quiser pular; o roteiro segue a ordem abaixo.
- Explicar: a tela responde o que precisa de atenção agora. Os números saem da massa fictícia.
- Aprovar: se esses cartões são as prioridades certas e se algum alerta deve sair ou entrar.

## 2. Cliente

- Rota: `/demonstracao/clientes/client-hotel-amazonas`
- Registro: Hotel Amazonas Plaza (DEMO), CNPJ numérico `04.882.110/0001-36`, relacionamento com contrato
- Ação: mostrar razão social, fantasia, endereço, responsável e a linha do tempo.
- Explicar: esta ficha é o futuro prontuário. O histórico liga proposta, OS, relatório, certificado e financeiro.
- Aprovar: campos cadastrais e se o cliente avulso (Restaurante Mangue Azul, CNPJ alfanumérico `A1.B2C.3D4/0001-55` em `/demonstracao/clientes/client-restaurante-mangue`) precisa da mesma ficha.

## 3. Proposta

- Rota: `/demonstracao/comercial/propostas/prop-005`
- Registro: DEMO-005, aceita, desconto de R$ 400, total R$ 9.800
- Ação: percorrer itens, pagamento, entrada, prazo, condições, taxa de cancelamento e clicar em "Gerar prévia (demo)".
- Explicar: a marca d'água é prévia. Não sai PDF oficial.
- Aprovar: ordem dos campos, condições comerciais e se a numeração deve ser sequencial da SERVSAM.

## 4. Aprovação

- Rota: a mesma proposta DEMO-005
- Registro: status já aprovada, com OS ligada
- Ação: mostrar o aviso de que o próximo passo é agendar e o link "Abrir OS".
- Explicar: rascunho, enviada e aprovada são o caminho principal. Recusada, expirada e cancelada existem para a conversa, sem um fluxo transacional.
- Aprovar: se a aprovação libera o agendamento automaticamente ou se alguém confirma antes.

## 5. Agenda

- Rota: `/demonstracao/agenda`
- Registro: OS do hotel em 28/08/2026, veículo F2, situação "Em execução"
- Ação: alternar Diária, Semanal e Mensal. Mostrar serviço, cliente, endereço, horário, equipe e veículo.
- Explicar: a agenda SERVSAM é a fonte. Google Calendar não está ligado. O texto da tela deixa isso explícito.
- Aprovar: nomes dos veículos, status (programado, confirmado, em execução, concluído, reagendado, cancelado) e se a semana começa na segunda.

## 6. Ordem de serviço

- Rota: `/demonstracao/ordens-servico/os-demo-04`
- Registro: higienização de reservatórios, tipo "RSV – Reservatórios", torre de hóspedes, veículo F2
- Ação: ler tipo, local, equipe, veículo, proposta de origem e a caixa de prévia.
- Explicar: a OS planeja. O termo e as fotos de campo ficam na execução.
- Aprovar: se RSV, poço, coleta de água, CIP, ETE, ETA e retrolavagem são tipos fixos ou texto livre.

## 7. Execução

- Rota: `/demonstracao/ordens-servico/os-demo-04/execucao`
- Registro: execução iniciada às 10:12, aceite ainda pendente, duas fotos locais
- Ação: contrastar o cartão "Planejamento" com o cartão "No local". Mostrar checklist, quantidade do produto e evidências.
- Explicar: esta tela é a referência futura do mobile, e o mobile não faz parte desta versão.
- Aprovar: o que a equipe registra no local e o que continua só no escritório.

## 8. Relatório

- Rota: `/demonstracao/relatorios/fotograficos/rel-foto-hotel`
- Registro: relatório fotográfico de reservatórios, seis fotos locais
- Ação: percorrer antes, depois, NR-33, NR-35 e os espaços de assinatura.
- Explicar: o layout é demonstrativo e está pendente de validação. Não é o modelo oficial e não usa upload real.
- Aprovar: seis fotos por página, textos obrigatórios e quem assina.

## 9. Certificado

- Rota: `/demonstracao/certificados/cert-hotel-001`
- Registro: AT-DEMO-2026-014, prévia, produto hipoclorito fictício
- Ação: ler a faixa "Layout fictício · pendente de validação do cliente". Mostrar princípio ativo, grupo químico, registro e licenças.
- Explicar: licenças estão como "pendente de validação", no mesmo critério das certificações públicas. Não há emissão oficial.
- Aprovar: campos, validade e o modelo gráfico quando o cliente tiver o arquivo oficial.

## 10. Financeiro

- Rota: `/demonstracao/financeiro`
- Registro: filtrar o cliente Hotel Amazonas Plaza. Parcela `fin-025` (2/2, em aberto) e `fin-026` (negociado)
- Ação: mostrar situação e as janelas de 30, 60 e 90 dias.
- Explicar: é controle gerencial de receber, parcela e atraso. Não é ERP contábil, nota fiscal nem cobrança bancária.
- Aprovar: os quatro status e se licitação precisa aparecer nesta mesma lista.

## 11. Histórico

- Rota: `/demonstracao/clientes/client-hotel-amazonas`
- Registro: a mesma ficha do passo 2
- Ação: descer a linha do tempo e abrir um item para mostrar que volta ao mesmo registro.
- Explicar: o cliente é o agregador. A OS é o agregador da operação. O histórico só junta o que já existe na demonstração.
- Aprovar: se falta algum documento nessa linha (contrato, notificação, licença).

## Apoio, se perguntarem

- Produtos: `/demonstracao/estoque` e o hipoclorito em `/demonstracao/estoque/prod-001`
- Contratos: `/demonstracao/contratos/contract-004`
- Colaboradores: `/demonstracao/colaboradores/emp-bruno` (ASO vencido, NR-33 pendente) e `/demonstracao/colaboradores/emp-ana` (NR-35 a vencer)
- Documentos: `/demonstracao/documentos`
- Configurações visuais: `/demonstracao/configuracoes`. Usuários reais continuam em `/sistema`.
- CRM, Kanban e licitações continuam no menu Apoio. Não foram apagados.
