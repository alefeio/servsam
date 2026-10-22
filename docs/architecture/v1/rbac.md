# RBAC da V1

**Data:** 22/10/2026. Atualizado na Sprint 9.

A matriz abaixo é a leitura da Sprint 8 e permanece como fonte da semente. A implementação usa chaves pontilhadas (`customer.view`, `proposal.send`, `user.manage`). O mapa e a base `explicit` ou `inferred` estão em `src/lib/platform/permissions.ts` e em `docs/sprints/sprint-09.md`. O login demo não consulta esta tabela.

## Modelo

Três entidades, sempre:

- `User` — quem entra.
- `Role` — papel com nome editável.
- `Permission` — chave estável de capacidade.

Um usuário tem um ou mais papéis. A permissão efetiva é a **união**. Não existe deny. Não existe `if (role === "DIRETORIA")` no código de negócio. Diretoria é um papel que recebe todas as chaves no seed. Chave nova só passa a valer para esse papel quando for concedida de novo.

Os quatro nomes abaixo são **sementes informadas pelo cliente**, não a lista fechada de papéis:

| Papel semente | Intenção informada |
| --- | --- |
| Administrativo | Clientes, OS, propostas, relatórios, certificados e processos |
| Gerência | Acesso geral, exceto financeiro |
| Financeiro | Financeiro e administrativo geral |
| Diretoria | Acesso completo |

Perfis do demo (Direção, Compliance) não entram neste seed.

## Chaves

Ações usadas na matriz: ler, escrever, operar (enviar, executar, emitir). Gerir papéis é chave própria.

| Chave | Capacidade |
| --- | --- |
| `customers` | Clientes, contatos e unidades |
| `proposals` | Propostas |
| `schedules` | Agenda |
| `service_orders` | OS e execução |
| `technical_reports` | Relatório técnico e fotos |
| `certificates` | Certificados e atestados |
| `products` | Produtos, lotes, fichas e estoque |
| `employees` | Colaboradores e documentos operacionais |
| `vehicles` | Veículos |
| `contracts` | Contratos |
| `financial` | Contas, parcelas, pagamentos, despesas |
| `tenders` | Licitações |
| `documents` | Documentos, licenças e modelos |
| `alerts` | Ver alertas dos domínios já liberados |
| `reports_managerial` | Relatórios gerenciais |
| `users` | Usuários |
| `roles` | Papéis e permissões |
| `audit` | Trilha de auditoria |
| `leads` | Leads, oportunidades e Kanban (produção V1.1; demo continua aberto) |

`alerts` não amplia domínio: o alerta de parcela só aparece para quem tem `financial` de leitura.

## Matriz semente

Valores:

- **Sim** — decorre do texto do cliente.
- **Inferido** — necessário para o fluxo mestre funcionar com o que foi pedido, mas não foi dito com essas palavras.
- **Não** — exclusão explícita ou ausência deliberada.
- **Pendente** — a palavra do cliente não tem destino seguro.

| Capacidade | Administrativo | Gerência | Financeiro | Diretoria |
| --- | --- | --- | --- | --- |
| Clientes, ler e escrever | Sim | Sim | Sim | Sim |
| Propostas, ler, escrever e enviar | Sim | Sim | Sim | Sim |
| Registrar aceite da proposta | Inferido | Sim | Inferido | Sim |
| Agenda, ler e escrever | Inferido | Sim | Inferido | Sim |
| OS e execução, ler e escrever | Sim | Sim | Sim | Sim |
| Relatório técnico, ler e emitir | Sim | Sim | Sim | Sim |
| Certificado, ler e emitir | Sim | Sim | Sim | Sim |
| Processos | Pendente | Pendente | Pendente | Pendente |
| Produtos e estoque | Não | Sim | Não | Sim |
| Colaboradores, ler | Inferido | Sim | Inferido | Sim |
| Colaboradores, escrever | Não | Sim | Não | Sim |
| Veículos, ler | Inferido | Sim | Inferido | Sim |
| Veículos, escrever | Não | Sim | Não | Sim |
| Contratos, ler | Inferido | Sim | Sim | Sim |
| Contratos, escrever | Não | Sim | Inferido | Sim |
| Financeiro | Não | Não | Sim | Sim |
| Licitações | Não | Sim | Inferido | Sim |
| Documentos e licenças, ler | Inferido | Sim | Sim | Sim |
| Documentos e licenças, escrever | Não | Sim | Não | Sim |
| Relatórios gerenciais | Não | Sim | Sim no recorte financeiro | Sim |
| Usuários, ler e escrever | Não | Não | Não | Sim |
| Papéis e permissões | Não | Não | Não | Sim |
| Auditoria, ler | Não | Não | Não | Sim |
| Leads e Kanban em produção | Não nesta V1 | Não nesta V1 | Não nesta V1 | Não nesta V1 |

"Sim no recorte financeiro" significa relatórios de receita, despesa, vencimento e inadimplência, não o painel executivo completo. O cliente não separou esses relatórios. A separação é recomendação.

## Como cada frase do cliente foi lida

- **Administrativo inclui relatórios.** Lido como relatório técnico, porque está na mesma lista de OS e certificados. Relatório gerencial ficou com gerência e diretoria.
- **Financeiro inclui administrativo geral.** Lido como o conjunto do administrativo mais o módulo financeiro e contratos.
- **Gerência exceto financeiro.** Sem chave `financial`. Valores de proposta continuam visíveis, porque proposta não é o módulo financeiro.
- **Diretoria completa.** Todas as chaves, inclusive usuários, papéis e auditoria. Quem administra papéis não foi dito; deixar só na diretoria é recomendação para a Sprint 9 não nascer sem dono.
- **Processos.** Sem definição. Não foi mapeado para licitação, auditoria nem workflow. A linha existe para não sumir com a palavra.

## O que a Sprint 9 não deve fazer

- Travar a aplicação em quatro constantes.
- Copiar os módulos do perfil demo Direção/Compliance para estes papéis.
- Esconder o CRM demonstrativo com esta matriz. A matriz vale para a produção. O demo segue sem RBAC real até a sprint que o substituir.
