# Modelo conceitual da V1

**Data:** 22/10/2026.  
Nomes em inglês porque o código segue esse idioma. Rótulos de interface continuam em português. `Organization`, `User`, `Role`, `Permission` e `AuditLog` já estão em `prisma/schema.prisma`, junto com `Session`, `Account` e `Verification`. As entidades das seções seguintes ainda não têm tabela.

Cardinalidade e navegação estão em [relationships.md](./relationships.md). Estados, em [state-machines.md](./state-machines.md).

## Como ler

- **Demo:** o que já existe em `src/types/demo-entities.ts` ou ao lado.
- **V1:** entidade de produção. Pode não ter tela ainda.
- Onde o demo guarda um campo no lugar errado, a tabela diz "migrar na sprint", sem alterar o fixture agora.

## Acesso e tenância

| Entidade | Papel | Demo | Sprint |
| --- | --- | --- | --- |
| `Organization` | Raiz. Na V1 há uma só: a SERVSAM. Segura licenças, usuários e o responsável técnico padrão | Não existe | 9 |
| `User` | Pessoa que autentica | Sessão demo com e-mail fictício | 9 |
| `Role` | Papel nomeado e editável | Dois rótulos fixos: Direção e Compliance. Não reutilizar como papéis da V1 | 9 |
| `Permission` | Chave estável pontilhada (`service_order.view`) | Não existe. O demo não bloqueia módulo | 9 |

## Relacionamento com o cliente

| Entidade | Papel | Demo | Sprint |
| --- | --- | --- | --- |
| `Customer` | Agregador de relacionamento | `DemoClient` (alias, segmento, cidade) | 10 |
| `CustomerContact` | Pessoa de contato do cliente | Só `contactName` dentro do lead | 10 |
| `CustomerUnit` | Unidade / local de atendimento | `DemoClientUnit` | 10 |
| `Lead` | Interesse ainda sem cliente fechado | `DemoLead` | demo; produção V1.1 |
| `Opportunity` | Negociação comercial | `DemoOpportunity` | demo; produção V1.1 |
| `Proposal` | Oferta que, aceita, autoriza o serviço | `DemoProposal` | 11 |
| `ProposalItem` | Linha de escopo e preço | `DemoProposalItem` | 11 |
| `Contract` | Vigência recorrente, periodicidade, reajuste | `DemoContract` | 17 |

## Operação

| Entidade | Papel | Demo | Sprint |
| --- | --- | --- | --- |
| `ServiceType` | Catálogo do que a SERVSAM executa | `serviceName` livre e `categoryId` com dois valores | 11 |
| `Schedule` | Compromisso na agenda SERVSAM | Data `scheduledAt` dentro da OS; agenda é uma visão, não uma entidade | 12 |
| `ServiceOrder` | Agregador da operação | `DemoWorkOrder` | 13 |
| `ServiceExecution` | Registro da execução, separado do cabeçalho da OS | Status da própria OS | 13 |
| `ServiceOrderProduct` | Produto previsto ou aplicado, com quantidade e lote quando houver | `plannedMaterials[]` | 13–14 |
| `ServiceOrderTeam` | Colaborador escalado e função naquela OS | `technicianAlias` e `teamAliases[]` | 12–13 |
| `Employee` | Colaborador operacional | Não existe | 12 |
| `EmployeeDocument` | ASO, NR, EPI e outros documentos do colaborador | Não existe | 12 o mínimo para alertar; V1.1 o dossiê |
| `EmployeeTraining` | Treinamento com validade | Não existe | 12 / V1.1 |
| `Vehicle` | Veículo escalável na agenda e na OS | Não existe. Exemplos citados no briefing da Sprint 8: F1, F2, F3, Saveiro, Kombi. São exemplos, não cadastro verificado | 12 |

## Evidência e conformidade do serviço

| Entidade | Papel | Demo | Sprint |
| --- | --- | --- | --- |
| `TechnicalReport` | Relatório técnico da OS | Não existe | 15 |
| `TechnicalReportPhoto` | Foto do relatório, com ordem | Não existe | 15 |
| `Certificate` | Certificado ou atestado emitido | Não existe | 16 |
| `Document` | Arquivo de compliance, licença ou peça do cliente, com validade | `DemoDocument` | 16 para licenças da organização; 18 para a gestão de alertas |
| `DocumentTemplate` | Modelo de PDF (relatório e certificado SERVSAM) | Exportação gera `.demo.txt` | 15–16 |

### Relatório técnico

Campos de produção, ainda sem tela:

- OS obrigatória;
- descrição técnica;
- condição antes;
- condição depois;
- observações;
- indicação de NR-33 e NR-35 quando o serviço exigir;
- fotos;
- no máximo 6 fotos por página do PDF;
- assinaturas;
- PDF no modelo SERVSAM.

O número total de fotos do relatório não foi limitado. O seis é regra de diagramação da página. O arquivo do modelo oficial ainda não está no repositório.

### Certificado

Campos de produção, ainda sem tela:

- cliente e OS;
- numeração automática;
- tipo, serviço, data e validade;
- produtos, princípio ativo, grupo químico e registro MS/ANVISA;
- licenças da SERVSAM;
- responsável técnico;
- PDF no layout oficial.

O formato do número (prefixo, ano, sequência) não foi definido. Fica como sequência por organização, única, atribuída só na emissão.

## Almoxarifado

| Entidade | Papel | Demo | Sprint |
| --- | --- | --- | --- |
| `Product` | Nome comercial, princípio ativo, grupo químico, fabricante, registro MS/ANVISA, antídoto/tratamento, ficha técnica, FISPQ | `DemoProduct`: nome, categoria, unidade texto, saldo, mínimo, validade e lote opcionais no próprio registro | 14 |
| `ProductBatch` | Lote, validade e saldo daquele lote | `lotCode` e `expiryDate` no produto | 14 |
| `StockMovement` | Entrada, saída e ajuste, de preferência apontando para lote e OS | `DemoStockMovement` aponta para produto e, às vezes, OS | 14 |
| `UnitOfMeasure` | Catálogo. Sementes: `UN`, `L`, `ML`, `KG`, `G`. A lista pode crescer sem mudar código de perfil | `unit` é string livre | 14 |

Saldo pode ser projeção dos movimentos. O demo guarda `stockQuantity` no produto. A Sprint 14 escolhe o mecanismo físico; o conceitual é lote + movimento.

## Financeiro gerencial

| Entidade | Papel | Demo | Sprint |
| --- | --- | --- | --- |
| `FinancialEntry` | Receita a receber ou despesa básica, ligada a cliente, contrato, OS ou licitação | `DemoFinancialTransaction` com tipos `revenue`, `receivable` e `expense` no mesmo registro | 17 |
| `Installment` | Parcela com vencimento e valor | Não existe. Há um `dueDate` no lançamento | 17 |
| `Payment` | Pagamento que quita parcela total ou parcialmente | Só `paidAt` opcional | 17 |

Negociação, neste modelo, é renegociação de parcelas em aberto, não uma segunda oportunidade comercial. O briefing lista "negociações" dentro do financeiro e não detalha o conceito. Ver pendências em [scope.md](./scope.md).

## Plataforma

| Entidade | Papel | Demo | Sprint |
| --- | --- | --- | --- |
| `Alert` | Vencimento ou pendência com origem tipada (`contract`, `certificate`, `financial_installment`, `document`, `license`, `training`, `product_batch`, `proposal`, `postsale`, outras) | Funções espalhadas em compliance, dashboard e estoque | 18 |
| `AuditLog` | Fundação na Sprint 9: ator, ação, tipo, id, metadata e instante. Sem painel e sem imagem antes/depois. O painel completo continua na Sprint 20 | Não existe | 9, painel na 20 |

Pós-venda entra como origem possível de alerta. A regra que dispara esse alerta não foi especificada.

## Fora deste modelo

Não há entidade de NF-e, lançamento contábil, holerite, dispositivo móvel, coordenada geográfica ou evento do Google Calendar. Integração de calendário, se for contratada, referencia `Schedule` e não o substitui.
