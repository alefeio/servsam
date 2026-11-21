# Roteiro da reunião — Hotfix demo 10.2 (sinal / O.C. / agenda)

Objetivo: percorrer três jornadas alinhadas ao feedback de 19/11/2026, sem as hipóteses superadas (sinal obrigatório, comercial confirma pagamento, O.C. só em periódico, O.C. = OS, agenda sem remarcação). Tudo continua **demonstrativo** (fixtures + `localStorage`).

**Branch:** `hotfix/demo-10-2-signal-oc`  
**Não** usar Production nem `/sistema` nesta reunião.

## Preparação

1. Abrir o Preview desta branch (protegido).
2. Entrar em `/demonstracao` com um perfil de gestão.
3. **Restaurar dados demonstrativos** em Configurações (ou limpar a chave do demo no `localStorage`) se a massa local estiver misturada com testes anteriores.
4. Confirmar que a sessão é só da demo — não há vínculo com PostgreSQL/HOMOL.

## Cenário A — Serviço avulso (sem sinal obrigatório)

1. Comercial → Orçamentos → **DEMO-001** (aceito, sem sinal).
2. Destacar: aceite libera contratação; botão **Emitir OS** habilitado sem confirmação financeira.
3. Emitir OS → abrir a OS → agendar data/hora (ou ir à Agenda).
4. Opcional: em DEMO-002, mostrar **Comercial: solicitar ao Financeiro** e **Financeiro: confirmar recebimento** como eventos separados — sem confundir solicitação com confirmação.
5. Hotel Amazonas (**DEMO-005**): preservar jornada técnica (formalização, O.C. avulsa, execução, fotos, certificado).

## Cenário B — O.C. do cliente (sem orçamento interno obrigatório)

1. Comercial → **O.C. recebidas**.
2. Abrir **OC-DEMO-DIR-021** (escola / sanitização emergencial).
3. Destacar: documento do contratante; `Sem orçamento interno prévio obrigatório`.
4. **Emitir OS a partir da O.C.** → Agenda → agendar.
5. Reforçar: Orçamento SERVSAM ≠ O.C. ≠ OS.

## Cenário C — Contrato periódico + O.C.

1. Contratos → **CT-DEMO-001**.
2. Mostrar **O.C. recebida no contrato** e cronograma de visitas.
3. Explicar que a programação periódica existe; **não afirmar** que cada visita física exige OS separada (pendente de validação).
4. Opcional: listar a mesma O.C. em Comercial → O.C. recebidas.

## Agenda

1. Visões Diária / Semanal / Mensal.
2. Agendar OS emitidas; **Remarcar** OS já agendadas; ver responsável e histórico.
3. Conflito de equipe: alerta informativo, sem bloqueio automático definitivo.
4. Sem Google Calendar; sem drag-and-drop obrigatório.

## Financeiro, RH e execução

- Financeiro: lançamentos demonstrativos; distinguir valor orçado / solicitado / recebido; **sem** integração bancária.
- RH: férias, faltas, atestados, advertências, suspensões, ocorrências fictícias.
- Execução: checklists, relatórios, fotos, certificados do Hotel Amazonas — já nas sprints anteriores.

## Restaurar massa antes da reunião

1. Em `/demonstracao/.../configuracoes` (ou equivalente), usar **Restaurar dados demonstrativos**.
2. Ou no DevTools: remover a chave do dataset demo no `localStorage` e recarregar.
3. Não misturar com cookies/sessão de `/sistema`.

## Pendências que ainda dependem do cliente

- Se cada visita física distinta exige OS separada.
- Política fina de bloqueio por conflito de agenda.
- Percentuais / formas de pagamento reais (não inventar na demo).

## Fora do roteiro

Prisma, HOMOL, 11B, NF-e, Google Calendar, merge em `main`, Production.
