# Auditoria da visão Direção (pós Sprint 10.1)

Escopo: perfil fictício Direção em `/demonstracao`. Não é RBAC de `/sistema`. Auditoria feita depois do hotfix de estabilidade do dataset.

## Matriz

| Requisito do cliente | Estado | Observação | Correção recomendada |
| --- | --- | --- | --- |
| Dashboard operacional: o que precisa de atenção agora | Implementado | Cartões de hoje, semana, OS, propostas, certificados, contratos e atraso | Manter. Só ajustar rótulos se a reunião pedir |
| Dashboard executivo consolidado (financeiro + contratos + produtividade) | Implementado | Resumo com receitas do período, valores vencidos, contratos a vencer e certificados pendentes. Sem margem inventada | Manter e validar rótulos com o cliente |
| Indicadores coerentes com a massa | Implementado | `buildDashboardMetrics` deriva da fixture | Manter |
| Próximas ações | Implementado | Lista dinâmica a partir de alertas + atalhos do roteiro Hotel Amazonas | Validar prioridades na reunião |
| Alertas | Implementado | Inclui certificado, ASO, proposta, formalização e processo ambiental | Validar ordem e teto de 24 itens com o cliente |
| Contratos | Implementado | Lista e detalhe com vigência e recorrência | Manter |
| Propostas e formalização 10.1 | Implementado | OCS-DEMO-014 e blocos por família | Manter |
| OS e execução por família | Implementado | RSV, CIP, coleta, ETE, monitoramento | Manter |
| Certificados / atestados por tipo | Implementado | Reservatório, poço, pragas, resíduos | Manter |
| Financeiro gerencial | Implementado | Parcelas e renegociação fictícia | Manter |
| Histórico do cliente | Implementado | Linha do Hotel Amazonas enriquecida na 10.1 | Manter |
| Documentos pré-serviço na jornada | Implementado | Rota na OS | Manter |
| Visão Direção limitada aos módulos do perfil | Ausente | O sidebar mostra todo o Fluxo/Apoio para Direção e Compliance. O perfil só muda o rótulo da sessão | Não filtrar a sidebar ainda: a demonstração serve para validar o produto completo. Se o cliente pedir, filtrar só visualmente |
| Diferenciar papel Direção de Compliance na home da demo | Implementado | Mensagem contextual na visão geral; sidebar permanece completa | Confirmar se basta para a apresentação |
| Processos ambientais | Implementado | Em Apoio, marcado DEMO | Confirmar se “Processos” é outorga |
| Catálogo ETE / retrolavagem / coleta no site público | Ausente de propósito | Só na demo | Não levar para a Home até validação |

## Lacunas prioritárias da visão executiva

Atualizado na DEMO-02: resumo executivo, ações dinâmicas, formalização e recorrências já aparecem na visão geral. Restam só ajustes de cópia e prioridade após a reunião com o cliente.

## Fora desta proposta

- Autenticação RBAC real na demonstração.
- Alterar os quatro papéis de `/sistema`.
- Novos modelos Prisma.
- Implementação de clientes reais.
