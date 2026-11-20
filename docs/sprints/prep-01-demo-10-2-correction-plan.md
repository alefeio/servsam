# PREP-01 — Plano de correção da demonstração 10.2

**Branch alvo do hotfix:** derivar de `sprint-10-2-demo-adequacao` (ex.: `hotfix/demo-10-2-signal-oc`).  
**Esta branch PREP-01:** apenas especificação. **Não aplica** o hotfix aqui.  
**Fonte:** `sprint-10-2-signal-oc-hotfix-plan.md` + feedback 19/11.

## Problemas a corrigir (demo)

1. Sinal **não** obrigatório universalmente para emitir OS.  
2. Sem percentual fixo obrigatório de 50%.  
3. Comercial **solicita**; Financeiro **confirma** recebimento.  
4. O.C. = documento **recebido** do cliente.  
5. O.C. não exclusiva de contratos periódicos.  
6. O.C. ≠ orçamento ≠ OS.  
7. OS **por serviço**.  
8. Agenda ajustável sem Google Calendar.

## Ordem de integração sugerida

1. Congelar narrativa 11A (este PREP).  
2. Abrir branch hotfix **só** `/demonstracao` + fixtures `src/data/demo`.  
3. Patch código/testes/docs da lista em `sprint-10-2-signal-oc-hotfix-plan.md`.  
4. Preview da demo isolado.  
5. Validar roteiro com avisos “Dados demonstrativos”.  
6. Só então eventual merge pedido da demo — **sem** misturar Prisma HOMOL.

## Isolamento

| Superfície | Dados |
| --- | --- |
| `/demonstracao` | fixture + `localStorage` |
| `/sistema` | PostgreSQL HOMOL + Better Auth |

## Critérios de aceite do hotfix (quando executar)

Ver seção correspondente em `sprint-10-2-signal-oc-hotfix-plan.md`.  
Adicionar: copy explícita de que Financeiro confirma; O.C. pode existir avulsa; OS por serviço.

## Fora

Migrations, 11B/11C, limpeza HOMOL, NF-e, Google Calendar.
