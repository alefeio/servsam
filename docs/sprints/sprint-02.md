# Sprint 2 - Massa demonstrativa e dashboard executivo

**Status:** DONE

## Objetivo

Criar um modelo de dados estático coerente e uma visão executiva capaz de contar a história da operação.

## Valor para o negócio

A direção consegue apresentar números, funil e alertas sem contradições, deixando claro que tudo é demonstrativo.

## Histórias de usuário

- Como direção, quero ver indicadores derivados dos mesmos fixtures.
- Como comercial, quero reconhecer clientes, oportunidades e propostas conectados.
- Como operação, quero ver OS e agenda alinhadas aos contratos fictícios.

## Critérios de aceite

- 10-15 clientes, 20-30 oportunidades, propostas relacionadas, 15-20 OS, 5-8 contratos, 6-10 documentos, 10-15 produtos e transações financeiras.
- Nenhuma referência quebrada.
- Banner "Dados demonstrativos" visível.
- Ação "Restaurar dados demonstrativos" recarrega a massa.

## Dependências

Sprint 1 concluída (shell, repositórios e snapshot inicial).

## Dados necessários

Fixtures em `src/data/demo` com IDs estáveis e proveniência DEMO_FICTIONAL.

## Telas previstas

Dashboard executivo com cards, funil, receita, categorias, agenda e alertas; filtro de período demonstrativo.

## Testes previstos

Validação automática de referências; testes de métricas derivadas; smoke do dashboard.

## Riscos

Inventar indicadores que não batem com a massa; parecer dado real.

## Fora do escopo

CRM interativo, agenda operacional completa, mobile de campo, banco de dados.

## Definition of Ready

Inventário da Sprint 1 aprovado; lista de entidades e relacionamentos fechada.

## Definition of Done

Métricas coerentes, restauração funcional, testes e documentação atualizados.
