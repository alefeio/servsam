# Inventário funcional financeiro — feedback 19/11/2026

**Fonte:** três capturas de menus do sistema de referência mostrado pelo cliente.  
**Estado:** inventário solicitado. **Não** é especificação fechada de implementação.  
**Nesta etapa:** nenhuma tabela Prisma financeira; não copiar identidade visual do sistema de referência.

Legenda:

| Marcação | Significado |
| --- | --- |
| **Confirmado (solicitado)** | Menu/agrupamento pedido pelo cliente como referência de escopo |
| **Pendente** | Detalhe de campos, regras ou prioridade ainda aberto |
| **Recomendação de fase** | Sugestão de quando encarar, sem compromisso de sprint |

## Operação financeira — Confirmado (solicitado)

- Contas a Pagar  
- Contas a Receber  
- Cartão de Crédito  
- Open Finance  
- Transferência de Saldo  
- Agenda de Compromissos *(agenda financeira — distinta da agenda operacional SERVSAM)*  
- Extrato e Conciliação  
- Fluxo de Caixa  

## Cadastros — Confirmado (solicitado)

- Empresas  
- Usuários  
- Contas  
- Categoria de Despesa  
- Categoria de Receita  
- Fornecedores e Clientes  
- Centro de Custos  
- Cartões  

## Relatórios — Confirmado (solicitado)

- Financeiro Consolidado  
- DRE  
- Extratos e Conciliações  
- Centro de Custo Geral  
- Recibos  
- Pago e a Pagar  
- Recebido e a Receber  
- Pagamentos Contábil  
- Recebimentos Contábil  
- Imposto de Renda  
- Pagamentos Consolidado  
- Recebimentos Consolidado  

## Outros agrupamentos — estrutura identificada

Visíveis nas capturas, **recolhidos** (sem submenus inventariados nas imagens):

- Gestão  
- Notas Fiscais  
- Importações  
- Sistema  

**Pendente:** expandir cada agrupamento com o cliente antes de projetar telas.

## Reaproveitamento e cuidados

| Tema | Orientação |
| --- | --- |
| Usuários / papéis | **Reutilizar** `User` / `Role` / `Permission` da Sprint 9 |
| Clientes | **Reutilizar** `Customer` (11A); não duplicar cadastro |
| Fornecedores | Projetar `Supplier` (ou equivalente) **sem** reutilizar `Customer` como fornecedor |
| Empresas | **Pendente:** interpretar se é multiempresa SERVSAM ou cadastro auxiliar antes de modelar |
| Agenda financeira vs operacional | **Separar** modelos/conceitos; calendário unificado só como UI futura |
| Open Finance | Integração específica — **recomendação de fase** tardia; depende de validação técnica |
| Notas fiscais / documentos fiscais | Integração própria — **recomendação de fase** após núcleo AP/AR; não NF-e nesta rodada de feedback |
| Sinal | Solicitação comercial → confirmação **Financeiro**; não confirmação automática |

## Recomendação de fase (proposta, não confirmada como sprint)

1. **Financeiro F1:** Contas a Pagar / Receber, categorias, contas, extrato básico, vínculo opcional a cliente/OS/orçamento.  
2. **Financeiro F2:** Conciliação, fluxo de caixa, cartões, centro de custos, transferências.  
3. **Financeiro F3:** Relatórios (DRE, consolidados, IR).  
4. **Financeiro F4+:** Open Finance, NF, importações — após requisitos próprios.

**Pendente do cliente:** prioridade entre F1–F4 e o que fica fora da V1.
