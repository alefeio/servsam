# Gate 11B.3 — Preflight de implantação HOMOL

**Status:** aguardando autorização explícita.  
**Não aplicar migration no HOMOL neste entregável.**  
**Não executar seed, reset, rollback automático ou limpeza.**

## Branch / SHA

- Branch: `feature/11b-3-real-scheduling`
- Base: `fix/11b-2-qa-readiness` @ `a61630a2ecadce543b0b4a9bec9ab5a63a8acbdb`
- Migration aditiva: `prisma/migrations/20261124180000_employees_appointments`

## O que a migration adiciona

- Tabela `employee`
- Tabela `service_appointment`
- Enum `ServiceAppointmentStatus`
- Índice único parcial: um agendamento `scheduled` vigente por OS
- FKs para `organization`, `service_order`, `employee`

## Preserva

- Clientes, unidades, orçamentos, O.C., contratações, OS
- Usuários, papéis, permissões, auditoria existente

## Permissões (Gate 11B.3G)

Chaves usadas pelo código:

- `employee.view`, `employee.manage`
- `schedule.view`, `schedule.create`, `schedule.update`

A matriz de seed do código inclui `employee.manage` em Administrativo (além de `schedule.*` / `employee.view` já previstos).

**Atenção:** papéis já existentes no HOMOL podem não ter os mesmos grants.  
Não corrigir via seed nesta sprint. Se faltar grant, preparar procedimento idempotente separado (preflight + aprovação).

## Checklist antes do HOMOL

1. Review do código e dos testes no banco isolado Docker.
2. Confirmar SHA do Preview protegido.
3. Inventário pré-migrate (contagens de OS, usuários, auditoria).
4. Autorização explícita por escrito para `migrate deploy` no HOMOL.
5. Pós-migrate: inventário + smoke (criar colaborador de teste? preferir org de validação controlada) + checagem de grants por papel.

## Fora de escopo automático

- Financeiro
- RH completo (RH-01: atestados, férias, advertências, prontuário)
- Múltiplas visitas periódicas (11C)
- Production / merge em `main`
