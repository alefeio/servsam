# Relacionamentos da V1

**Data:** 22/10/2026. Atualizado na Sprint 9.

Os relacionamentos de acesso (`Organization`, `User`, `Role`, `Permission`) existem no schema, com tabelas explícitas `UserRole` e `RolePermission`. Better Auth acrescentou `Session`, `Account` e `Verification`. O restante deste arquivo continua conceitual e sem tabela.

Notação: `1` um, `N` muitos, `0..1` opcional.

## Acesso

- `Organization` 1—N `User`
- `Organization` 1—N `Role`
- `User` N—N `Role`
- `Role` N—N `Permission`
- `User` 0..1—0..1 `Employee` (quem opera pode não ter login; quem administra pode não ir a campo)

Permissão efetiva do usuário é a união dos papéis. Não há negação explícita na V1. "Gerência sem financeiro" é a ausência das permissões financeiras, não um bloqueio especial.

## Cliente no centro do relacionamento

- `Customer` N—1 `Organization`
- `Customer` 1—N `CustomerContact`
- `Customer` 1—N `CustomerUnit`
- `Customer` 1—N `Proposal`
- `Customer` 1—N `Contract`
- `Customer` 1—N `ServiceOrder`
- `Customer` 1—N `Certificate`
- `Customer` 1—N `FinancialEntry`
- `Customer` 1—N `Document` (peças daquele cliente; licença da SERVSAM aponta para a organização, não para o cliente)

`Lead` 0..1—1 `Customer` quando convertido. `Opportunity` N—1 `Customer` ou, antes da conversão, fica só no lead. Nenhum dos dois é obrigatório para existir proposta.

## Do comercial à OS

- `Opportunity` 1—N `Proposal` (opcional na origem)
- `Proposal` 1—N `ProposalItem`
- `Proposal` N—1 `ServiceType` no cabeçalho ou por item. Itens podem misturar serviços; o demo hoje não tem `ServiceType`
- `Proposal` 0..1—N `Proposal` sucessora, quando uma aceita precisar ser substituída
- `Contract` 0..1—1 `Proposal` de origem
- `Contract` 0..1—1 licitação de origem
- `Schedule` N—1 `Customer`
- `Schedule` N—0..1 `CustomerUnit`
- `Schedule` N—1 `ServiceType`
- `Schedule` N—0..1 `Proposal` aceita
- `Schedule` N—0..1 `Contract`
- `Schedule` N—N `Employee` (equipe prevista)
- `Schedule` N—0..1 `Vehicle`
- `ServiceOrder` 1—0..1 `Schedule` (a visita que a originou)
- `ServiceOrder` N—1 `Customer`
- `ServiceOrder` N—0..1 `CustomerUnit`
- `ServiceOrder` N—0..1 `Proposal`
- `ServiceOrder` N—0..1 `Contract`
- `ServiceOrder` N—1 `ServiceType`
- `ServiceOrder` 1—1 `ServiceExecution` na V1 (uma execução principal). Mais de uma execução por OS fica para depois, se houver retorno no mesmo número
- `ServiceOrder` 1—N `ServiceOrderTeam`
- `ServiceOrderTeam` N—1 `Employee`
- `ServiceOrder` 1—N `ServiceOrderProduct`
- `ServiceOrderProduct` N—1 `Product`
- `ServiceOrderProduct` N—0..1 `ProductBatch`
- `ServiceOrder` N—0..1 `Vehicle`

## Evidência

- `TechnicalReport` N—1 `ServiceOrder` (a V1 parte de um relatório principal por OS)
- `TechnicalReport` 1—N `TechnicalReportPhoto`
- `Certificate` N—1 `Customer`
- `Certificate` N—1 `ServiceOrder`
- `Certificate` N—0..1 `TechnicalReport`
- `Certificate` N—1 `Employee` na função de responsável técnico
- `Certificate` N—N `Product` / lote aplicado, via as linhas da OS, para princípio ativo, grupo químico e registro
- `Certificate` N—N `Document` do tipo licença da organização, citadas no PDF
- `DocumentTemplate` 1—N documentos gerados (relatório ou certificado)

## Estoque e pessoas

- `Product` 1—N `ProductBatch`
- `Product` N—1 `UnitOfMeasure`
- `ProductBatch` 1—N `StockMovement`
- `StockMovement` N—0..1 `ServiceOrder` quando a saída decorre de atendimento
- `Employee` 1—N `EmployeeDocument`
- `Employee` 1—N `EmployeeTraining`
- `Vehicle` não possui ordem de manutenção nesta versão

## Financeiro

- `FinancialEntry` N—1 `Customer` quando for conta a receber
- `FinancialEntry` N—0..1 `Contract`
- `FinancialEntry` N—0..1 `ServiceOrder`
- `FinancialEntry` N—0..1 `Proposal`
- `FinancialEntry` N—0..1 licitação
- `FinancialEntry` 1—N `Installment`
- `Installment` 1—N `Payment`

Despesa básica pode existir sem cliente. Receita sem cliente não é o caso padrão.

## Alertas e auditoria

- `Alert` N—1 registro de origem, por tipo e id. Não copia o vencimento para uma segunda fonte da verdade
- `AuditLog` N—0..1 `User` ator. Ação de sistema usa ator vazio e origem identificada

Quem vê o alerta é quem tem permissão de leitura do domínio de origem. Diretoria vê todos porque tem todas as permissões, não porque o alerta tenha um atalho.

## Integridade que a produção deve garantir

1. OS operacional padrão referencia proposta `accepted` ou contrato vigente.
2. Certificado emitido referencia OS e cliente, e não leva produto sem registro quando o serviço for químico. A lista de serviços químicos está pendente.
3. Movimento de saída de lote não deixa o lote negativo.
4. Número de certificado não se reutiliza dentro da organização, inclusive após revogação.
5. Pagamento não excede o saldo da parcela sem uma renegociação registrada.
