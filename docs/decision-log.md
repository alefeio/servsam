# Decision log

| Data | Decisão | Motivo | Reversível? |
| --- | --- | --- | --- |
| 2026-08-28 | Next.js 16 + App Router + `src/` | Pedido da Sprint 1 e workspace vazio | Sim, com custo de migração |
| 2026-08-28 | npm | Único gerenciador estável no ambiente | Sim |
| 2026-08-28 | Sem banco/Prisma | Validar UX antes de modelar persistência | Sim |
| 2026-08-28 | shadcn base-nova | Design system inicial com Tailwind v4 | Sim |
| 2026-08-28 | IBM Plex Sans | Aparência técnica e legível, sem visual de dedetizadora genérica | Sim |
| 2026-08-28 | Paleta navy + teal | Direção visual da estratégia | Sim |
| 2026-08-28 | Sessão demo em localStorage | Simples e suficiente para o shell | Sim |
| 2026-08-28 | Catch-all para módulos planejados | Evitar rotas 404 nas sprints futuras | Sim |
| 2026-08-28 | Homologação noindex | Ambiente ainda não é produção | Sim |
| 2026-08-28 | Mobile de campo só em docs/future | Fora do contrato desta etapa | Sim, como épica própria |
| 2026-08-28 | Massa demo estática + métricas derivadas | Sprint 2: coerência entre indicadores e fixtures | Sim |
| 2026-08-28 | Gráficos com barras CSS (sem Recharts) | Uso real de charts, mas sem nova dependência no MVP | Sim |
| 2026-08-28 | Logos horizontal e vertical em `public/brand/` | Arquivos oficiais enviados pelo cliente antes da Sprint 3 | Sim |
| 2026-08-28 | Scripts `dev:clean` / `start:fresh` e guarda de build | Evitar CSS quebrado por cache `.next` compartilhado entre dev e produção | Sim |
| 2026-08-28 | CRM demo com localStorage por entidade | Sprint 3: fluxo comercial navegável sem API | Sim |
| 2026-08-28 | OS administrativa sem superfície de campo | Sprint 4: agenda/checklist só para planejamento desktop | Sim |
| 2026-08-28 | Dois perfis fictícios no login demo | Sprint 5: Direção e Compliance com mesma senha visível | Sim |
| 2026-08-28 | Alertas 90/60/30 derivados de datas fixas | Sprint 5: compliance demonstrativo sem certificação real | Sim |
| 2026-08-28 | Exportações .demo.txt em relatórios | Sprint 7: simular PDF/Excel sem libs fiscais | Sim |
| 2026-08-28 | MVP Sprints 1–7 como aceite único | Consolidação com roteiro e production-pending | Sim |
| 2026-10-22 | Fluxo mestre cliente → histórico como eixo da V1 | Briefing da Sprint 8. CRM demo permanece, com prioridade menor | Sim, com custo de replanejar sprints |
| 2026-10-22 | Cliente agrega relacionamento; OS agrega operação | Rastreio de proposta, agenda, execução, relatório, certificado e financeiro | Sim |
| 2026-10-22 | RBAC User / Role / Permission | Quatro perfis do cliente são semente, não enum rígido. Demo Direção/Compliance não é essa lista | Sim |
| 2026-10-22 | Sem Prisma na Sprint 8 | Arquitetura antes da fundação de produção (Sprint 9) | Não se antecipar |
| 2026-10-22 | Agenda SERVSAM é a fonte da verdade | Google Calendar só como integração futura | Sim |
| 2026-10-22 | Financeiro V1 gerencial | Receber, parcelas, pagamentos e despesa básica. Sem NF-e nem contabilidade | Sim |
| 2026-10-22 | Fila de produção nas Sprints 9 a 20 | Ordem do briefing, do banco ao hardening | Sim, com as dependências em `docs/architecture/v1/scope.md` |
| 2026-10-22 | Better Auth para a sessão de `/sistema` | `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` já existiam. Cadastro público desligado | Sim |
| 2026-10-22 | Runtime em `RUNTIME_DATABASE_URL` e migration/seed em `POSTGRES_URL` | Mesma divisão do projeto de referência. `DATABASE_URL` e `PRISMA_DATABASE_URL` ficam no ambiente e o código não as lê | Sim |
| 2026-10-22 | Permissões pontilhadas no lugar das chaves grossas da Sprint 8 | A matriz continua a fonte. Cada ação vira chave (`customer.view`). Células inferidas permanecem marcadas no seed | Sim |
| 2026-10-22 | Diretoria não perde `user.manage`, `role.manage` e `audit.view` | Salvaguarda para a administração não ficar sem dono. Não autoriza módulo de negócio pelo nome do papel | Sim |
| 2026-10-22 | APIMG documentada e sem cliente de upload nesta sprint | As variáveis já existem. O uso real começa na execução da OS e no relatório fotográfico, depois da aprovação visual | Sim |
| 2026-10-22 | Sprint 10 vira validação visual em `/demonstracao` | Alterar tela agora é mais barato do que alterar schema, migration, API e auditoria depois. A fundação da Sprint 9 permanece. A fila 10–20 da Sprint 8 não foi renumerada e fica congelada até o cliente aprovar organização, campos e fluxo | Sim, quando o cliente aprovar |
| 2026-10-22 | Home pública fala de operação, não de software | O visitante vê execução, proposta e documentação. OS, relatório e certificado aparecem como entrega do serviço, quando aplicáveis. Cases e licenças continuam pendentes | Sim, depois da validação do cliente |
| 2026-10-23 | Sprint 10.1 permanece só na demonstração | Os documentos do cliente revelaram formalização, famílias de OS, pré-serviço, avaliação e tipos de atestado. Isso entra em fixture para a reunião. Não vira schema, catálogo público nem regra fechada | Sim, quando o cliente responder |
