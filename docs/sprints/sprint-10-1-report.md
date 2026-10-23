# Relatório da Sprint 10.1

A demonstração em `/demonstracao` passou a representar o fluxo visto nos documentos operacionais da SERVSAM. A fundação de `/sistema` e a home pública ficaram como estavam.

## Diferença em relação à Sprint 10

A Sprint 10 ligava aceite, agenda e OS como se o aceite já liberasse o agendamento. A 10.1 coloca a formalização no meio e faz a execução mudar conforme a família do serviço.

## Telas alteradas

- Proposta, com formalização e blocos técnicos.
- Agenda, com visitas do mesmo serviço.
- Ordem de serviço, com formulário da família e visitas.
- Execução, com avaliação do atendimento.
- Relatório fotográfico, em seções e páginas de 4 fotos.
- Certificados, com modelos diferentes e faixa de prévia.
- Cliente, com a linha do atendimento.
- Documentos, com o ciclo operacional.
- Colaboradores, com documento e NR-10.
- Configurações, com veículos, responsáveis técnicos e licenças fictícias.
- Visão geral, com alertas de formalização e processo ambiental quando cabem na lista.

## Telas criadas

- Documentação pré-serviço, dentro da OS.
- Processos ambientais, em Apoio.

## Fixtures

`src/data/demo/operational-story.ts` concentra os registros novos. A narrativa principal continua no Hotel Amazonas Plaza. Entraram a Pousada Murucutu, o Sítio Iara e o Residencial Marajó, todos fictícios.

Famílias representadas: RSV, CIP, coleta de água, ETE, monitoramento e poço.

## Privacidade

Nenhum arquivo original do cliente foi copiado para o repositório. Nomes, placas, registros profissionais e números de licença da demonstração foram inventados para a reunião.

## Checks

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: 18 arquivos, 70 testes, passou.
- `npm run build`: passou.
- `npm run test:e2e`: 8 testes, passou. A primeira tentativa falhou porque o Chromium do Playwright não estava no cache desta sessão; depois da instalação, uma execução acusou texto duplicado da prévia da OCS e foi corrigida. A suíte seguinte passou.

## O que não entrou

Nenhum domínio operacional novo foi criado no Prisma. A home pública não foi alterada. APIMG e Google Calendar continuam sem uso.
