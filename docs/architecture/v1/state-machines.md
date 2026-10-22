# Estados da V1

**Data:** 22/10/2026.

Estados abaixo são o alvo da produção. O demo não será migrado nesta sprint. Onde o demo diverge, a nota diz isso.

`overdue` deixa de ser status armazenado. Atraso de agenda, OS, parcela, documento ou lote vira `Alert` calculado na data. Isso evita dois estados verdadeiros ao mesmo tempo (concluída e atrasada).

## Proposal

O demo já usa estes cinco status. A V1 mantém o vocabulário e acrescenta a regra de transição.

| Estado | Significado |
| --- | --- |
| `draft` | Em elaboração. Não autoriza agenda |
| `sent` | Enviada ao cliente. Aguarda aprovação |
| `accepted` | Aprovação do cliente. Autoriza agendamento e OS |
| `rejected` | Recusada |
| `expired` | Validade estourou sem aceite |

Transições:

- `draft` → `sent` ou cancelamento lógico (não há status `cancelled` no demo; cancelar rascunho pode arquivar como `rejected` só se o motivo ficar explícito. Preferência da V1: não reutilizar `rejected` para desistência interna. Pendência menor, sem novo status até o cliente confirmar).
- `sent` → `accepted`, `rejected` ou `expired`.
- `accepted` não volta. Ajuste gera outra proposta.
- `expired` pode originar nova proposta. A antiga permanece expirada.

`accepted` é o passo "Aprovação" do fluxo mestre.

## Schedule

Não existe como entidade no demo. Estados propostos:

| Estado | Significado |
| --- | --- |
| `draft` | Horário ainda interno |
| `confirmed` | Data, equipe e veículo definidos. Pode gerar ou já ter OS |
| `fulfilled` | A OS vinculada entrou em execução ou foi concluída |
| `cancelled` | Não acontecerá |

Reagendar não é estado. Mudar data de um `confirmed` permanece `confirmed` e grava `AuditLog`.

Não há status `rescheduled`.

## ServiceOrder

Demo hoje: `scheduled`, `in_progress`, `completed`, `overdue`, `cancelled`.

V1:

| Estado | Significado | Demo |
| --- | --- | --- |
| `scheduled` | Agendada, execução não iniciada | igual |
| `in_progress` | Execução aberta | igual |
| `completed` | Serviço encerrado pela gestão | igual |
| `cancelled` | Não será feita | igual |
| — | atraso | deixa de ser `overdue`; vira alerta |

Transições: `scheduled` → `in_progress` → `completed`. `scheduled` ou `in_progress` → `cancelled`. `completed` não reabre; retorno é outra OS ligada à anterior.

OS `completed` sem relatório, quando o tipo de serviço exigir relatório, gera alerta. Não impede o status `completed`, para não prender a operação numa tela que a Sprint 13 ainda não terá se a 15 atrasar. O alerta cobre o buraco.

## Execution

Entidade nova. Uma principal por OS.

| Estado | Significado |
| --- | --- |
| `pending` | OS agendada, execução não iniciada |
| `in_progress` | Em andamento |
| `completed` | Execução encerrada |
| `aborted` | Interrompida, com motivo |

O status da OS e o da execução andam juntos na V1: abrir execução põe a OS em `in_progress`; concluir execução permite concluir a OS. Abortar execução não conclui a OS; a OS vai para `cancelled` ou volta para `scheduled` conforme o motivo. A escolha do motivo padrão está pendente.

Não há estado `paused`.

## Certificate

| Estado | Significado |
| --- | --- |
| `draft` | Montado, sem número definitivo |
| `issued` | Numerado e PDF gerado |
| `revoked` | Anulado. O número não volta para a fila |

Validade vencida não é status. Certificado `issued` com data de validade ultrapassada dispara `Alert`. O documento histórico continua `issued`.

Emissão exige OS, cliente, tipo, serviço, data e responsável técnico. Produtos e registros entram quando o serviço usar produto regulado.

## FinancialEntry

O demo não tem estes estados. Ele tem tipo (`revenue`, `receivable`, `expense`) e um `paidAt` opcional.

Tipo na V1, separado do estado:

- `receivable` — conta a receber;
- `expense` — despesa básica.

Receita recebida é receivable quitado, não um terceiro tipo. O tipo `revenue` do demo será mapeado na Sprint 17 para receivable já pago ou em aberto, conforme `paidAt`. Esse mapeamento é especificação; o fixture não muda agora.

| Estado | Significado |
| --- | --- |
| `draft` | Previsto, ainda não cobrável |
| `open` | Em aberto, sem pagamento |
| `partial` | Pago em parte |
| `settled` | Quitado |
| `cancelled` | Cancelado sem efeito financeiro |

Estado do lançamento deriva das parcelas e dos pagamentos. Não se edita "na mão" para `settled`.

Atraso da parcela é alerta, não estado `overdue`.

Renegociação substitui parcelas `open` por novas parcelas e registra o evento. O lançamento continua `open` ou `partial`. Não há estado `renegotiated`.

## O que estes estados não cobrem

Lead (`new`, `qualified`, `converted`, `discarded`) e oportunidade (`lead` até `closed_won` / `closed_lost`) permanecem como estão no demo. Não entram no núcleo da V1.

Contrato no demo: `active`, `expiring`, `expired`. Na V1, `expiring` também passa a ser alerta sobre contrato `active`. Mudança de status do contrato fica para a Sprint 17, para não contradizer o demo antes da hora.
