# SEC-P0 — Garantia concorrente do último administrador

**Branch:** `fix/sec-p0-last-admin-concurrency`  
**Base:** `prep/prep-01-next-presentation` @ `22252e9`

## Auditoria (Gate 1)

Antes desta correção:

1. `countActiveUserManagers` / helpers liam via `getPrisma()` global mesmo quando chamados de dentro de `$transaction`.
2. `updateRolePermissions` fazia a checagem de continuidade **antes** da transação de mutação.
3. Duas remoções/desativações concorrentes podiam ambas observar “ainda há 2 admins” e ambas concluir.

## Correção (Gate 2)

- `withOrganizationAdminContinuity(organizationId, run)` abre transação interativa e adquire  
  `pg_advisory_xact_lock(ADMIN_CONTINUITY_LOCK_NS, hashtext(organizationId))`.
- Leituras de continuidade recebem o mesmo `tx`.
- `updatePlatformUser`, `setPlatformUserActive` e `updateRolePermissions` usam o wrapper.
- Auditoria permanece no mesmo `tx`.
- Diretoria locked permanece.
- Sem migration; sem privilégios permanentes extras (lock é de transação).

## Evidência de concorrência

Suíte `admin-continuity.concurrency.integration.test.ts` (org descartável `sec-p0-*`):

- Duas demotions simultâneas → 1 sucesso + 1 `LAST_ADMIN_MESSAGE`; estado final ≥ 1 admin.
- Demotion × desativação → idem.
- Strip de `user.manage` em papéis distintos → idem + auditoria.
- Org outsider permanece com 1 admin.

## Riscos remanescentes

- Contenção sob carga: operações administrativas na mesma org serializam (aceitável).
- Paths que não passam por esses serviços (SQL manual / seed) não herdam a guarda.
- Timeout interativo configurado em 20s para aguardar o lock; se uma sessão travar além disso, a outra falha por timeout (não remove o último admin).
