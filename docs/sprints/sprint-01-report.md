# Relatório da Sprint 1

**Data:** 28 de agosto de 2026  
**Responsável:** Alexandre Feio (execução assistida no Cursor)

## 1. Resultado

A Sprint 1 foi entregue: fundação Next.js 16, site institucional completo, login demonstrativo, shell do sistema, dashboard reduzido, módulos futuros em estado planejado, testes unitários/de componente, build e documentação.

## 2. Rotas implementadas

Públicas: `/`, `/sobre`, `/servicos`, `/servicos/[slug]`, `/segmentos`, `/experiencia`, `/licencas-certificacoes`, `/conteudos`, `/contato`, `/privacidade`.

Demonstração: `/demonstracao/login`, `/demonstracao`, e as rotas de módulos planejados (`/demonstracao/comercial`, `/clientes`, `/agenda`, `/ordens-servico`, `/contratos`, `/licitacoes`, `/estoque`, `/financeiro`, `/documentos`, `/relatorios`, `/configuracoes` e subrotas comerciais).

## 3. Principais arquivos

- `.cursor/rules/servsam-mvp.mdc`
- `src/data/official/*` e `src/data/demo/*`
- `src/lib/repositories/*`
- `src/app/(public)/*` e `src/app/(demo)/*`
- `docs/**`

## 4. Fontes

- https://servsam.com.br/
- https://servsam.com.br/contato/
- https://www.instagram.com/servsam.belem/
- https://portaldatransparencia.gov.br/licitacoes/398193037/pessoa-juridica/21332050000146
- Arquivo de estratégia da Sprint 1

O briefing PDF não estava no workspace.

## 5. Conteúdos fictícios

Cases (Rio Guamá, Horizonte Amazônia, Porto Verde), cards editoriais, snapshot do dashboard, credencial de login, nomes DEMO no preview operacional.

## 6. Pendências de validação

Ver `docs/content/pending-client-validation.md`. Destaques: fotos, certificações documentais, CNPJ/razão social em peça institucional, e-mail/Instagram e política de privacidade.

## 7. Testes e comandos

| Comando | Resultado |
| --- | --- |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npm test` | 12 testes em 7 arquivos, passou |
| `npm run build` | passou (40 páginas estáticas) |
| HTTP local nas rotas públicas e demo | 200 |
| Navegador: Home, contato (sucesso simulado), login, dashboard, Agenda planejada | ok |
| `npm run test:e2e` (Playwright) | **não executado**: `npx playwright install chromium` falhou com `ENOSPC` (sem espaço em disco) |

## 8. Limitações conhecidas

- Sem banco, API, e-mail real ou fotos autorizadas.
- Dashboard ainda é snapshot, não métricas derivadas.
- Homologação noindex.
- Playwright depende de liberar espaço em disco e `npx playwright install chromium`.

## 9. Mobile de campo

**Não foi implementado.** A épica permanece em `docs/future/mobile-field-epic.md` com status FUTURE / NOT CONTRACTED.

## 10. Recomendação para a Sprint 2

Aprovar visualmente o site e o shell. Em seguida, substituir o snapshot do dashboard por uma massa demonstrativa coerente (clientes, oportunidades, OS, contratos, documentos, estoque e financeiro) com validação automática de referências. Não iniciar CRM (Sprint 3) na mesma conversa.
