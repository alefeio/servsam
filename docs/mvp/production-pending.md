# Pendências para produção

> A fila de implementação deixou de ser esta lista solta. Desde a Sprint 8, o que entra na V1, o que fica para V1.1 e o que está fora estão em `docs/architecture/v1/scope.md` e em `docs/product-backlog.md` (Sprints 9 a 20). O texto abaixo permanece como aceite do que o demo das Sprints 1 a 7 não é.

Lista explícita do que **não** faz parte do MVP demonstrativo entregue nas Sprints 1–7.

## Autenticação e segurança

- Autenticação real (OAuth, SSO, MFA)
- RBAC por módulo e perfil
- Auditoria de ações e trilha imutável
- Sessão server-side e revogação

## Dados e persistência

- Banco de dados (PostgreSQL ou equivalente)
- API REST/GraphQL
- Sincronização multiusuário
- Backup, migrações e versionamento de schema

## Integrações

- E-mail e WhatsApp operacionais
- ERP / fiscal / NF-e
- Gateway de pagamento
- Portal de compras público real
- Assinatura eletrônica

## Mobile de campo

- App ou PWA offline para técnico
- Geolocalização, câmera, assinatura em campo
- Ver épica: `docs/future/mobile-field-epic.md`

## Conteúdo e validação cliente

- Textos jurídicos definitivos (privacidade)
- Certificações com número, selo e validade confirmados
- Fotos reais de equipe, obras e clientes
- Domínio de e-mail corporativo

## Relatórios e exportação

- PDF/Excel nativos com layout oficial
- Agendamento de relatórios
- BI externo (Power BI, etc.)

## Infraestrutura

- Deploy produção com monitoramento
- CI/CD completo com E2E em pipeline
- SEO/indexação do ambiente demo (hoje: noindex)

## Qualidade pendente de ambiente

- E2E Playwright requer espaço em disco adequado no ambiente de CI/local
- Performance profiling sob carga real

---

**O MVP atual valida:** navegação, linguagem de negócio, fluxos desktop administrativos e massa fictícia coerente para apresentação à direção.
