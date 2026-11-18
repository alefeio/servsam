# Relatório da Sprint 10.2

Adequação de `/demonstracao` ao fluxo Orçamento → Aceite → Sinal → OS → Agendamento → Execução → Entregáveis, com O.C. em contratos periódicos e RH estruturado. Sem Prisma e sem merge em `main`.

## Funcionalidades reaproveitadas

- Massa e jornadas Hotel Amazonas (Sprints 10 e 10.1), inclusive formalização OCS, visitas, pré-serviço e entregáveis.
- Entidade `DemoProposal` e rotas `/comercial/propostas` (UI renomeada para Orçamento).
- Contratos periódicos, visitas e OS existentes.
- Cadastro de Colaboradores com ASO/NR/EPI.
- `hydrateDemoDataset` / correção React #185 / menu mobile responsivo.
- Financeiro gerencial atual (só o mínimo do sinal foi acrescentado).

## Alterações implementadas

- Nomenclatura **Orçamento** na navegação, hub, listas, detalhe e dashboard.
- Indicadores derivados: emitidos, aceitos, convertidos em OS, taxa de conversão e valor em negociação.
- Registro/confirmação demonstrativa do sinal; emissão de OS só com aceite + sinal confirmado.
- OS emitida sem data automática; agendamento em passo separado (`scheduleWorkOrder`).
- Agenda em grade estilo calendário (dia/semana/mês) com painel de OS aguardando agendamento.
- O.C. vinculada a contratos periódicos (`purchaseOrder`), distinta da OCS de formalização.
- RH estruturado: férias, faltas, atestados, advertências, suspensões e ocorrências (fictícios, sem dados clínicos).
- Hydrate compatível com massa antiga no navegador (sinal, O.C., `hrRecords`).

## Testes

- `npm run lint`: ok (sem erros)
- `npm run typecheck`: ok
- `npm test`: 21 arquivos / 91 testes ok
- `npm run test:e2e`: 14 testes ok (desktop + mobile)
- `npm run build`: ok

## Commit e Preview

- Branch: `sprint-10-2-demo-adequacao`
- Commit: `40f3abacf485c730e0ce3dc605d8f34a52dce60e`
- URL Preview: https://servsam-2edd8j89f-alefeios-projects.vercel.app
- Inspector: https://vercel.com/alefeios-projects/servsam/FQ6WU7KuVeWysqZUxnej6st1qZV8
- Ambiente: Preview (sem promote para produção). Pode exigir autenticação Vercel (Deployment Protection).
- Merge em `main`: **não realizado**

## Pontos ainda sujeitos à validação do cliente

- Exceções à exigência do sinal antes da OS (itens 67–68).
- Emissão de OS individual por visita de contrato/O.C. (itens 69–70).
- Adequação dos indicadores de conversão à gestão (item 71).
- Profundidade de RH na V1 (item 72).
- Tratamento financeiro definitivo do sinal (item 73).
- Escopo completo do Financeiro (aguarda próxima orientação).
