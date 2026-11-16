# Auditoria da visão Direção (pós Sprint 10.1)

Escopo: perfil fictício Direção em `/demonstracao`. Não é RBAC de `/sistema`. Auditoria feita depois do hotfix de estabilidade do dataset.

## Matriz

| Requisito do cliente | Estado | Observação | Correção recomendada |
| --- | --- | --- | --- |
| Dashboard operacional: o que precisa de atenção agora | Implementado | Cartões de hoje, semana, OS, propostas, certificados, contratos e atraso | Manter. Só ajustar rótulos se a reunião pedir |
| Dashboard executivo consolidado (financeiro + contratos + produtividade) | Parcial | Existe financeiro e contratos em módulos separados; a visão geral não resume margem, inadimplência por cliente nem ranking | Acrescentar um bloco executivo derivado das métricas já existentes, sem novo domínio |
| Indicadores coerentes com a massa | Implementado | `buildDashboardMetrics` deriva da fixture | Manter |
| Próximas ações | Parcial | Lista fixa `NEXT_ACTIONS` no JSX, alinhada ao Hotel Amazonas, mas não reage a alertas novos (formalização, processo ambiental, pré-serviço) | Substituir a lista estática por atalhos derivados de `metrics.alerts` + 2 a 3 atalhos fixos da narrativa |
| Alertas | Implementado | Inclui certificado, ASO, proposta, formalização e processo ambiental | Validar ordem e teto de 24 itens com o cliente |
| Contratos | Implementado | Lista e detalhe com vigência e recorrência | Manter |
| Propostas e formalização 10.1 | Implementado | OCS-DEMO-014 e blocos por família | Manter |
| OS e execução por família | Implementado | RSV, CIP, coleta, ETE, monitoramento | Manter |
| Certificados / atestados por tipo | Implementado | Reservatório, poço, pragas, resíduos | Manter |
| Financeiro gerencial | Implementado | Parcelas e renegociação fictícia | Manter |
| Histórico do cliente | Implementado | Linha do Hotel Amazonas enriquecida na 10.1 | Manter |
| Documentos pré-serviço na jornada | Implementado | Rota na OS | Manter |
| Visão Direção limitada aos módulos do perfil | Ausente | O sidebar mostra todo o Fluxo/Apoio para Direção e Compliance. O perfil só muda o rótulo da sessão | Não filtrar a sidebar ainda: a demonstração serve para validar o produto completo. Se o cliente pedir, filtrar só visualmente |
| Diferenciar papel Direção de Compliance na home da demo | Parcial | Só o texto “Perfil demo: …” muda | Opcional: destaque na visão geral (“Prioridades da Direção”) sem RBAC real |
| Processos ambientais | Implementado | Em Apoio, marcado DEMO | Confirmar se “Processos” é outorga |
| Catálogo ETE / retrolavagem / coleta no site público | Ausente de propósito | Só na demo | Não levar para a Home até validação |

## Lacunas prioritárias da visão executiva

1. Trocar `NEXT_ACTIONS` estático por ações derivadas dos alertas e da narrativa Hotel Amazonas.
2. Acrescentar um resumo executivo curto: faturamento do período, atraso, contratos a vencer e certificados pendentes — tudo já calculável.
3. Deixar explícito na visão geral o passo de formalização e a próxima visita recorrente.

## Fora desta proposta

- Autenticação RBAC real na demonstração.
- Alterar os quatro papéis de `/sistema`.
- Novos modelos Prisma.
- Implementação de clientes reais.
