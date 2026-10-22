# Arquitetura funcional da V1

**Status:** especificação da V1. A fundação de plataforma foi implementada na Sprint 9. Os domínios de negócio desta página continuam sem tabela e sem tela de produção. O demo não mudou de comportamento.  
**Data:** 22/10/2026. Atualizado na Sprint 9.

## O que esta arquitetura governa

A V1 transforma o MVP demonstrativo em sistema de produção **em torno de um fluxo operacional**, não em torno de um ERP nem de um aplicativo de campo.

O demo das Sprints 1 a 7 continua publicado no mesmo repositório, com dados fictícios e `localStorage`. A V1 não nasce apagando essas telas. Leads, oportunidades e Kanban permanecem válidos e passam a ter prioridade inferior ao fluxo mestre.

## Hierarquia

1. **Cliente** agrega o relacionamento: contatos, unidades, propostas, contratos, ordens, relatórios, certificados, financeiro e histórico.
2. **Ordem de serviço** agrega a operação: agenda, equipe, veículo, produtos aplicados, execução, relatório técnico e certificado.
3. Proposta, agenda, execução, relatório, certificado e lançamento financeiro precisam ser rastreáveis de ponta a ponta a partir do cliente e da OS.

Nada na V1 deve exigir que o usuário reconstrua essa cadeia por planilha ou por texto solto.

## Decisões

| Decisão | Efeito |
| --- | --- |
| Fluxo mestre é o eixo | CRM ajuda a originar proposta; não é o centro do produto |
| RBAC configurável | `User`, `Role`, `Permission`. Os quatro perfis informados pelo cliente são sementes, não um enum fechado |
| Uma organização na V1 | `Organization` existe para pendurar usuários, licenças e responsável técnico. Não há multiempresa |
| Usuário não é colaborador | `User` entra no sistema. `Employee` executa serviço. O vínculo entre os dois é opcional |
| Agenda SERVSAM é a fonte da verdade | Google Calendar, se existir, só espelha. Nunca o contrário |
| Financeiro gerencial | Contas a receber, parcelas, pagamentos, despesas básicas, contratos e licitações. Sem NF-e e sem contabilidade |
| Alerta é transversal | Um mecanismo só, apontando para o registro de origem. Não um módulo isolado por vencimento |
| Auditoria é trilha, não workflow | `AuditLog` registra quem alterou o quê. Não substitui aprovação de proposta |
| Demo e produção não se misturam | Perfis Direção e Compliance do login demo não são os papéis da V1 |

## O que o demo já cobre

O código atual já navega dashboard, comercial, clientes, agenda, OS, contratos, licitações, estoque, financeiro, documentos, relatórios e configurações. Tudo isso é fixture coerente, com ações simuladas no navegador.

A arquitetura da V1 **reaproveita a linguagem** desses módulos e **não reaproveita o formato físico** como modelo definitivo. Exemplos de divergência que a migração terá de tratar, sem mudar o demo agora:

- lote e validade estão no produto, não em `ProductBatch`;
- equipe da OS é apelido de texto, não `Employee`;
- veículo não existe;
- execução, relatório técnico, certificado, parcela e pagamento não existem como entidades;
- `overdue` é status armazenado da OS;
- financeiro mistura receita, conta a receber e despesa num único lançamento;
- sessão e RBAC são representados, não aplicados.

O mapa campo a campo está em [conceptual-model.md](./conceptual-model.md).

## Forma de implementação futura

Quando a Sprint 9 abrir, a produção entra por baixo do demo, não no lugar da interface já aceita:

1. PostgreSQL e Prisma a partir deste modelo conceitual, não a partir de um schema improvisado.
2. Autenticação real e RBAC por permissão.
3. Repositórios deixam de ler só `src/data/` e passam a ler persistência, módulo a módulo, na ordem do backlog.
4. O site institucional permanece. O formulário de contato continua simulado até existir integração explícita.

Nesta sprint nenhum desses passos foi iniciado.

## Leitura obrigatória antes de codar a Sprint 9

- [master-flow.md](./master-flow.md)
- [scope.md](./scope.md)
- [rbac.md](./rbac.md)
- `docs/product-backlog.md`
