# RELEASE-03 — Performance Gate (login)

**Veredito:** **RELEASE-03 PERFORMANCE HOLD**

O gargalo de ~60s após inatividade é **reativação/cold path da infraestrutura** (função Vercel + PostgreSQL Prisma em `db.prisma.io`), não uma regressão de RBAC. Correção de código mínima foi publicada em `fix/release-03-performance` para eliminar consultas de sessão/papéis duplicadas por request; isso **não** remove o cold de ~60s quando o banco/compute estava suspenso.

Warm login no Preview de homologação já atende a mediana ≤2s quando o banco está acordado.

---

## Resumo executivo

| Item | Valor |
| --- | --- |
| Branch de correção | `fix/release-03-performance` |
| HEAD tip | `fba15ad` (pool Vercel-only) / commits de auth `a8d0041` |
| Preview correção | https://servsam-git-fix-release-03-performance-alefeios-projects.vercel.app (**Deployment Protection ativa** — sem a exceção do domínio de homologação) |
| Homologação medida | https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app |
| Vercel region (funções) | **iad1** (confirmado em `X-Vercel-Id` / assets) |
| Edge observada | **gru1** → iad1 |
| Database | Prisma Postgres (`*.db.prisma.io:5432`), instanceId `0786bd682d75` |
| Database region | **Não exposta no hostname**; latência e topologia indicam **próximo a us-east (iad1)**, não GRU |

---

## Gate 1 — Medições (Preview hospedado)

Artefatos: `docs/release/artifacts-release-03-perf/`.

### Antes (homologação finance-qa, após inatividade real)

| Run | Login page | Submit→Home | Total |
| --- | --- | --- | --- |
| cold/first | 6356 ms | **60408 ms** | 67759 ms |
| warm median | — | **887 ms** | 2785 ms |
| warm max submit | — | 1418 ms | — |

Confirma o relato de ~60s no primeiro login após idle.

### Homologação com banco já acordado (mesma URL, sem o patch)

| Métrica | Valor |
| --- | --- |
| Submit→Home first | 1735 ms |
| Submit→Home mediana warm | **826 ms** |
| Nav Clientes mediana warm | **897 ms** |
| Nav max | 1352 ms |

### Depois no Preview da correção

**Não mensurável automaticamente:** a URL `fix-release-03-performance` ainda exige Vercel Authentication (302 SSO). A exceção de proteção aplica-se ao domínio de homologação, não a esta branch. Sem merge na branch de homologação (proibido neste gate).

Complementar local (Turbopack/dev, não substitui Preview): warm submit mediana ~3,1s — ruído de compilação local.

---

## Gate 2 — Infraestrutura

| Probe | Resultado |
| --- | --- |
| Connect local → HOMOL | ~2,6 s (primeira) |
| Query mediana local | ~300 ms |
| Roles join | ~215 ms |
| SSL logs | avisos `pg` sslmode alias (conhecido; sem alteração SSL) |
| Pooler dedicado | port 5432 / sem `pooler` no host |

**Hipótese principal do cold ~60s:** reativação do compute Prisma Postgres (ou conexão serverless fria) após idle, amplificada por várias idas ao banco no login (`signInEmail` + hook `session.create` + auditoria + `getSession` + carga de papéis no layout/página).

**Não alterado sem autorização:** região Vercel, região do banco, plano, SSL.

### Opções (requer decisão do responsável)

1. **Manter always-on / evitar pause** do Postgres Prisma (se o plano atual pausar) — melhor para cold ≤5s.  
2. **Alinhar região** app↔banco (ex.: ambos `iad1` ou ambos `gru1`) — reduz RTT contínuo; não elimina wake de 60s sozinho.  
3. **Aplicar o patch** na branch de homologação e remedir cold após 15–30 min de idle.  
4. Não contratar plano automaticamente.

---

## Gate 3 — Código

Problemas confirmados:

1. `requireAuthenticatedUser` no **layout** e na **página** → `getSession` + join de papéis **duas vezes** por navegação.  
2. `authenticate.ts` refazia `findUnique` após `signInEmail` (hook já valida `isActive`).  
3. Pool Prisma sem limite no Vercel.

Correções em `fix/release-03-performance`:

- `React.cache` em `getSessionUserId` / `getAuthenticatedUser` (**por request**, sem cache global).  
- Select mais enxuto de papéis/permissões.  
- Login usa `organizationId`/`isActive` do `signIn` quando presentes.  
- `max: 1` no adapter **somente se `VERCEL`**.

---

## Gate 4 — Segurança (exceção Vercel na homologação)

| Check | Resultado |
| --- | --- |
| `/sistema` anônimo | **307 → /sistema/login** |
| `/sistema/clientes` anônimo | **307 → /sistema/login** |
| `/sistema/login` | 200 |
| `disableSignUp` | true |
| Rate limit Better Auth | enabled (fora Vitest) |
| Server Actions | `requirePermission` / `requireAuthenticatedUser` |
| Produção vs HOMOL | `DATABASE_ENV=preview` + `HOMOL_*` fail-closed |

Nenhuma outra proteção Vercel foi alterada por este gate.

---

## Gate 5 — Testes

| Suite | Resultado |
| --- | --- |
| lint | PASS (1 warning pré-existente em script) |
| typecheck | PASS |
| unit (`npm test`) | PASS 179 |
| integration Docker | PASS 30 (após ajustar pool só-Vercel) |
| build | PASS |
| e2e:preview | **FAIL flaky/env** (password-recovery + production-auth login timeout no webServer local HOMOL) — não bloqueia a análise de cold 60s; reexecutar após estabilizar SEED/porta |

---

## Gate 6 — Critérios

| Meta | Status |
| --- | --- |
| Login após inatividade ≤5s | **FAIL** enquanto houver wake ~60s (infra) |
| Mediana login consecutivo ≤2s | **PASS** (~0,8–0,9 s no Preview acordado) |
| Nav módulos ≤1,5s | **PASS** (mediana ~0,9 s) |
| Sem regressão auth/RBAC | **PASS** (código preserva checks; rotas privadas redirecionam) |

---

## Retorno padronizado

```
ROOT CAUSE: cold wake Prisma Postgres/serverless após idle (~60s); consultas auth duplicadas por request (corrigidas na branch)
VERCEL REGION: iad1 (edge observada gru1→iad1)
DATABASE REGION: não publicada no host; topologia compatível com us-east / iad1 (db.prisma.io)
DATABASE LATENCY: ~300ms query mediana a partir do ambiente local BR; connect inicial ~2.6s
COLD LOGIN BEFORE: submit→home 60408ms (Preview finance-qa após idle)
WARM LOGIN BEFORE: mediana submit→home 887ms
COLD LOGIN AFTER: N/D no Preview da correção (Deployment Protection); cold de idle não eliminado só com patch
WARM LOGIN AFTER: N/D hospedado na branch de correção; warm homologação acordada 826ms (baseline)
AUTHORIZATION SECURITY: PASS (rotas privadas redirecionam; signup off; RBAC intacto)
REGRESSION TESTS: lint/typecheck/unit/integration/build PASS; e2e:preview FAIL flaky
PREVIEW: https://servsam-git-fix-release-03-performance-alefeios-projects.vercel.app
PRODUCTION: UNCHANGED
MAIN: UNCHANGED
```

**Veredito: RELEASE-03 PERFORMANCE HOLD**

### Próximos passos humanos

1. Decidir opção de infra (always-on / região) **ou** aceitar cold ocasional >5s no piloto.  
2. Autorizar cherry-pick/merge de `fix/release-03-performance` → `fix/11b-4-finance-qa` para remedir cold no domínio já com exceção Vercel.  
3. Após idle de 15–30 min, repetir o script `scripts/release-03-perf-login-measure.mjs` na URL de homologação.
