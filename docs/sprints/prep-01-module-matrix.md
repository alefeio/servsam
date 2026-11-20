# PREP-01 — Matriz de módulos

| Módulo | Classificação | Onde | Observação |
| --- | --- | --- | --- |
| Site institucional | REAL (conteúdo) | `/` | Público |
| Login `/sistema` + RBAC | REAL | `/sistema` | Better Auth + HOMOL |
| Recuperação de senha | REAL | `/sistema/esqueci-senha` | Resend HOMOL |
| Clientes / contatos / unidades | REAL | `/sistema/clientes` | Prisma |
| Orçamentos + estados | REAL | `/sistema/orcamentos` | Prisma |
| Painel indicadores | REAL | `/sistema` | Orçado ≠ faturado |
| Usuários / Perfis | REAL | `/sistema/configuracoes` | Permissões futuras marcadas |
| CRM leads Kanban demo | DEMO | `/demonstracao` | fixture/localStorage |
| OS / agenda / sinal (narrativa antiga) | DEMO (desatualizada) | `/demonstracao` | Corrigir em hotfix 10.2 |
| Contratação / OS / agenda persistente | PLANEJADO | 11B | Contrato técnico pronto |
| O.C. / contratos / recorrência | PLANEJADO | 11C | |
| FIN-F0 confirmação recebimento | PLANEJADO | com 11B | |
| FIN-F1+ AP/AR/DRE/Open Finance | PLANEJADO / escopo expandido | Financeiro | |
| NF-e / banco / WhatsApp real | BLOQUEADO | — | Até sprint/contrato |
| Production com dados reais de clientes | BLOQUEADO | — | |
| Mobile de campo / PWA | BLOQUEADO | — | Fora da V1 desktop |
| Google Calendar como fonte da verdade | BLOQUEADO | — | |
