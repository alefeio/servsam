# DEMO-HF — Adequação final da demonstração 10.2

**Branch:** `hotfix/demo-10-2-signal-oc`  
**Base:** `sprint-10-2-demo-adequacao` @ `4ca2190`  
**HEAD:** `d4d1cec`  
**Preview:** https://servsam-j2r8jx1kb-alefeios-projects.vercel.app  
**Gate:** DEMO-HF READY FOR REVIEW

## O que mudou

- Sinal **não** bloqueia emissão de OS; Comercial solicita / Financeiro confirma (simulado).
- O.C. recebida em avulso, periódico e sem orçamento interno (`/comercial/ordens-compra`).
- Agenda com remarcação + histórico no `localStorage`; conflitos soft.
- Roteiro: `sprint-10-2-client-demo-guide.md`.

## Evidências dos cenários

| Cenário | Fixture / rota |
| --- | --- |
| A avulso sem sinal | DEMO-001 → Emitir OS |
| A com solicitação financeira | DEMO-002 |
| Hotel Amazonas | DEMO-005 + O.C. avulsa |
| B O.C. direta | OC-DEMO-DIR-021 |
| C periódico | CT-DEMO-001 / OC-DEMO-CT-001 |

## Testes

| Suite | Resultado |
| --- | --- |
| lint / typecheck / build | PASS |
| unit | 94 passed |
| e2e demo (presentation, responsive, stability, system, direction) | PASS |

## Restrições respeitadas

Sem Production, merge `main`, migrations, HOMOL, `[APRES]`, 11B, SEC-P0/`/sistema`.
