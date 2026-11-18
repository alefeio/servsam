# Roteiro da reunião — Sprint 10.2

Objetivo: validar o fluxo comercial com Orçamento como ponto de partida, o sinal antes da OS, a agenda em calendário, a O.C. nos contratos periódicos e o RH ampliado. Tudo continua demonstrativo.

## Preparação

1. Abrir o Preview da Sprint 10.2 (não a produção).
2. Entrar em `/demonstracao` com um perfil de gestão.
3. Se a massa local estiver confusa, restaurar os dados demonstrativos nas configurações.

## Roteiro principal (serviço avulso)

1. Dashboard / Comercial: mostrar indicadores de orçamentos (emitidos, aceitos, convertidos, taxa, valores em negociação).
2. Abrir um Orçamento (rota ainda `/comercial/propostas/...`). Destacar que a UI diz Orçamento.
3. Aceite do orçamento.
4. Registrar o sinal (demonstrativo, sem cobrança real).
5. Emitir a OS — só liberada com aceite + sinal confirmado.
6. Conferir que a OS nasce sem data automática.
7. Ir à Agenda (visão calendário) e agendar a OS.
8. Seguir execução e entregáveis do Hotel Amazonas, se já estiverem na jornada.

## Roteiro paralelo (contrato periódico)

1. Abrir um contrato periódico com O.C. vinculada.
2. Mostrar visitas/agenda já previstas.
3. Explicar que a O.C. do contrato não se confunde com a OCS de formalização do orçamento avulso.
4. Perguntar: cada visita deve gerar OS individual?

## RH

1. Abrir Colaboradores e o detalhe de um colaborador fictício.
2. Mostrar férias, faltas, atestados, advertências, suspensões e ocorrências.
3. Reforçar: dados fictícios; sem informação clínica sensível.

## Perguntas a confirmar

Ver itens novos em `docs/content/pending-client-validation.md` (a partir do item 67).

## Fora do roteiro

Financeiro completo, Prisma, Google Calendar real, merge em produção.
