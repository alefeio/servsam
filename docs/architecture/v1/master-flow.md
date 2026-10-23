# Fluxo mestre da V1

**Data:** 22/10/2026.

```text
CLIENTE
  → PROPOSTA
  → APROVAÇÃO
  → AGENDAMENTO
  → ORDEM DE SERVIÇO
  → EXECUÇÃO
  → RELATÓRIO TÉCNICO / FOTOGRÁFICO
  → CERTIFICADO / ATESTADO
  → FINANCEIRO
  → HISTÓRICO DO CLIENTE
```

Este é o caminho oficial de um serviço avulso. Cada seta é um vínculo persistido, não uma convenção de nomenclatura.

## Passos

| Passo | Entidade | O que fica registrado |
| --- | --- | --- |
| Cliente | `Customer` | Quem contrata, contatos e unidades |
| Proposta | `Proposal` + `ProposalItem` | Escopo, preço, validade e serviço |
| Aprovação | estado `accepted` da proposta | Aceite que autoriza agendar |
| Agendamento | `Schedule` | Data, equipe, veículo e tipo de serviço |
| Ordem de serviço | `ServiceOrder` | Contrato operacional do atendimento |
| Execução | `ServiceExecution` | O que foi feito em campo, visto pela gestão |
| Relatório | `TechnicalReport` + fotos | Condição antes/depois, NR quando couber, PDF |
| Certificado | `Certificate` | Atestado numerado, produtos, validade, PDF |
| Financeiro | `FinancialEntry` + parcelas + pagamentos | Quanto cobrar, quando vence, o que foi pago |
| Histórico | leitura a partir do cliente | A cadeia acima, mais contratos e documentos |

O histórico não é uma tabela paralela de texto. É a consulta do cliente atravessando os vínculos.

## Aprovação

No fluxo mestre, **aprovação é o aceite do cliente sobre a proposta**. Esse aceite é o que libera agendamento e OS.

Hipótese da Sprint 10.1, ainda sem decisão: os documentos operacionais recebidos sugerem um passo de formalização (proposta assinada, OS do cliente, ordem de compra ou ordem de compra de serviço) entre o aceite e a agenda. A demonstração mostra esse passo para a reunião. Não substitui a regra acima até o cliente confirmar.

Não está definido um fluxo interno de alçada (quem na SERVSAM pode enviar ou aceitar em nome do cliente). A matriz RBAC reserva permissões distintas para redigir, enviar e registrar o aceite. A regra de alçada continua pendente. Ver [documentation-audit.md](./documentation-audit.md).

Proposta aceita deve ser tratada como imutável na V1. Correção de escopo gera nova proposta, ligada à anterior. O demo ainda edita status no `localStorage` e não tem versão. Isso não muda agora.

## O que pode pular um passo

| Situação | Caminho | Regra |
| --- | --- | --- |
| Contrato recorrente já vigente | Contrato → agenda → OS → execução → relatório → certificado → financeiro | Não exige proposta nova a cada visita. A proposta ou a licitação de origem fica no contrato quando existir |
| Visita já combinada sem proposta formal | Não é caminho da V1 | OS sem proposta só se o papel tiver permissão explícita. O caso padrão continua passando por proposta aceita |
| Serviço sem certificado | OS → relatório → financeiro | Certificado é obrigatório só quando o tipo de serviço exigir. A lista desses tipos ainda não foi fechada |
| Serviço sem produto químico | Relatório sem princípio ativo | Campos regulatórios ficam vazios com motivo, não com dado inventado |

## Vias que não são o eixo

Estas vias continuam no produto, com prioridade menor que o fluxo mestre:

- **Lead → oportunidade → proposta.** Origem comercial. Uma proposta da V1 também pode nascer direto no cliente, sem lead.
- **Licitação → proposta ou contrato.** Módulo próprio, Sprint 19. Não substitui a OS quando o órgão vira cliente atendido.
- **Documento e licença.** Condicionam certificado e alerta. Não são um passo do fluxo de cada visita.
- **Alerta.** Observa vencimentos ao longo de toda a cadeia. Não é uma etapa que o usuário "conclui" para avançar o serviço.

## Rastreabilidade mínima

A partir de qualquer um destes registros, a V1 deve alcançar os outros quando o vínculo existir:

`Proposal` · `Schedule` · `ServiceOrder` · `ServiceExecution` · `TechnicalReport` · `Certificate` · `FinancialEntry`

E, a partir de qualquer um deles, o `Customer`.

Implementação dessa navegação começa nas sprints de cada entidade, não na Sprint 8.
