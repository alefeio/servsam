# Relatório da Sprint 5

**Data:** 28 de agosto de 2026  
**Responsável:** Alexandre Feio (execução assistida no Cursor)

## 1. Resultado

A Sprint 5 foi entregue: contratos com periodicidade, reajuste demonstrativo e cronograma previsto; documentos com responsável e validade; alertas de 90, 60 e 30 dias; receita recorrente derivada da massa estática; vínculos entre cliente, contrato, documento e OS.

## 2. Massa enriquecida

| Entidade | Alteração |
| --- | --- |
| Contratos (6) | `code`, `periodicity`, `adjustmentIndex`, `scheduledVisits` |
| Documentos (10) | `responsibleAlias`, `issuedAt`, mais 2 fixtures |

## 3. Telas entregues

- `/demonstracao/contratos` — lista com receita recorrente
- `/demonstracao/contratos/[id]` — vigência, cronograma, documentos e OS
- `/demonstracao/documentos` — alertas 90/60/30 e filtros
- `/demonstracao/documentos/[id]` — ficha com vínculos

Ficha de cliente atualizada com links para contratos, documentos e OS.

## 4. Login demonstrativo

Dois perfis fictícios visíveis na tela:

- **Direção:** `direcao@demo.servsam.local` / `servsam-demo`
- **Compliance:** `compliance@demo.servsam.local` / `servsam-demo`

Mesma senha, sessão em localStorage — sem auth de produção.

## 5. Principais arquivos

- `src/lib/demo/compliance-actions.ts`
- `src/data/demo/contracts.ts`, `documents.ts`, `auth.ts`
- `src/features/governance/*`
- `src/features/demo-auth/login-form.tsx`

## 6. Fora do escopo (mantido)

Assinatura eletrônica, arquivo morto jurídico, selos/números de certificação reais.

## 7. Próximo passo

Sprint 6 — estoque, financeiro e licitações demonstrativas.
