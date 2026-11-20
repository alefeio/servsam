# PREP-01 — Escopo 11C e Financeiro por fases

**Estado:** delimitação. Sem implementação nesta branch.

## 11C — Contratos e O.C.

Deve contemplar:

- O.C. **recebida** e documentação associada (anexo/metadados).  
- Contratos avulsos e periódicos.  
- Recorrência.  
- Relação contrato / O.C. / orçamento / OS.  
- Visitas vinculadas ao serviço (**regras a validar** — pendente OS por visita).

### Fora da 11C

Financeiro amplo, RH, estoque, portal externo, NF-e, Open Finance.

## Financeiro — fases

Inventário de menus: `sprint-11a-finance-inventory-2026-11-19.md` (sem inventar submenus recolhidos).

| Fase | Conteúdo | Notas |
| --- | --- | --- |
| **FIN-F0** | Solicitação comercial + confirmação administrativa/financeira do recebimento (sinal) | Pode nascer junto da 11B |
| **FIN-F1** | Contas a pagar/receber + cadastros fundamentais (contas, categorias, fornecedores) | Escopo maior que V1 mínima |
| **FIN-F2** | Conciliação, caixa, contas, centros de custo | |
| **FIN-F3** | DRE e relatórios gerenciais | |
| **FIN-F4+** | Open Finance, fiscal, integrações, NF | Mudança de escopo vs V1 acordada |

## Mudanças de escopo vs V1 original

Qualquer entrega FIN-F1+ completa (AP/AR operacional, DRE, Open Finance, NF) deve ser registrada como **expansão de escopo**, não como “já estava na 11C”.

## Dependências

11A (cliente) → 11B (contratação/OS/agenda/sinal F0) → 11C (O.C./contratos) → FIN-F1….
