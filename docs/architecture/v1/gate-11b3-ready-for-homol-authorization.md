# 11B.3 READY FOR HOMOL AUTHORIZATION

**Branch:** `fix/11b-3-acceptance`  
**Base auditada:** `7d9cac57f9ef80b7002ff103fc00f008a9b97d6a`

## Correções desta etapa

1. **Agenda visual** — calendário Dia (eixo horário), Semana (colunas) e Mês (grade); lista permanece como alternativa (`layout=lista`).
2. **Filtro por interseção** — compromissos que atravessam meia-noite entram nos dias pertinentes.
3. **Remoção de colaborador** — `undefined` preserva; `null`/vazio remove; id atribui; auditoria de assignee.
4. **Redirects** — destino derivado no servidor; sem confiança em `redirectTo` do formulário.
5. **Conflitos** — detalhe OS/horário/colaborador + confirmação vinculada a `acceptConflictKeys` recalculadas no servidor.
6. **Grant ADMINISTRATIVO** — script de plano preparado; **não** concedido; FINANCEIRO sem `employee.manage`.
7. **Executor migration 11B.3** — `scripts/homol-migrate-11b3.mjs` (padrão 11B.2); **não** executado no HOMOL.

## Preflight HOMOL (somente leitura)

| Item | Valor |
|------|--------|
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| org | `servsam` |
| Migration 11B.3 | **pendente** |
| Clientes total / ativos / arquivados | 28 / 20 / 8 |
| Grant `employee.manage` ADMINISTRATIVO | ausente (plano pronto) |
| Grant FINANCEIRO | sem alteração |

## Comandos preparados (não executar sem autorização)

```bash
CONFIRM=YES MIGRATION_11B3_AUTHORIZE=YES DATABASE_ENV=preview \
  HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
  node scripts/homol-migrate-11b3.mjs deploy
```

Grant (após decisão):

```bash
# apply permanece bloqueado no script até nova liberação explícita no código
DATABASE_ENV=preview node scripts/homol-grant-employee-manage-admin.mjs plan
```

## Riscos

- ADMINISTRATIVO no HOMOL ainda sem `employee.manage` até grant autorizado.
- Preview protegido exige login Vercel para validação visual humana.
- Calendário cobre 06h–22h na grade; compromissos fora da faixa aparecem cortados/no dia via interseção.

## Restrições respeitadas

Sem migrate HOMOL, sem grant aplicado, sem seed, sem Production, sem merge `main`, sem Financeiro/RH/Google Calendar.
