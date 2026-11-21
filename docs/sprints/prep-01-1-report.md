# PREP-01.1 — Correções de auditoria e readiness

**Branch:** `prep/prep-01-next-presentation`  
**Base:** `54b9794`  
**HEAD:** `6231bdf` (`5404558` código + `6231bdf` docs)  
**Preview:** https://servsam-4foeyi0cu-alefeios-projects.vercel.app (`dpl_EF8wDrv3zP9QXfsQ44k4YYed5Y8h`, protegido)  
**Gate:** READY FOR FINAL REVIEW  
**Sem** limpeza HOMOL, massa fictícia, 11B, migration, merge `main` ou Production.

## Segurança (Gate A)

- Guarda compartilhada em `admin-continuity.ts`.  
- `updatePlatformUser`: impede retirar papéis que deixem a org sem admin ativo com `user.manage` (inclui autoalteração), em transação + auditoria.  
- `setPlatformUserActive`: mantém bloqueio do último admin.  
- `updateRolePermissions`: impede remover `user.manage` de um papel se isso zerar admins ativos; Diretoria continua com `DIRETORIA_LOCKED_PERMISSIONS`.  
- Papéis dos usuários atuais **não** foram alterados nesta entrega.

## UX (Gate B)

- Ambiente dinâmico via `getRuntimeEnvironmentLabel()` (shell + painel).  
- Removida copy incorreta sobre “resíduos ocultos”.  
- Perfis: grupos `<details>` recolhíveis/expansíveis; checkboxes permanecem no form (submit preserva permissões).  
- Sem novos menus operacionais.

## Dados (Gate C)

Recomendação **B** — manter HOMOL + futuros `[APRES]` controlados.  
Detalhe: `prep-01-1-presentation-data-strategy.md`. Nada criado/excluído.

## Demo 10.2 (Gate D)

Readiness: `prep-01-1-demo-10-2-readiness.md`. Hotfix **não** implementado aqui.

## 11B (Gate E)

Contrato atualizado com riscos de duplicidade, permissão financeira dedicada e visitas pendentes: `prep-01-11b-technical-contract.md`.

## Testes (Gate F)

| Suite | Resultado |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 129 passed, 20 skipped |
| `npm run test:integration` | PASS — 20 passed |
| `npm run build` | PASS |
| `npm run test:e2e:preview` | PASS — 3 passed |

E2E não apaga nem altera massa de apresentação. Preview protegido publicado.

## Pendências humanas

1. Confirmar estratégia **B** (ou A).  
2. Autorizar depois criação `[APRES]` / limpeza seletiva.  
3. Autorizar branch do hotfix 10.2.  
4. Autorizar 11B + nome da permissão `finance.signal.confirm`.  
5. Decidir OS por visita física.
