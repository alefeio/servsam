# DEMO-HF / DEMO-HF.1 — Adequação final da demonstração 10.2

**Branch DEMO-HF.1:** `fix/demo-hf-1-financial-oc-consistency`  
**Base:** `hotfix/demo-10-2-signal-oc` @ `294bf1f`  
**SHA:** `629374b2cd5d01eef52592c482824ce54dd2c4d1`  
**Preview (protegido):** https://servsam-av9gxf1tl-alefeios-projects.vercel.app  
**Gate:** DEMO-HF.1 READY FOR FINAL REVIEW

## DEMO-HF (entregue)

- Sinal **não** bloqueia emissão de OS; Comercial solicita / Financeiro confirma (simulado).
- O.C. recebida em avulso, periódico e sem orçamento interno (`/comercial/ordens-compra`).
- Agenda com remarcação + histórico no `localStorage`; conflitos soft.
- Roteiro: `sprint-10-2-client-demo-guide.md`.

## DEMO-HF.1 (ajustes)

### Gate 1 — Sem percentual implícito

- Removido `Math.round(proposal.value * 0.5)` de `registerPaymentSignal`.
- Valor: informado na UI **ou** `demoSignalExampleAmount` da fixture (exemplo explícito).
- Sem valor → solicitação não é registrada.
- Sinal permanece opcional; OS independente da confirmação; sem integração bancária.

### Gate 2 — Sem OS duplicada no Hotel Amazonas

- `OC-DEMO-AVL-014` ↔ `os-demo-04` ↔ `prop-005` (mesmo serviço).
- `findWorkOrderForPurchaseOrder` + `createWorkOrderFromPurchaseOrder` / `FromProposal` reutilizam a OS existente do mesmo serviço via `proposalId` / `workOrderId`.
- Serviços distintos continuam podendo ter OS distintas (ex.: O.C. direta `OC-DEMO-DIR-021`).
- Sem regra global de uma única OS por orçamento/contrato.

### Gate 3 — E2E de ações

- Spec: `e2e/demo-hf-1-scenarios.spec.ts` (A/B/C + smoke mobile).
- Isolamento: limpeza pontual do `localStorage` no início de cada teste (sem `addInitScript` que apagava a massa no reload).
- Ficha de OS adia `notFound` até o snapshot do cliente, para IDs emitidos só no `localStorage`.

## Evidências dos cenários

| Cenário | Fixture / rota | Ações cobertas |
| --- | --- | --- |
| A avulso sem sinal | DEMO-001 → Emitir OS | emissão, reload, persistência LS, sem duplicar |
| B O.C. direta | OC-DEMO-DIR-021 → OS | emitir, agendar, remarcar, histórico, reload |
| C periódico + Hotel | CT-DEMO-001 + DEMO-005 / OC-DEMO-AVL-014 | vínculo `os-demo-04`, execução/relatório/certificado |
| Mobile | O.C. + DEMO-005 | viewport 390×844 |

## Testes (Gate 5)

| Comando | Resultado |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | 95 PASS |
| `npm run build` | PASS |
| `npx playwright test e2e/demo-hf-1-scenarios.spec.ts --workers=1` | 4 PASS |
| E2E demo (`demo-*.spec.ts` + HF.1) | 13 PASS |

- SHA: `629374b2cd5d01eef52592c482824ce54dd2c4d1`
- Preview protegido (`vercel_authentication`): https://servsam-av9gxf1tl-alefeios-projects.vercel.app
- Inspect: https://vercel.com/alefeios-projects/servsam/GYSMrLYS9yTD4PxnWuWhskHLY2Jo

## Restrições respeitadas

Sem `/sistema`, HOMOL, Production, migrations, `[APRES]`, SEC-P0, 11A, merge `main`, 11B.
