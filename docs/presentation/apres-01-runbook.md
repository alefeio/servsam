# APRES-01 / APRES-01.1 — Runbook de apresentação e provisionamento

**Ambiente:** HOMOL Preview  
**Identidade:** host hash `22e5c2dd2d93` **e** `HOMOL_APPROVED_INSTANCE_ID` (fora do código)  
**Não usar:** Production, merge `main`, Sprint 11B, seed automática.

## Pré-requisitos de identidade (Gate A)

1. Garantir `.env.gate0.preview.local` com URLs `HOMOL_*`.
2. Calcular o instanceId (somente leitura):

```bash
npx tsx scripts/homol-print-instance-id.mjs
```

3. Gravar no **mesmo arquivo de env** (não commitado):

```bash
HOMOL_APPROVED_INSTANCE_ID=<instanceId impresso>
```

4. Inventário e provisionamento **interrompem** se:
   - `HOMOL_APPROVED_INSTANCE_ID` ausente;
   - instanceId live ≠ aprovado (`instance_id_mismatch`);
   - host hash ≠ `22e5c2dd2d93`;
   - URL alvo igual ao `RUNTIME_DATABASE_URL` legado (`.env.local`).

Essas checagens impedem escrita em banco incorreto mesmo quando o hostname Prisma é compartilhado.

## Dry-run seguro

```bash
npx tsx scripts/homol-provision-apres01.mjs --dry-run
```

Opcional no dry-run: `APRES_ACTOR_EMAIL=alexandrefpenha@gmail.com` para validar o ator sem escrever.

## Escrita (somente após autorização humana)

```bash
CONFIRM=YES APRES_DATA_AUTHORIZE=YES APRES_ACTOR_EMAIL=alexandrefpenha@gmail.com npx tsx scripts/homol-provision-apres01.mjs
```

Exige:
- Identidade HOMOL válida;
- Ator explícito ativo em `servsam` com permissões de cliente/orçamento;
- Recusa da conta `SEED_ADMIN_EMAIL`;
- Advisory lock (bloqueia execução concorrente);
- Revalidação do plano antes e entre cenários;
- Sem alteração direta de orçamento já aceito (só `transitionProposal`).

Não há atomicidade global: cada serviço usa sua própria transação. Em falha parcial, reexecute — o plano é idempotente.

## Antes da reunião

1. Preview protegido desta branch.
2. Congelar ou aceitar novos resíduos E2E/Gate F.
3. Provisionar **uma vez** com a linha de autorização acima (se liberada).
4. Reinventariar:

```bash
npx tsx scripts/homol-presentation-inventory.mjs
```

5. Confirmar `byKindActive.APRES === 3`.
6. Entrar em `/sistema` com a conta autorizada (não criar usuários).

## Roteiro na UI

### Painel

Narrar que os totais incluem resíduos `[E2E]`/`[GATEF]`; os cenários da reunião são `[APRES]`.

### Clientes / Orçamentos

Buscar `[APRES]`:

| Cenário | Busca | Situação |
| --- | --- | --- |
| A | `Condomínio Demonstrativo Verde` | Aceito |
| B | `Hotel Demonstrativo Horizonte` | Enviado |
| C | `Porto Industrial` | Rascunho |

O.C. do hotel e contrato periódico permanecem só na DEMO-HF.1 (`/demonstracao`).

## Validação pós-provisionamento

- [ ] Inventário: host + `instanceId` + org `servsam`
- [ ] 3 clientes `[APRES]` ativos
- [ ] Orçamentos A/B/C nos status alvo
- [ ] Segunda execução: só `noop`
- [ ] Sem mudança de usuários/papéis; auditoria intacta

## Recuperação

1. Reexecutar o mesmo comando (idempotente / retomada por cenário).
2. Soft-archive de resíduos: autorização separada.
3. Sem TRUNCATE, DELETE de auditoria ou reset destrutivo.

## Segurança

- Sem Production / migrations / seed de escrita sem aprovação  
- Sem auto-seleção de Diretoria  
- Sem criação de usuários ou alteração de papéis  
- `/demonstracao` fora do escopo desta branch  

## Autorização de escrita

Ainda **não** concedida neste gate APRES-01.1. Continua exigindo:

`CONFIRM=YES` + `APRES_DATA_AUTHORIZE=YES` + `APRES_ACTOR_EMAIL=<autorizado>` + identidade aprovada.
