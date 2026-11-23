# Relatório da Sprint 10.2

> **Addendum DEMO-HF:** as regras “OS só com sinal confirmado” e “O.C. só em contrato periódico” foram corrigidas em `hotfix/demo-10-2-signal-oc` (`d4d1cec` / `20bcc7e`). Ver `demo-hf-10-2-report.md` e o roteiro atualizado `sprint-10-2-client-demo-guide.md`.

Adequação original de `/demonstracao` ao fluxo comercial, agenda, O.C. e RH. Sem Prisma e sem merge em `main`.

## Funcionalidades reaproveitadas

- Massa e jornadas Hotel Amazonas (Sprints 10 e 10.1).
- Entidade `DemoProposal` e rotas `/comercial/propostas` (UI Orçamento).
- Contratos periódicos, visitas e OS existentes.
- Colaboradores com ASO/NR/EPI.
- `hydrateDemoDataset` / React #185 / menu mobile.

## Alterações da 10.2 (histórico)

- Nomenclatura **Orçamento**; indicadores derivados.
- Sinal demonstrativo (na época acoplado à emissão da OS — **desacoplado no hotfix**).
- OS emitida sem data automática; agendamento separado.
- Agenda em calendário (dia/semana/mês).
- O.C. em contratos periódicos (**ampliada no hotfix** para avulso e O.C. direta).
- RH estruturado fictício.

## Hotfix DEMO-HF (após 19/11/2026)

- Sinal opcional; Comercial solicita / Financeiro confirma.
- O.C. recebidas em `/demonstracao/comercial/ordens-compra`.
- Remarcação com `scheduleHistory` no `localStorage`.
- Preview: https://servsam-j2r8jx1kb-alefeios-projects.vercel.app

## Testes (10.2 original)

- lint / typecheck / unit / e2e / build: ok na entrega `sprint-10-2-demo-adequacao`.

## Commit e Preview (10.2 original)

- Branch: `sprint-10-2-demo-adequacao`
- Commit: `40f3abacf485c730e0ce3dc605d8f34a52dce60e`
- URL Preview: https://servsam-2edd8j89f-alefeios-projects.vercel.app
- Merge em `main`: **não realizado**

## Pontos ainda sujeitos à validação do cliente

- OS individual por visita física (ainda pendente).
- Política de conflito de agenda.
- Adequação dos indicadores de conversão.
- Profundidade de RH e Financeiro na V1.
