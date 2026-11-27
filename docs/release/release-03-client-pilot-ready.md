# RELEASE-03 — Client Pilot Ready

**Veredito:** **CLIENT PILOT READY WITH KNOWN LIMITATION**

| Classificação | Resultado |
| --- | --- |
| CLIENT ACCOUNTS | **READY** |
| DIRECT LOGIN | **PASS** (SERVSAM sem Vercel Authentication na URL de homologação) |
| HOSTED PREVIEW ACCEPTANCE | **PASS** |
| ROLE SEPARATION | **VERIFIED** (hospedado) |
| NORMAL PERFORMANCE | **PASS** |
| COLD START LIMITATION | **KNOWN** (~60s só no 1º acesso após idle longo; não bloqueia o piloto) |
| SECURITY | **PASS** |
| CLIENT CHECKLIST | **READY** |
| PERFORMANCE PATCH | **PRESERVED** em `fix/release-03-performance` — **não** integrado |
| PRODUCTION | **UNCHANGED** |
| MAIN | **UNCHANGED** |

**Data da validação final:** 2026-11-27  
**Branch de homologação:** `fix/11b-4-finance-qa` @ `47f271ae2d815909ba763815c1bfc9d892d7176a`  
**URL de entrega:** https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app/sistema/login  
**Checklist:** `docs/release/servsam-v1-client-pilot-checklist.md`  
**Evidência:** `docs/release/artifacts-release-03-final/final-validation.json`

---

## Contas piloto

| Nome | E-mail | Papel | Status |
| --- | --- | --- | --- |
| Diretor | `diretoria@servsam.com` | DIRETORIA | ativo · login hospedado OK |
| Administrador | `administrativo@servsam.com` | ADMINISTRATIVO | ativo · login hospedado OK |
| Financeiro | `financeiro@servsam.com` | FINANCEIRO | ativo · login hospedado OK |

Credenciais temporárias: `.credentials/release-03-pilot.local.json` (gitignored; envelope local presente na validação). Entregar ao responsável por canal seguro 1:1 — **não** versionar.

---

## Acesso e segurança

- Login direto na SERVSAM na URL de homologação (**sem** tela Vercel SSO).
- `/sistema`, `/sistema/clientes`, `/sistema/financeiro` anônimos → redirecionam para `/sistema/login`.
- Cadastro público permanece desabilitado (`disableSignUp`).
- Matriz de permissões **não** alterada neste RELEASE-03.
- Patch de performance **não** mergeado (avaliação posterior).

### Menus comprovados no Preview

| Papel | Presente | Ausente |
| --- | --- | --- |
| DIRETORIA | Comercial, Agenda, Financeiro, Usuários, Perfis | — |
| ADMINISTRATIVO | Clientes, Orçamentos, Contratações, Agenda | Financeiro, Usuários, Perfis |
| FINANCEIRO | Comercial + Financeiro | Usuários, Perfis |

---

## Desempenho (homologação liberada)

Medição final 2026-11-27 (ambiente já utilizado; **não** idle longo artificial):

| Métrica | Valor |
| --- | --- |
| 1º submit→home | 1991 ms |
| 3 logins consecutivos (mediana) | **842 ms** |
| Máx. consecutivo | 957 ms |
| Nav Clientes | 996 ms |
| Nav Orçamentos | 1852 ms |
| Nav Contratações | 1003 ms |
| Nav Agenda | 1645 ms |
| Nav Financeiro | 1464 ms |

**Ressalva conhecida:** após inatividade prolongada, o **primeiro** login pode levar ~60s (reativação serverless/Postgres). Confirmado pelo responsável como limitado ao primeiro acesso; acessos seguintes normalizam. Não provoca timeout recorrente nem impede uso no piloto.

**Não alterado:** região, plano, banco, SSL, infraestrutura.

Branch `fix/release-03-performance` preservada para avaliação futura (benefício hospedado ainda não comprovado nesta URL; E2E/pool pendentes de revisão).

Detalhe técnico do cold: `docs/release/release-03-performance-gate.md`.

---

## Entrega ao cliente

1. URL: https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app/sistema/login  
2. Credenciais: envelope local do responsável (canal seguro).  
3. Roteiro: `docs/release/servsam-v1-client-pilot-checklist.md`  
4. Avisar: ambiente de **homologação**; sem NF real / sem banco real; 1º acesso após idle pode demorar ~1 minuto uma vez.  

### Revogação

Desativar usuários piloto · remover acessos Vercel se houver · rotacionar senhas do envelope · preservar auditoria.

---

## Produção / main

`main` permanece em `c8bc57f…` (inalterada). Nenhuma migration, grant, seed, limpeza ou registro comercial nesta validação final.
