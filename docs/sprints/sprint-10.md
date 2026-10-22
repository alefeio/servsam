# Sprint 10 — Validação visual da V1

**Status:** DONE no ambiente demonstrativo  
**Data:** 22/10/2026

## Mudança de estratégia

Antes desta sprint, a fila da Sprint 8 previa começar o domínio real de cliente (`Customer`, contatos e unidades) em PostgreSQL. Essa implementação **não foi feita**.

A Sprint 9 permanece a fundação de produção em `/sistema`: PostgreSQL, Prisma, Better Auth, usuários, papéis, permissões, organização e auditoria de plataforma.

A Sprint 10 transforma `/demonstracao` na representação visual da V1 para o cliente aprovar organização, campos, navegação, terminologia, documentos e fluxo antes de schema, migration, API e regra definitiva.

A fila original 10–20 não foi renumerada. Ela está congelada em `docs/product-backlog.md`. A próxima implementação real de domínio só reabre depois da aprovação do cliente. A primeira peça prevista continua sendo o cliente real, salvo nova decisão.

## O que esta sprint é

Apresentação, validação, UX, UI, fluxo, campos e organização da informação no demo. Fixtures, `localStorage`, ações simuladas e prévias de documento.

O fio da reunião é o Hotel Amazonas Plaza (DEMO):

CLIENTE → PROPOSTA DEMO-005 → APROVAÇÃO → AGENDA → OS `os-demo-04` → EXECUÇÃO → RELATÓRIO / CERTIFICADO → FINANCEIRO → HISTÓRICO

## O que esta sprint não é

Não há modelos Prisma novos. Não há migration de negócio. Não há API definitiva, APIMG, Google Calendar, PDF oficial, baixa de estoque, financeiro real, portal do cliente ou jornada mobile.

As variáveis `APIMG_API_KEY` e `APIMG_UPLOAD_URL` continuam no ambiente e não são lidas por esta sprint. As fotos usam assets locais.

CNPJ no demo aceita o formato numérico legado e o formato alfanumérico. Não há restrição só de dígitos.

## Ambientes

| Rota | Papel nesta sprint |
| --- | --- |
| `/sistema` | Fundação real da Sprint 9, preservada |
| `/demonstracao` | Apresentação e validação visual |

## O que ainda depende do cliente

- Se a hierarquia da sidebar (fluxo primeiro, CRM e licitações em apoio) corresponde ao dia a dia.
- Se os campos da proposta, da OS, do relatório e do certificado estão completos.
- O modelo oficial do relatório fotográfico e do certificado. As prévias estão marcadas como layout fictício, pendente de validação. Não são o documento aprovado.
- Quais tipos de serviço (RSV, poço, coleta, CIP, ETE, ETA, retrolavagem) entram no cadastro e quais ficam texto livre.
- Veículos de exemplo: F1, F2, F3, Saveiro, Kombi.
- O que o módulo de colaboradores deve guardar além de cadastro, ASO, NR-33, NR-35, EPI, treinamento e advertência.
- Se o financeiro gerencial (em aberto, pago, vencido, negociado, janelas de 30/60/90) basta para a V1.
- Textos padrão, marca d'água, licenças e responsável técnico que vão para os modelos.
- Quais alertas merecem ação e quais são só informação.

O roteiro da reunião está em `docs/sprints/sprint-10-client-demo-guide.md`.
