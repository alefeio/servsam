# Roteiro — próxima apresentação SERVSAM ao cliente

**Versão:** PREP-01 · 2026-11-20  
**Ambiente sugerido:** Preview `/sistema` (HOMOL) +, se necessário, `/demonstracao` com aviso explícito  
**Dados:** apenas fictícios / teste; sem PII real do cliente

## Objetivo da reunião

1. Confirmar que o núcleo **Clientes + Orçamentos** em `/sistema` atende a operação comercial.  
2. Alinhar o que é **real**, **demo** e **planejado** (11B/11C/Financeiro).  
3. Obter decisões: limpeza/massa de apresentação; autorização 11B; fechamento de pendências (OS por visita, % sinal).

## Público e papéis

| Papel | Interesse |
| --- | --- |
| Diretoria | Visão do fluxo e prioridades |
| Comercial / Gerência | Cadastro, orçamento, aceite |
| Financeiro | Confirmação de recebimento (não opera AP/AR ainda) |
| Operações | OS e agenda (planejado / demo) |

## Jornada comercial e operacional (narrativa)

Cliente → Contato/Unidade → Orçamento → Aceite → **(11B)** Contratação / sinal opcional / OS por serviço / Agenda → **(11C)** O.C. e contratos → Financeiro por fases.

## Três cenários

### A — Serviço avulso

1. Cadastrar cliente fictício + unidade.  
2. Orçamento com itens; enviar; aceitar.  
3. Explicar: sinal **recomendado**, não bloqueio universal; Financeiro confirma (11B/F0).  
4. Demo (se usada): emitir OS **sem** exigir sinal.

### B — Contratação com O.C.

1. Mostrar orçamento aceito **ou** explicar entrada por O.C. externa.  
2. Deixar claro: O.C. é documento do **cliente**; ≠ OS; ≠ orçamento SERVSAM.  
3. 11C registra O.C. completa; 11B pode ter só referência mínima.

### C — Contrato periódico

1. Demo/planejado: vigência e recorrência.  
2. Visitas/OS conforme regra ainda **pendente** (por serviço vs por visita).

## Telas e dados necessários

| Necessário | Estado atual |
| --- | --- |
| Preview protegido + login Diretoria | Disponível (ACCESS-01) |
| Clientes/orçamentos limpos de apresentação | **Falta** — HOMOL só tem resíduos E2E/GATEF |
| Demo 10.2 alinhada ao feedback | **Pendente** hotfix em branch própria |

## O que é real / demo / futuro

Ver `docs/sprints/prep-01-module-matrix.md`.

## Perguntas de validação

1. A ficha de cliente (contatos/unidades) cobre o dia a dia?  
2. Aceitam métricas do Painel como “orçado ≠ faturado”?  
3. Confirmam: sinal opcional; Financeiro confirma?  
4. O.C. avulsa fora de contrato periódico — ok?  
5. Visita física gera OS separada?  
6. Autorizam limpeza dos resíduos e cadastro de massa fictícia?  
7. Autorizam iniciar 11B após esta reunião?

## Plano B

| Falha | Ação |
| --- | --- |
| Preview / Vercel Auth | Conta backup já convidada; URL alternativa da branch |
| Massa suja no HOMOL | Narrar com transparência + mock estático / screenshots |
| Demo desalinhada | Não mostrar fluxo “sinal bloqueia OS”; usar slides das regras confirmadas |
| Queda de rede | Checklist impresso + captura das telas principais |

## Avisos obrigatórios na fala

- “Dados demonstrativos” em `/demonstracao`.  
- `/sistema` = homologação, não Production.  
- Sem NF, banco, WhatsApp real ou mobile de campo nesta fase.
