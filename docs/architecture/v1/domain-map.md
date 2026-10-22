# Mapa de domínios

**Data:** 22/10/2026.

Legenda de situação: **demo** = tela fictícia já navegável; **V1** = entra na produção nas Sprints 9 a 20; **V1.1** = arquitetura prevista, fora da sequência 9 a 20; **futuro** = depois da V1.1; **fora** = fora do escopo atual.

| Domínio | Situação hoje | Alvo | Sprint |
| --- | --- | --- | --- |
| Site institucional | demo / público estático | Permanece. Conteúdo definitivo depende de validação do cliente | contínuo |
| Organização, usuários, papéis, permissões | login demo com dois perfis ilustrativos | V1 | 9 |
| Auditoria | inexistente | V1 | 20 |
| Clientes, contatos, unidades | clientes e unidades no demo; contato só como nome no lead | V1 | 10 |
| Leads e oportunidades (Kanban) | demo completo | Mantido no demo. Persistência de produção em V1.1 | — |
| Propostas e aprovação | demo com status simulado | V1, no fluxo mestre | 11 |
| Agenda | demo administrativa | V1, fonte da verdade | 12 |
| Colaboradores / RH operacional | apelido de texto na OS | Cadastro mínimo na V1 (Sprint 12). Dossiê de RH na V1.1 | 12 e V1.1 |
| Veículos | inexistente | V1, associado a agenda e OS | 12 |
| Tipos de serviço | nome livre + duas categorias | Catálogo `ServiceType` na V1 | 11–13 |
| Ordem de serviço | demo | V1, agregador da operação | 13 |
| Execução | embutida no status da OS | Entidade própria na V1 | 13 |
| Produtos, lotes, unidades, dados regulatórios | produto com saldo, unidade livre, lote opcional no próprio produto | V1 | 14 |
| Movimentação de estoque | demo ligada a OS | V1 | 14 |
| Relatório técnico e fotos | inexistente | V1 | 15 |
| Certificado / atestado | inexistente | V1 | 16 |
| Modelos de documento e PDF oficial | exportação `.demo.txt` | Templates na V1, nas sprints 15 e 16 | 15–16 |
| Contratos | demo | V1, via de recorrência e base do financeiro | 17 |
| Financeiro gerencial | lançamentos fictícios | V1, sem fiscal | 17 |
| Licitações | demo | V1 | 19 |
| Documentos e licenças | demo de compliance | V1. Licenças da organização precisam existir antes do certificado | 16 e 18 |
| Alertas transversais | alertas locais de documento, proposta, OS e estoque | Um mecanismo só na V1 | 18 |
| Dashboard | executivo derivado da massa demo | Dashboard operacional na V1 | 18 |
| Relatórios gerenciais | cinco relatórios com exportação fictícia | V1, sem BI externo | 19 |
| Aplicativo de campo, PWA, GPS, câmera | fora | fora do escopo atual | — |
| NF-e, folha, contabilidade, ERP fiscal | fora | fora do escopo atual | — |
| Portal do cliente | fora | fora do escopo atual | — |
| Manutenção completa de frota | fora | fora do escopo atual | — |
| WhatsApp como canal do sistema | link manual no site | integração profunda fora do escopo atual | — |
| Google Calendar | inexistente | futuro, só como integração | — |

## Prioridade

1. Fluxo mestre, da proposta aceita até o histórico do cliente.
2. Cadastros que esse fluxo exige: cliente, serviço, equipe, veículo, produto, licença.
3. Financeiro gerencial e contratos.
4. Alertas e dashboard operacional.
5. Licitações e relatórios gerenciais.
6. CRM de produção (lead e Kanban), só depois do fluxo mestre persistido.

## Domínios confirmados que o demo ainda não tem

Relatório técnico/fotográfico, certificado/atestado, colaborador, veículo, produto regulatório, lote como entidade, unidade de medida controlada, RBAC real, alerta transversal e auditoria.

Nenhum deles ganha tela nesta sprint.
