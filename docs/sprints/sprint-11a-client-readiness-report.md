# Relatório — preparação final para homologação pelo cliente (11A)

**Data:** 2026-11-19  
**Branch:** `sprint-11a-persistent-core`  
**11B:** não iniciada · **Merge `main`:** não · **Production:** não

## Gate 1 — Git

| Item | Valor |
| --- | --- |
| HEAD local | `662e6a26e756fb25596fa951a89c8708afe4410f` |
| HEAD `origin/sprint-11a-persistent-core` | `662e6a26e756fb25596fa951a89c8708afe4410f` (iguais) |
| Push | **Confirmado** (`212ae41..662e6a2`, sem force) |
| Conteúdo de `662e6a2` | Somente docs + `scripts/homol-residue-report.mjs` (inventário read-only) |
| Working tree no push | limpa / sincronizada com origin |
| Merge `main` | não realizado |

## Gate 2 — Resíduos HOMOL

Inventário detalhado (`homol-residue-detail.mjs`): **5 clientes** + **5 orçamentos** na org SERVSAM.

| Resumo | Qtd |
| --- | --- |
| `[E2E]` (arquivados) | 3 |
| `[GATEF]` (ativos) | 2 |
| Orçamentos `accepted` | 3 (`0001`, `0002`, `0004`) |
| Orçamentos `draft` | 2 (`0003`, `0005`) |
| Audit logs relacionados | 19 |

Plano de limpeza **pendente de aprovação:** `sprint-11a-homol-cleanup-plan.md`.  
**Nenhuma exclusão executada.**

## Gate 3 — Acesso do cliente

Procedimento: `sprint-11a-client-access-runbook.md`.

| Tema | Situação |
| --- | --- |
| Preview protegido | URL `https://servsam-dkf2g3bpj-alefeios-projects.vercel.app` · Vercel Authentication |
| Conta Vercel do cliente | **Ação humana:** convidar e-mail individual na Deployment Protection |
| Usuário Better Auth | **Ação humana:** criar via `/sistema` (Gerência ou Diretoria) + senha só no vault |
| Login real | Suportado (`disableSignUp: true`; sem self-service) |
| Cliente real no cadastro | Não criar nesta etapa de provisionamento |
| Revogação | Desativar usuário + remover allowlist Vercel |

## Gate 4 — Roteiro

Checklist atualizado: `sprint-11a-client-homologation-checklist.md`  
Inclui sequência de 9 passos e aviso explícito de que OS, Agenda, O.C., RH e Financeiro completo **não** estão operacionais nesta versão.

## Gate 5 — Preview / bloqueios

| Item | Estado |
| --- | --- |
| Deployment de referência | `https://servsam-dkf2g3bpj-alefeios-projects.vercel.app` |
| Status | Ready · target `preview` · Vercel Authentication |
| Smoke interno (`vercel curl` /sistema/login) | HTTP 200 · “Entrar no sistema” · sem demo |
| Bloqueio esperado | Sem convite Vercel, o cliente não chega ao login SERVSAM |
| Bloqueio operacional | Conta `/sistema` ainda precisa ser provisionada manualmente antes da sessão |
| Resíduos na UI | Clientes `[E2E]`/`[GATEF]` podem aparecer nas listagens até limpeza aprovada |

## Próximos passos humanos

1. Aprovar (ou adiar) o plano de limpeza HOMOL.  
2. Convidar e-mail do cliente na Vercel Authentication.  
3. Criar usuário `/sistema` e entregar senha por canal seguro.  
4. Enviar checklist + URL Preview.  
5. Só após aceite do cliente: decidir merge/`main` (fora deste relatório).  
6. **Não** abrir Sprint 11B automaticamente.
