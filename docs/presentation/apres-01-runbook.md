# APRES-01 / APRES-01.1 / APRES-01.1a — Runbook

**Ambiente:** HOMOL Preview  
**Identidade:** host hash `22e5c2dd2d93` + `HOMOL_APPROVED_INSTANCE_ID` + marcadores Gate 0  
**Não usar:** Production, merge `main`, Sprint 11B, seed automática.

## Pré-requisitos de identidade (Gate A / 01.1a)

1. Garantir `.env.gate0.preview.local` com URLs `HOMOL_*` (preferir URL **direta**, não pooler).
2. Calcular o instanceId (somente leitura):

```bash
npx tsx scripts/homol-print-instance-id.mjs
```

3. Cruzar o valor com evidência independente do Gate 0 (org `servsam` + migration `20261118160000_customers_proposals`) — não gravar um hash só porque a conexão candidata o imprimiu.
4. Gravar no env local (não commitado):

```bash
HOMOL_APPROVED_INSTANCE_ID=<instanceId validado>
```

5. Inventário/provisionamento **interrompem** se:
   - `HOMOL_APPROVED_INSTANCE_ID` ausente ou divergente;
   - host hash ≠ `22e5c2dd2d93`;
   - URL completa = `RUNTIME_DATABASE_URL` legado;
   - instanceId live = instanceId do legado;
   - faltam marcadores independentes (org/migration 11A).

## Lock de provisionamento (APRES-01.1a)

- Tipo: `pg_try_advisory_lock` / `pg_advisory_unlock` em **sessão dedicada** (`pg.Client`).
- Não usa o pool Prisma (sessões diferentes quebrariam o lock).
- URL do lock: `pickLockConnectionUrl` prefere `HOMOL_POSTGRES_URL` / `HOMOL_DATABASE_URL` e recusa pooler de transação.
- Ciclo: abrir conexão → acquire → `assertAlive` entre cenários → `close()` no `finally` (mesma sessão).
- Segunda execução recebe `concurrent_apres_provision_lock` enquanto a primeira mantém a sessão.
- Perda da conexão de controle (`assertAlive` falha) interrompe o fluxo — não continua desprotegido.

Evidência automatizada: `src/lib/platform/apres-session-lock.integration.test.ts` (conexões PostgreSQL distintas via `npm run test:integration`).

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
- Identidade HOMOL válida (env + marcadores independentes + ≠ legado);
- Ator explícito ativo em `servsam` com permissões de cliente/orçamento;
- Recusa da conta `SEED_ADMIN_EMAIL`;
- Lock de sessão dedicada (APRES-01.1a);
- Revalidação do plano antes e entre cenários;
- Sem alteração direta de orçamento já aceito (só `transitionProposal`).

Não há atomicidade global: cada serviço usa sua própria transação. Em falha parcial, o `finally` libera o lock e a reexecução retoma de forma idempotente.

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
