# 11B.3 HOMOL DEPLOY PASS

## 1. Data/hora

- Execução (UTC): **2026-11-25T03:32:56.753Z** (`finished_at` da migration)
- Relatório gerado em: 2026-11-25 (America/Belém)

## 2. SHA do código utilizado

- Branch: `fix/11b-3-acceptance`
- HEAD aprovado / utilizado: `a62e60ea02ec4ad7612abc325f75a8b7b04b5ad2`
- Migration: `20261124180000_employees_appointments`
- Executor: `scripts/homol-migrate-11b3.mjs`

## 3. Identidade anonimizada do banco

| Item | Valor |
|------|--------|
| `DATABASE_ENV` | `preview` |
| hostHash | `22e5c2dd2d93` |
| instanceId | `0786bd682d75` |
| Organização | `servsam` |
| prismaCliHostHash | `22e5c2dd2d93` |

## 4. Resultado do preflight (Gate 1)

- `evaluation.ok=true`
- Blockers: nenhum
- Pendente única: `20261124180000_employees_appointments`
- Tabelas `employee` / `service_appointment`: ausentes (antes)
- Migrations anteriores (5) presentes e finalizadas
- Contagens pré: clientes 28/20/8 · propostas 21 · contratações 7 · OS 0 · employees/appointments nulos

## 5. Comando executado (Gate 2)

```bash
CONFIRM=YES \
MIGRATION_11B3_AUTHORIZE=YES \
DATABASE_ENV=preview \
HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
node scripts/homol-migrate-11b3.mjs deploy
```

- `DEPLOY_EXIT=0`
- Sem seed, sem grant, sem reset, sem rollback automático

## 6. Migration aplicada

- Nome: `20261124180000_employees_appointments`
- Registrada em `_prisma_migrations`
- `finished_at`: `2026-11-25T03:32:56.753Z`
- `rolled_back_at`: `null`

## 7. Auditoria posterior (Gate 3)

- `postAudit.ok=true` (executor)
- Pós-auditoria somente leitura: `docs/architecture/v1/gate-11b3-homol-postaudit-result.json` → `ok: true`
- Tabela `employee`: presente
- Tabela `service_appointment`: presente
- Enum `ServiceAppointmentStatus`: presente
- FKs: `employee_organizationId_fkey`, `service_appointment_organizationId_fkey`, `service_appointment_serviceOrderId_fkey`, `service_appointment_employeeId_fkey`
- Índice único parcial: `service_appointment_active_service_order_unique`
- Migrations pendentes/incompletas: **0**
- Domínio novo vazio: employees=0, appointments=0 (sem seed)

## 8. Contagens antes / depois

| Métrica | Antes | Depois |
|---------|-------|--------|
| Clientes total | 28 | 28 |
| Clientes ativos | 20 | 20 |
| Clientes arquivados | 8 | 8 |
| Propostas ativas | 21 | 21 |
| Contratações ativas | 7 | 7 |
| O.C. ativas | — | 4 |
| OS ativas | 0 | 0 |
| Usuários | 2 | 2 |
| Audit logs | 342 | 342 |
| Employees | — | 0 |
| Appointments | — | 0 |

Nenhuma divergência comercial observada vs inventário imediato pré-deploy.

## 9. Estado do Preview (Gate 4)

- Branch Preview protegido: https://servsam-git-fix-11b-3-acceptance-alefeios-projects.vercel.app
- Deployments Vercel recentes da branch: **Ready**
- Smoke HTTP: redireciona para login Vercel (proteção SSO) — esperado
- Consultas SQL às novas tabelas: OK (somente leitura)
- Sem cadastro de colaboradores nem agendamentos de teste no HOMOL nesta etapa

## 10. Permissões preservadas

- Nenhum grant aplicado
- `ADMINISTRATIVO` continua sem `employee.manage` (esperado)
- `FINANCEIRO` sem `employee.manage` (esperado)
- `GERENCIA` / `DIRETORIA` mantêm `employee.manage` + `schedule.*`

## 11. Riscos remanescentes

- ADMINISTRATIVO no HOMOL ainda sem `employee.manage` até procedimento de grant autorizado separadamente
- Preview protegido exige login Vercel para validação visual humana das rotas `/sistema/colaboradores` e `/sistema/agenda`
- Código Preview já inclui cancelamento de OS tocando `service_appointment` — alinhado após esta migration
- Não iniciar 11B.4 automaticamente; sem merge em `main`; sem Production

## Restrições respeitadas

Sem seed, sem grants, sem reset, sem Production, sem merge `main`, sem E2E de escrita no HOMOL, sem alteração de `/demonstracao`.

---

**11B.3 HOMOL DEPLOY PASS**
