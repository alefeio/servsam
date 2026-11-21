# PREP-01.1 — Estratégia de massa para apresentação

**Data:** 2026-11-21  
**Inventário:** somente leitura (sem exclusão/criação nesta etapa)  
**Host HOMOL:** `22e5c2dd2d93`

## Situação atual (confirmada no PREP-01)

| Métrica | Valor |
| --- | --- |
| Clientes | 7 (2 ativos `[GATEF]`, 5 arquivados `[E2E]`) |
| Orçamentos | 7 (5 `accepted`, 2 `draft`) |
| Candidatos limpos | 0 |

## Restrições do domínio atual

- Orçamento **aceito** é imutável no fluxo de status.  
- Arquivar proposta pelo domínio aceita sobretudo **rascunho**.  
- Arquivar cliente pode ser bloqueado com orçamento em andamento.  
- Contatos/unidades/itens têm FKs; auditoria **não** pode ser apagada.  
- E2E/Gate F podem gerar novos resíduos a cada suíte.  
- Exclusão física **não** é opção.

## Alternativas

### A — Base de apresentação separada

Nova store Preview só para demos, seed fictício reproduzível (`[APRES]`).

| Prós | Contras |
| --- | --- |
| Isolamento total de resíduos | Custo (store, envs, deploys, disciplina de URL) |
| Reset seguro entre reuniões | Risco de apontar Preview “errado” |
| Não depende de soft-delete de accepted | Ainda precisa processo de seed |

### B — Manter HOMOL + cenários fictícios controlados *(recomendada)*

Permanecer no HOMOL atual; criar (quando autorizado) clientes/orçamentos com prefixo `[APRES]` e narrar resíduos `[E2E]`/`[GATEF]` como técnicos.

| Prós | Contras |
| --- | --- |
| Zero nova infra | Painel ainda conta resíduos ativos Gate F |
| Usa o mesmo fluxo que o cliente já acessa | Precisa disciplina de prefixos e roteiro |
| Sem contornar imutabilidade via hard delete | Limpeza seletiva continua opcional depois |

## Recomendação

**Adotar B para a próxima apresentação.**  
Justificativa: menor risco operacional, sem migration/store nova, respeita imutabilidade e auditoria. A limpeza seletiva dos resíduos continua proposta separada (aprovação humana), sem ser pré-requisito se o roteiro usar apenas registros `[APRES]` futuros.

**Não** criar massa nem limpar nesta etapa PREP-01.1.

## Procedimento futuro (após autorização)

1. Congelar suítes E2E que escrevem no HOMOL durante a janela da reunião, ou aceitar novos resíduos.  
2. Autorizar criação de 2–3 clientes `[APRES]` + orçamentos draft/sent/accepted.  
3. Opcional: soft-archive dos 2 Gate F ativos se a regra de negócio permitir.  
4. Restauração: manter auditoria; não há “reset” — nova massa `[APRES]` ou store A no futuro.

## Decisão solicitada

- [ ] Confirmar alternativa **B** para a próxima reunião  
- [ ] Preferir alternativa **A** (nova base) — detalhar prazo  
- [ ] Autorizar depois criação `[APRES]` / limpeza seletiva
