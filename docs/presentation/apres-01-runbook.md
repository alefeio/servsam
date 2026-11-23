# APRES-01 — Runbook de apresentação e provisionamento

**Ambiente:** HOMOL Preview (`DATABASE_ENV=preview`, fingerprint `22e5c2dd2d93`)  
**Não usar:** Production, `/demonstracao` para esta massa, merge `main`, Sprint 11B.

## Antes da reunião (após autorização de dados)

1. Confirmar Preview protegido desta branch.
2. Congelar ou aceitar novos resíduos de E2E/Gate F durante a janela.
3. Se autorizado, provisionar uma vez:

```bash
CONFIRM=YES APRES_DATA_AUTHORIZE=YES npx tsx scripts/homol-provision-apres01.mjs
```

4. Reexecutar inventário:

```bash
npx tsx scripts/homol-presentation-inventory.mjs
```

5. Confirmar `byKindActive.APRES === 3` e ausência de `conflicts` no relatório do provisionamento.
6. Entrar em `/sistema` com conta Diretoria já existente (não criar usuários).

## Roteiro na UI (filtros e navegação direta)

### Painel

1. Abrir `/sistema`.
2. Ler **Clientes ativos** e resumo de orçamentos como totais do ambiente.
3. Narrativa: o número inclui resíduos `[E2E]`/`[GATEF]` ativos; os cenários da reunião são os `[APRES]`.

### Clientes

1. `/sistema/clientes`
2. Buscar `[APRES]` na listagem.
3. Abrir na ordem:
   - Condomínio Demonstrativo Verde (A)
   - Hotel Demonstrativo Horizonte (B)
   - Empresa Demonstrativo Porto Industrial (C)
4. Em cada ficha: contato, unidade e orçamento vinculado.

### Orçamentos

1. `/sistema/orcamentos` → filtrar/buscar `[APRES]`.
2. A: status **Aceito** — origem comercial da futura OS.
3. B: status **Enviado** — sanitização em negociação; lembrar que O.C. está só na demo.
4. C: status **Rascunho** — periódico; contrato fora deste módulo.

### Atalhos sugeridos

| Cenário | Busca | Situação |
| --- | --- | --- |
| A | `Condomínio Demonstrativo Verde` | Aceito |
| B | `Hotel Demonstrativo Horizonte` | Enviado |
| C | `Porto Industrial` | Rascunho |

## Validação pós-provisionamento

- [ ] Inventário: fingerprint `22e5c2dd2d93`, org `servsam`.
- [ ] 3 clientes `[APRES]` ativos.
- [ ] 3 orçamentos `[APRES]` nos status A/B/C.
- [ ] Segunda execução do script: só `noop` (idempotente).
- [ ] Painel: clientes ativos = baseline + 3 (se baseline não mudou).
- [ ] Nenhuma alteração em usuários/papéis/auditoria apagada.

## Recuperação

Não há reset destrutivo. Opções seguras:

1. Reexecutar o script (idempotente) se faltou contato/unidade/orçamento.
2. Soft-archive seletivo futuro (autorização à parte) — **não** nesta preparação.
3. Narrar resíduos técnicos sem apagá-los.
4. Store separada (estratégia A) só se a organização decidir depois.

## Dry-run seguro (sempre permitido)

```bash
npx tsx scripts/homol-provision-apres01.mjs --dry-run
```

## Segurança (checklist)

- [x] Sem Production  
- [x] Sem criação de usuários  
- [x] Sem alteração de papéis  
- [x] Sem migrations  
- [x] Sem TRUNCATE/DELETE/limpeza de auditoria  
- [x] Sem seed de escrita sem aprovação  
- [x] Sem teste destrutivo na massa `[APRES]`  
- [x] `/demonstracao` não modificado nesta branch  

## Autorização de escrita

Exigida e **ainda não concedida** nesta entrega APRES-01:

`CONFIRM=YES` + `APRES_DATA_AUTHORIZE=YES`
