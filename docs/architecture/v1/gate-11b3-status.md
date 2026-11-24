# Sprint 11B.3 — Status (revisão pré-HOMOL)

**Branch:** `feature/11b-3-real-scheduling`  
**Base:** `a61630a2ecadce543b0b4a9bec9ab5a63a8acbdb`  
**Migration HOMOL:** **NÃO aplicada** (aguarda autorização)

## Gates

| Gate | Estado |
|------|--------|
| 11B.3A Colaboradores | Implementado |
| 11B.3B Agendamento persistente | Implementado |
| 11B.3C Estados da OS | Implementado (`issued ↔ scheduled`, cancelamento) |
| 11B.3D Agenda visual | Implementado (dia/semana/mês em lista filtrável) |
| 11B.3E Conflitos | Implementado (alerta + `acceptConflict` auditado) |
| 11B.3F Auditoria | Implementado |
| 11B.3G Permissões | Código + actions; grants HOMOL a validar no preflight |
| 11B.3H Testes isolados | Integração PASS no Docker; E2E Playwright de agenda pendente |
| 11B.3I Migration HOMOL | Bloqueada até nova autorização |

## Evidências locais

- Lint / typecheck / unitários (189) / build: PASS
- `node scripts/run-isolated-qa.mjs integration`: PASS  
  - migration `20261124180000_employees_appointments` no `servsam_e2e`
  - tabelas `employee` + `service_appointment` presentes

## Interrupção

Parar aqui para revisão. **Não** migrar HOMOL / Production / `main` sem pedido explícito.
