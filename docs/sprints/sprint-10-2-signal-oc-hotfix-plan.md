# Plano de hotfix — demonstração Sprint 10.2 (sinal / O.C. / Financeiro)

**Branch alvo:** `sprint-10-2-demo-adequacao` (isolada de `/sistema` e da 11A).  
**Estado:** plano apenas. **Não aplicado** neste pacote documental da `sprint-11a-persistent-core`.  
**Motivo:** o feedback de 19/11/2026 superou a hipótese “sinal obrigatório para emitir OS” e a O.C. só em contrato periódico.

## Divergência atual

Na 10.2, `createWorkOrderFromProposal` exige `paymentSignal.status === "confirmed"`. A UI e os textos falam em “Aceite → Sinal → OS”. A O.C. aparece ligada a contratos periódicos. O comercial “confirma” o sinal na demo.

Isso **contradiz** as regras confirmadas: sinal não bloqueia universalmente a OS; Financeiro confirma pagamento; O.C. é documento do cliente, não substitui OS.

## Arquivos a alterar (na branch 10.2)

### Código / dados demo

| Arquivo | Mudança proposta |
| --- | --- |
| `src/lib/demo/operations-actions.ts` | Remover bloqueio universal por `paymentSignal.confirmed` em `createWorkOrderFromProposal` / `canCreateWorkOrder…`; permitir OS com aceite; sinal opcional/recomendado |
| `src/lib/demo/operations-actions.test.ts` | Atualizar testes: OS sem sinal confirmado; manter cenários com sinal quando presente |
| `src/features/crm/proposal-detail-view.tsx` | Copy e CTAs: separar aceite, solicitação ao Financeiro e confirmação financeira; não exigir sinal para “Emitir OS” |
| `src/data/demo/proposals.ts` | Fixtures: exemplos com e sem sinal; notas sem “50% obrigatório” / “pronto só após sinal” |
| `src/data/demo/operational-story.ts` | Narrativa `paymentSignal`: recomendado em avulso, não bloqueio universal |
| `src/data/demo/planned-modules.ts` | Objetivo do módulo comercial sem “sinal obrigatório” |
| `src/features/crm/commercial-hub-view.tsx` | Descrição do hub |
| `src/data/demo/financial-transactions.ts` | Sinal como lançamento demonstrativo **confirmado pelo Financeiro**, não pelo Comercial |
| `src/data/demo/contracts.ts` + `src/features/governance/contract-detail-view.tsx` | O.C. como documento recebido; pode existir fora de “só periódico”; **não** substituir OS |
| `src/types/demo-entities.ts` | Ajustar comentários/tipos de `paymentSignal` / `purchaseOrder` se a semântica mudar |
| `src/features/operations/agenda-view.tsx` (+ schedule helpers) | Garantir copy: remarcar data/hora, responsável, histórico; **sem** Google Calendar; drag-and-drop não obrigatório |

### Documentação demo

| Arquivo | Mudança proposta |
| --- | --- |
| `docs/sprints/sprint-10-2.md` | Fluxo e critérios alinhados ao feedback |
| `docs/sprints/sprint-10-2-report.md` | Corrigir “OS só com sinal” |
| `docs/sprints/sprint-10-2-client-demo-guide.md` | Roteiro de demo sem bloqueio universal |
| `docs/content/pending-client-validation.md` (na 10.2) | Itens 67–68 etc. marcados conforme consolidação 11A |

### E2E / textos

| Arquivo | Mudança proposta |
| --- | --- |
| Specs e2e da 10.2 que esperam sinal antes da OS | Ajustar asserções |
| Qualquer copy “Confirme o sinal antes de emitir a OS” | Substituir |

## Critérios de aceite do hotfix (demo)

1. Orçamento aceito permite emitir OS **sem** sinal confirmado.  
2. Fluxo com sinal continua demonstrável (registrar → Financeiro confirma).  
3. O.C. explicada como documento do cliente; distinta de OS e de orçamento SERVSAM.  
4. Agenda permite ajuste de data/hora com persistência em `localStorage` (demo).  
5. `/sistema` e Prisma **intocados**.  
6. Nenhum fixture vira dado real no HOMOL.

## Sequência de execução sugerida

1. Branch hotfix a partir de `sprint-10-2-demo-adequacao` (ex.: `hotfix/demo-10-2-signal-oc`).  
2. Patch código + testes + docs da demo.  
3. Preview só da demo.  
4. Sem merge em `main` até pedido explícito.  
5. Não misturar com commits de `/sistema` / 11A.

## Fora do hotfix

Implementar 11B/11C, migrations, limpeza HOMOL, Google Calendar, NF-e, financeiro real.
