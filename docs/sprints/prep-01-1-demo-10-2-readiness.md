# PREP-01.1 — Readiness do hotfix da demo 10.2

**Implementação:** fora desta branch.  
**Origem futura:** `hotfix/demo-10-2-signal-oc` a partir de `sprint-10-2-demo-adequacao`.  
**Plano base:** `sprint-10-2-signal-oc-hotfix-plan.md` + `prep-01-demo-10-2-correction-plan.md`.

## Cobertura exigida

| Requisito | Coberto no plano? |
| --- | --- |
| Sinal opcional (não bloqueia OS) | Sim |
| Comercial solicita; Financeiro confirma | Sim |
| O.C. recebida, inclusive avulsa | Sim |
| OS por serviço | Sim (copy/fluxo demo) |
| Agenda ajustável sem Google Calendar | Sim |
| Dados fictícios identificados | Sim (`Dados demonstrativos`) |
| Financeiro/RH/execução sem integração falsa | Sim — módulos planned / avisos |

## Critérios de aceite (quando implementar)

1. Orçamento aceito permite emitir OS **sem** sinal confirmado.  
2. Fluxo com sinal: solicitar → Financeiro confirma (não Comercial).  
3. O.C. explicada como documento do cliente; ≠ OS ≠ orçamento.  
4. Agenda remarca data/hora com histórico em `localStorage` da demo.  
5. `/sistema` e Prisma **intocados**.  
6. Nenhum fixture vira dado HOMOL.  
7. E2E/demo specs atualizados; lint/typecheck/test da branch demo PASS.

## Ordem

1. Abrir branch isolada da 10.2.  
2. Patch código + fixtures + docs demo.  
3. Preview só da demo.  
4. Sem merge automático em `main`.
