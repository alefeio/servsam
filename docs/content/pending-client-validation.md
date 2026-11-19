# Pendências de validação do cliente

Itens que podem aparecer na homologação, mas não devem ser publicados como definitivos sem confirmação.

1. Redação institucional final e proposta comercial.
2. Fotografias autorizadas (equipe, base, serviços e segmentos).
3. Horário de atendimento, inclusive plantão ou sábado.
4. Endereço de correspondência e ponto de atendimento.
5. WhatsApp e telefone oficiais vigentes.
6. E-mail corporativo versus Gmail atual.
7. Instagram @servsam.belem como canal oficial.
8. Razão social SERVISAM e uso público do CNPJ.
9. Ano de abertura 2014 em materiais institucionais.
10. Descrições técnicas de cada serviço.
11. Segmentos prioritários e mensagens por público.
12. Documentos, números, validades e selos das certificações informadas.
13. Cases reais autorizados, sem logotipos de terceiros.
14. Política de privacidade e bases legais LGPD.
15. Integração real de orçamento (e-mail, WhatsApp Business ou CRM).

## Validação operacional trazida na Sprint 8

Estes itens entraram no briefing da arquitetura. Ainda não são cadastro verificado e não devem aparecer no site público como fato.

16. Lista de veículos (exemplos citados: F1, F2, F3, Saveiro, Kombi): confirmar se está completa e quais dados oficiais levar.
17. Papéis Administrativo, Gerência, Financeiro e Diretoria, inclusive o que "processos" significa para o Administrativo.
18. Quem pode administrar usuários e papéis.
19. Aceite da proposta: só o cliente, ou também uma alçada interna.
20. Quais serviços exigem NR-33, NR-35, relatório técnico e certificado.
21. Modelo oficial de PDF do relatório (até 6 fotos por página) e do certificado, mais a máscara da numeração.
22. Quem assina o relatório no desktop e como a assinatura é coletada.
23. "Negociações" do financeiro: confirmar se é renegociação de parcelas.
24. Gatilho de alerta de pós-venda.
25. Profundidade de RH na primeira versão (ASO e NR para escalar versus advertência, EPI e histórico completo).

## Revisão da home pública em 22/10/2026

O site institucional não deve vender o sistema interno. Estas respostas ainda faltam antes da publicação definitiva:

26. ETE e retrolavagem devem aparecer comercialmente como serviços no site? Hoje não estão no catálogo oficial e não foram adicionados.
27. Quais serviços devem ter maior destaque na home? A seleção atual é higienização de caixas d'água, higienização de poço, análise da qualidade da água, tratamento de água (ETA), sanitização e desratização.
28. Quais clientes podem ser apresentados como cases reais?
29. Há autorização para utilizar nomes e logos desses clientes?
30. Quais licenças e documentos podem ser exibidos publicamente?
31. Quais deles possuem número e validade?
32. Todo serviço gera relatório?
33. Quais serviços geram certificado ou atestado?
34. O formulário final deverá enviar o orçamento para qual canal?
35. O acesso ao sistema deve aparecer no site público final? O link "Acessar demonstração" permanece no rodapé só enquanto durar a validação com o cliente.
36. "Coleta de água" e "CIP" devem virar nomes públicos, ou permanecem análise da água e os serviços de pragas já catalogados?

## Reunião após a Sprint 10.1

A demonstração foi ajustada para perguntar. Nenhuma resposta abaixo está fechada. Confirmar com o cliente: padrão final será 4 ou 6 fotos por página?

37. Após aprovação da proposta, quais documentos realmente liberam o agendamento?
38. A SERVSAM aceita proposta assinada, OS, OC e OCS?
39. Existe outra forma de formalização?
40. Cada família de serviço deve possuir sua própria OS/checklist?
41. Os campos mostrados na nova execução representam corretamente RSV?
42. Representam corretamente CIP?
43. Representam corretamente coleta?
44. Representam corretamente ETE?
45. Retrolavagem/monitoramento pertence a qual módulo/família?
46. Uma OS pode possuir várias visitas?
47. Contratos geram visitas recorrentes automaticamente?
48. A avaliação Excelente/Bom/Razoável/Pouco razoável deve continuar?
49. Desejam acrescentar comentário do cliente?
50. O relatório final deve manter 4 fotos por página ou mudar para 6?
51. Quais serviços geram relatório técnico?
52. Quais geram relatório fotográfico?
53. Quais geram atestado?
54. Quais geram certificado?
55. Quais validades são calculadas por serviço?
56. Quem pode assinar cada documento?
57. Responsáveis técnicos devem ser vinculados por serviço?
58. "Processos" significa processos ambientais como Outorga?
59. Outorga deve fazer parte da V1?
60. Esgotamento de resíduos/fossa entra no catálogo principal?
61. Retrolavagem entra no catálogo principal?
62. Quais documentos pré-serviço são obrigatórios?
63. Quais documentos devem ser enviados automaticamente ao cliente?
64. Veículos possuem identificação interna como F1/F2/F3?
65. Quais são os veículos ativos?
66. Quais documentos reais podem ser usados como modelo oficial no futuro?

## Feedback oficial 19/11/2026 (homologação 11A)

Fonte consolidada: `docs/sprints/sprint-11a-client-feedback-2026-11-19.md`.  
Itens abaixo estavam abertos na Sprint 10.2 / operação; status atualizado.

### Confirmados

67. **Sinal obrigatório antes da OS?** Não em todos os casos. Recomendado em serviços avulsos. A ausência **não** bloqueia universalmente a emissão da OS.  
68. **Exceções / tratamento do sinal:** Comercial solicita nota/trâmite ao Financeiro; o **Financeiro** confirma o recebimento quando aplicável. Três eventos: aceite comercial → solicitação ao Financeiro → confirmação financeira. Sem confirmação automática e sem presumir 50%.  
73. **Tratamento financeiro do sinal:** solicitação administrativa/fiscal + confirmação pelo Financeiro (não pelo Comercial). Detalhe de parcela vs adiantamento no ERP financeiro permanece **pendente** no inventário financeiro.  
74. **O.C.:** documento **recebido** do contratante quando já há contratação/proposta fechada; **não** exclusiva de contrato periódico; distinta de Orçamento SERVSAM e de OS. Pode haver contratação com O.C. sem orçamento interno prévio obrigatório.  
75. **OS:** cada serviço possui uma OS. O.C. **não** substitui OS.  
76. **Agenda:** sem Google Calendar; permitir alterar data/hora com persistência; responsável e histórico de remarcações; inconsistências de data/status impedidas; conflitos explícitos sem inventar bloqueio rígido; drag-and-drop **não** obrigatório.

### Ainda pendentes (operação / documentos)

69. A O.C. de contrato periódico deve gerar uma OS individual por visita? *(parcialmente cruzado com 75 — cada serviço tem OS; visitas físicas do mesmo serviço = OS separadas?)*  
70. Se não gerar OS por visita, como execução e entregável vinculam-se à visita?  
71. Indicadores de conversão de orçamento (emitido → aceito → contratado) estão corretos?  
72. Profundidade de RH (férias, faltas, atestados, advertências…) na V1 ou depois?  
77. Visitas físicas distintas de um único serviço exigem documentos OS separados?  
78. Política fina de conflito de equipe/horário (só alerta vs bloqueio).  
79. Interpretação de “Empresas” no financeiro (multiempresa?).  
80. Prioridade das fases do inventário financeiro (AP/AR, conciliação, Open Finance, NF).

### Hipóteses superadas (não usar no desenho)

- Sinal sempre obrigatório.  
- Comercial confirma recebimento do pagamento.  
- O.C. somente em contrato periódico.  
- O.C. substitui OS.  
- Agendamento sem possibilidade de alteração.
