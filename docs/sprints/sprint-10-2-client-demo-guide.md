# Roteiro da reunião — Hotfix demo 10.2 / DEMO-HF.1

Objetivo: percorrer três jornadas alinhadas ao feedback de 19/11/2026, sem as hipóteses superadas (sinal obrigatório, comercial confirma pagamento, O.C. só em periódico, O.C. = OS, agenda sem remarcação). Tudo continua **demonstrativo** (fixtures + `localStorage`).

**Branch vigente:** `fix/demo-hf-1-financial-oc-consistency` (sobre `hotfix/demo-10-2-signal-oc`)  
**Não** usar Production nem `/sistema` nesta reunião.

## Preparação

1. Abrir o Preview desta branch (protegido).
2. Entrar em `/demonstracao` com um perfil de gestão.
3. **Restaurar dados demonstrativos** (botão no header) se a massa local estiver misturada.
4. Confirmar que a sessão é só da demo — não há vínculo com PostgreSQL/HOMOL.

## Cenário A — Serviço avulso (sem sinal obrigatório)

1. Comercial → Orçamentos → **DEMO-001** (aceito, sem sinal).
2. Destacar: aceite libera contratação; botão **Emitir OS** habilitado sem confirmação financeira.
3. Emitir OS → abrir a OS → agendar data/hora (ou ir à Agenda).
4. Recarregar a ficha: a OS permanece (localStorage); não há segundo botão Emitir.
5. Opcional: em DEMO-002 / DEMO-006, **Comercial: solicitar ao Financeiro** com valor informado ou exemplo da fixture (`demoSignalExampleAmount`) — **não** há percentual padrão de 50%. Financeiro confirma depois.
6. Hotel Amazonas (**DEMO-005**): jornada técnica preservada; O.C. avulsa aponta para a **mesma** `os-demo-04`.

## Cenário B — O.C. do cliente (sem orçamento interno obrigatório)

1. Comercial → **O.C. recebidas**.
2. Abrir **OC-DEMO-DIR-021** (escola / sanitização emergencial).
3. Destacar: documento do contratante; `Sem orçamento interno prévio obrigatório`.
4. **Emitir OS a partir da O.C.** → na OS, agendar → **remarcar** data/hora → ver histórico.
5. Recarregar: remarcação e histórico persistem.
6. Reforçar: Orçamento SERVSAM ≠ O.C. ≠ OS.

## Cenário C — Contrato periódico + Hotel

1. Contratos → **CT-DEMO-001** → **O.C. recebida no contrato** (OC-DEMO-CT-001).
2. DEMO-005 + O.C. avulsa **OC-DEMO-AVL-014**: mesma execução que **os-demo-04** (não duplicar).
3. Abrir execução, relatório fotográfico e certificado do Hotel.
4. **Não afirmar** que cada visita física exige OS separada (pendente de validação).

## Agenda

1. Visões Diária / Semanal / Mensal.
2. Agendar OS emitidas; **Remarcar** OS já agendadas; ver responsável e histórico.
3. Conflito de equipe: alerta informativo, sem bloqueio automático definitivo.
4. Sem Google Calendar; sem drag-and-drop obrigatório.

## Financeiro, RH e execução

- Financeiro: lançamentos demonstrativos; valor orçado / solicitado (explícito ou exemplo de fixture) / recebido; **sem** integração bancária e **sem** 50% implícito.
- RH: férias, faltas, atestados, advertências, suspensões, ocorrências fictícias.
- Execução: checklists, relatórios, fotos, certificados do Hotel Amazonas.

## Restaurar massa antes da reunião

1. Botão **Restaurar dados demonstrativos** no header da demo.
2. Ou no DevTools: remover `servsam.demo.dataset` e recarregar.
3. Não misturar com cookies/sessão de `/sistema`.

## Pendências que ainda dependem do cliente

- Se cada visita física distinta exige OS separada.
- Política fina de bloqueio por conflito de agenda.
- Percentuais / formas de pagamento reais (não inventar na demo).

## Fora do roteiro

Prisma, HOMOL, 11B, NF-e, Google Calendar, merge em `main`, Production.
