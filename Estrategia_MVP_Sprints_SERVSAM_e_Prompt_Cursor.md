> **Histórico (28/08/2026).** Planejamento e prompt da Sprint 1. As Sprints 1 a 7 foram concluídas no demo. A especificação viva está em `docs/architecture/v1/` e o backlog em `docs/product-backlog.md`. Não usar este arquivo como instrução da sprint ativa.

# Estratégia do MVP SERVSAM em sprints

## Site institucional + sistema integrado demonstrável, sem fluxo mobile de campo

**Responsável pela execução:** Alexandre Feio  
**Data de planejamento:** 28 de agosto de 2026  
**Base:** briefing técnico da SERVSAM, site atual, fontes públicas e informações demonstrativas identificadas

---

## 1. Decisão de escopo

O MVP desta etapa será uma aplicação web demonstrável, construída de forma incremental e com dados estáticos. Ele terá duas frentes integradas:

1. **Site institucional público**, responsivo e orientado à solicitação de orçamento.
2. **Sistema interno demonstrativo**, desktop-first, com fluxos comerciais, operacionais e gerenciais.

### Exclusão desta etapa

O fluxo mobile da equipe de campo está completamente fora deste MVP. Portanto, não serão implementados agora:

- tela "Minha agenda" para técnico;
- início e conclusão de serviço pelo celular;
- captura ou upload de fotos em campo;
- assinatura do cliente;
- registro mobile de materiais;
- geolocalização;
- funcionamento offline ou PWA de campo;
- perfil operacional mobile;
- qualquer automação dependente dessa jornada.

O site público continuará responsivo. O sistema interno deverá funcionar adequadamente em desktop e tablet, mas não será desenhado como ferramenta de execução em campo.

O módulo mobile será mantido como **épica futura independente**, sujeito a descoberta, validação e orçamento próprios depois que o fluxo desktop de ordens de serviço for aprovado.

---

## 2. Estratégia de construção

### Princípio central

Construir primeiro a experiência, a linguagem do produto e os fluxos essenciais. Banco de dados, integrações e regras definitivas só entram após a validação da operação real.

### Modelo técnico desta fase

- monólito modular em Next.js com App Router;
- TypeScript em modo estrito;
- Tailwind CSS e shadcn/ui;
- componentes organizados por domínio;
- dados institucionais e demonstrativos em arquivos TypeScript;
- persistência simulada com estado do navegador ou localStorage somente quando necessária ao fluxo;
- nenhuma API externa;
- nenhum banco de dados;
- nenhum dado real de clientes, colaboradores, contratos ou documentos;
- camada de repositórios/interfaces para permitir troca futura por API;
- homologação separada da produção;
- Git, documentação e testes desde a Sprint 1.

### Por que não usar banco agora

O briefing prevê que regras reais, permissões, integrações e modelagem definitiva serão levantadas nas fases posteriores. Criar Prisma/PostgreSQL antes dessa validação aumentaria o custo e poderia consolidar premissas erradas. Nesta etapa, a persistência simulada é suficiente para validar navegação, estados, terminologia e sequência operacional.

---

## 3. Governança das informações

Toda informação inserida no projeto deve receber uma classificação de origem:

| Classificação | Uso |
| --- | --- |
| VERIFIED_CURRENT_SITE | Informação encontrada no site atual da SERVSAM. |
| VERIFIED_PUBLIC_RECORD | Informação encontrada em fonte pública identificável. |
| BRIEFING_REQUIREMENT | Requisito ou direcionamento do briefing fornecido pelo cliente. |
| DEMO_FICTIONAL | Dado inventado exclusivamente para demonstrar telas e fluxos. |
| PENDING_CLIENT_VALIDATION | Informação plausível, mas que depende de confirmação documental ou comercial. |

### Regras obrigatórias

- Dados fictícios nunca podem ser apresentados como resultado real da SERVSAM.
- Dashboards, listas e cases fictícios devem exibir "Dados demonstrativos".
- Clientes fictícios devem usar nomes claramente inventados e um identificador DEMO.
- Não usar logotipos de clientes reais sem autorização.
- Não inventar quantidade de clientes, faturamento, avaliações, economia ou índices de satisfação.
- Certificações informadas no site atual devem ser registradas como pendentes de validação documental antes de publicação definitiva.
- Imagens não devem ser copiadas ou vinculadas diretamente de terceiros. Utilizar arquivos autorizados fornecidos pelo cliente ou placeholders descritivos.

---

## 4. Conteúdo público disponível

### Informações verificadas no site atual

Fonte principal: [servsam.com.br](https://servsam.com.br/)

- Marca: SERVSAM - Serviços de Saneamento e Meio Ambiente.
- Posicionamento atual: empresa nacional que nasceu no Pará.
- Propósito declarado: atuar em saneamento e meio ambiente, prevenindo doenças, promovendo qualidade de vida e desenvolvimento da sociedade.
- Equipe apresentada como qualificada e treinada nas normas dos órgãos de fiscalização e controle.
- Treinamentos mencionados: espaços confinados, trabalho em altura, energia elétrica e controle de pragas.
- Horário: 8h às 18h, de segunda a sexta-feira.
- Endereço: Travessa Barão de Mamoré, 161, Guamá, Belém/PA.
- Telefones: (91) 98054-5097 e (91) 3274-2960.
- E-mail encontrado na página de contato: servsam.adm@gmail.com.
- Instagram encontrado em busca pública: [@servsam.belem](https://www.instagram.com/servsam.belem/).

### Serviços verificados no site atual

**Água e saneamento**

1. Higienização de poço tubular.
2. Perfuração e construção de poço tubular.
3. Higienização de caixas d'água.
4. Desinfecção de reservatórios.
5. Análise da qualidade da água.
6. Tratamento de água - ETA.

**Controle ambiental e de pragas**

7. Sanitização de ambientes.
8. Desratização.
9. Descupinização.
10. Desinsetização.

### Certificações informadas no site atual

- Vigilância Sanitária;
- Corpo de Bombeiros;
- Prefeitura de Belém;
- SEMAS;
- ANVISA;
- CREA.

Esses itens podem aparecer na homologação com o estado "Informado no site atual - documentação pendente de validação". Não exibir número, validade, selo oficial ou link documental sem o material fornecido pela SERVSAM.

### Informações públicas complementares

Fontes: [Portal da Transparência](https://portaldatransparencia.gov.br/licitacoes/398193037/pessoa-juridica/21332050000146) e registros empresariais públicos.

- Razão social: SERVISAM - Serviços de Saneamento e Meio Ambiente Ltda.
- Nome fantasia: SERVSAM - Serviços de Saneamento e Meio Ambiente.
- CNPJ: 21.332.050/0001-46.
- Abertura: 30/10/2014.
- Situação cadastral: ativa.
- Atividades públicas relacionadas: saneamento, gestão e atividades relacionadas a esgoto, perfuração de poços e controle de pragas.

O ano de 2014 pode ser usado como informação pública, mas deve entrar na lista de validação do cliente antes da publicação definitiva.

### Conteúdo que será fictício na demonstração

- empresas e pessoas cadastradas;
- oportunidades e propostas;
- valores comerciais;
- ordens de serviço;
- contratos;
- documentos e validades;
- estoque;
- faturamento e recebimentos;
- alertas;
- produtividade;
- casos demonstrativos;
- gráficos e indicadores.

---

## 5. Arquitetura de informação

### Rotas públicas

- /
- /sobre
- /servicos
- /servicos/[slug]
- /segmentos
- /experiencia
- /licencas-certificacoes
- /conteudos
- /contato
- /privacidade

### Rotas do sistema demonstrativo

- /demonstracao/login
- /demonstracao
- /demonstracao/comercial
- /demonstracao/comercial/leads
- /demonstracao/comercial/oportunidades
- /demonstracao/comercial/propostas
- /demonstracao/clientes
- /demonstracao/agenda
- /demonstracao/ordens-servico
- /demonstracao/contratos
- /demonstracao/licitacoes
- /demonstracao/estoque
- /demonstracao/financeiro
- /demonstracao/documentos
- /demonstracao/relatorios
- /demonstracao/configuracoes

As rotas serão ativadas progressivamente. Uma rota de sprint futura nunca deve ficar quebrada: até ser implementada, deverá apresentar um estado planejado e informar em qual sprint será entregue.

---

## 6. Roadmap em sprints

### Cadência

- Sprints 1 a 6: dez dias úteis cada.
- Sprint 7: cinco a oito dias úteis.
- Demonstração e aceite ao fim de cada sprint.
- Apenas uma sprint em andamento.
- Mudanças de escopo entram no backlog e não interrompem automaticamente a sprint atual.

### Sprint 1 - Fundação, conteúdo e experiência-base

**Objetivo:** criar a base técnica e visual, publicar o núcleo do site institucional e entregar o acesso inicial ao sistema demonstrativo.

**Entregas:**

- auditoria do repositório ou criação do projeto;
- regras persistentes para o Cursor;
- design system inicial;
- inventário de conteúdo com fontes e pendências;
- Home;
- Sobre;
- Serviços e páginas por slug;
- Segmentos;
- Experiência/cases demonstrativos;
- Licenças e certificações;
- Conteúdos;
- Contato;
- página provisória de privacidade;
- login demonstrativo;
- shell do sistema com sidebar e cabeçalho;
- dashboard inicial reduzido com dados explicitamente demonstrativos;
- placeholders planejados das próximas rotas;
- testes, build e documentação;
- backlog das Sprints 2 a 7.

**Critérios de aceite:**

- todas as rotas públicas abrem sem erro;
- navegação e CTAs funcionam;
- conteúdo real e fictício são distinguíveis;
- site público funciona em 360 px, 768 px e 1280 px;
- sistema funciona adequadamente a partir de 1024 px;
- login demonstrativo abre o shell;
- nenhuma funcionalidade mobile de campo foi criada;
- lint, typecheck, testes e build passam;
- relatório da sprint registra entregas, pendências e decisões.

### Sprint 2 - Massa demonstrativa e dashboard executivo

**Objetivo:** criar um modelo de dados estático coerente e uma visão executiva capaz de contar a história da operação.

**Entregas:**

- entidades e relacionamentos demonstrativos;
- 10 a 15 clientes fictícios;
- 20 a 30 oportunidades;
- propostas relacionadas;
- 15 a 20 ordens de serviço desktop;
- 5 a 8 contratos;
- 6 a 10 documentos;
- 10 a 15 produtos;
- transações financeiras demonstrativas;
- validação automática da coerência entre referências;
- cards, funil, receita, categorias, agenda e alertas;
- filtro de período demonstrativo;
- ação "Restaurar dados demonstrativos".

**Critérios:** nenhum indicador contraditório; métricas derivadas dos fixtures; banner de demonstração visível.

### Sprint 3 - CRM, clientes e propostas

**Objetivo:** demonstrar o fluxo comercial do lead até a aprovação da proposta.

**Entregas:**

- lista de leads e filtros;
- kanban de oportunidades;
- ficha de oportunidade;
- histórico e próxima ação;
- cadastro e detalhe de cliente;
- múltiplas unidades;
- proposta com itens, quantidade, valor, validade e status;
- ações simuladas de qualificar, avançar, aprovar, perder e reabrir;
- persistência local e restauração dos dados.

**Critérios:** o usuário consegue realizar uma narrativa comercial completa sem páginas quebradas.

### Sprint 4 - Agenda e ordens de serviço desktop

**Objetivo:** converter proposta aprovada em agendamento e ordem de serviço administrativa.

**Entregas:**

- agenda semanal e mensal;
- criação de agendamento a partir de proposta;
- OS com cliente, local, serviço, horário, equipe, materiais previstos e observações;
- status administrativos;
- checklist visual apenas para planejamento/validação em desktop;
- histórico da OS;
- conclusão simulada pela gestão;
- atualização dos indicadores.

**Exclusões reforçadas:** nenhuma tela de técnico, captura de foto, assinatura, execução mobile, geolocalização ou modo offline.

### Sprint 5 - Contratos e documentos/compliance

**Objetivo:** demonstrar recorrência, governança e controle de vencimentos.

**Entregas:**

- contratos com vigência, periodicidade, valor e status;
- cronograma de atendimentos previstos;
- alertas de renovação e reajuste;
- documentos com emissão, validade e responsável;
- alertas de 90, 60 e 30 dias;
- relacionamento entre cliente, contrato, documento e OS;
- receita recorrente demonstrativa.

### Sprint 6 - Licitações, estoque e financeiro gerencial

**Objetivo:** completar a visão integrada da empresa.

**Entregas:**

- oportunidades públicas e estágios;
- checklist documental de licitação;
- datas críticas e anexos simulados;
- produtos, materiais, saldo, mínimo e validade;
- movimentações fictícias vinculadas a OS;
- faturamento, recebimentos, valores em aberto e atraso;
- filtros por cliente, serviço e período;
- integração conceitual entre proposta, OS e financeiro.

### Sprint 7 - Relatórios, configurações, qualidade e apresentação

**Objetivo:** consolidar a demonstração, a documentação e o aceite do MVP.

**Entregas:**

- relatórios e indicadores finais;
- representação dos perfis de acesso;
- configurações demonstrativas;
- botões de PDF/Excel identificados como demonstrativos;
- revisão de acessibilidade;
- revisão de SEO;
- revisão responsiva do site público;
- testes de regressão;
- otimização de desempenho;
- documentação de arquitetura;
- inventário final de telas;
- lista de pendências para produção;
- roteiro de apresentação de 10 a 15 minutos;
- gravação curta opcional.

---

## 7. Épica futura - Mobile da equipe de campo

Esta épica não deve entrar nos arquivos de sprint ativa. Deve permanecer em docs/future/mobile-field-epic.md com status FUTURE / NOT CONTRACTED.

Ela deverá passar por descoberta própria para definir:

- usuários e dispositivos;
- conectividade em campo;
- funcionamento offline;
- captura e compressão de fotos;
- assinatura;
- geolocalização;
- checklists por serviço;
- consumo de materiais;
- segurança e LGPD;
- sincronização;
- evidências e relatórios;
- critérios de aceite;
- preço e cronograma.

---

## 8. Impacto comercial da retirada do mobile

Na composição anterior, a jornada mobile demonstrativa representava R$ 2.600 do orçamento de R$ 29.800. Caso o preço ainda não tenha sido apresentado ao cliente, o valor coerente para este MVP sem mobile é:

> **R$ 27.200,00**

O módulo mobile futuro não deve ser prometido pelo mesmo valor de R$ 2.600. Esse montante correspondia apenas à representação simplificada dentro do protótipo. Quando contratado separadamente, seu preço deverá considerar descoberta, experiência real de campo, câmera, assinatura, conectividade, segurança, testes em dispositivos e eventual funcionamento offline.

---

## 9. Prompt completo para o Cursor - Sprint 1

Copiar integralmente o conteúdo abaixo para o Cursor, preferencialmente com o briefing PDF disponível no workspace.

~~~~text
Você atuará como Tech Lead, Product Engineer e responsável pela execução da Sprint 1 do MVP demonstrável da SERVSAM.

CONTEXTO DO PRODUTO

A SERVSAM - Serviços de Saneamento e Meio Ambiente é uma empresa paraense que atua com água, saneamento, serviços ambientais e controle de pragas. O projeto possui duas experiências integradas:

1. site institucional público, voltado a posicionamento, confiança e solicitação de orçamento;
2. sistema interno demonstrativo, voltado a gestão comercial, operacional e gerencial.

Esta etapa valida arquitetura de informação, interface, terminologia, navegação e fluxos. Não é o sistema definitivo.

MISSÃO DESTA EXECUÇÃO

Implemente somente a Sprint 1:

- fundação técnica;
- design system inicial;
- inventário e governança de conteúdo;
- núcleo completo do site institucional;
- login demonstrativo;
- shell do sistema;
- dashboard inicial reduzido;
- documentação e backlog das Sprints 2 a 7.

Não implemente antecipadamente as demais sprints.

ANTES DE ALTERAR QUALQUER ARQUIVO

1. Inspecione o workspace inteiro.
2. Leia AGENTS.md, README, package.json, arquivos de configuração, documentação e regras do Cursor existentes.
3. Verifique o estado do Git e preserve todas as alterações do usuário.
4. Identifique o gerenciador de pacotes pelo lockfile e mantenha-o.
5. Mapeie a arquitetura atual, comandos disponíveis, testes e convenções.
6. Se o projeto já existir, adapte a solução ao padrão encontrado.
7. Se o workspace estiver vazio, inicialize um projeto Next.js 16 com App Router, TypeScript estrito, Tailwind CSS v4 e src/.
8. Não use comandos destrutivos, não apague trabalho existente, não reescreva histórico e não faça migration.
9. Registre em docs/sprints/sprint-01-audit.md o que encontrou e as decisões tomadas.

ESCOPO NEGATIVO OBRIGATÓRIO

Não desenvolver:

- fluxo mobile de técnico de campo;
- tela "Minha agenda" mobile;
- câmera ou upload de evidências em campo;
- assinatura de cliente;
- registro mobile de materiais;
- geolocalização;
- modo offline ou PWA de campo;
- banco de dados;
- Prisma;
- migrations;
- backend separado;
- endpoints reais;
- autenticação de produção;
- RBAC de segurança real;
- integrações com WhatsApp, e-mail, banco, ERP, emissão fiscal, mapas ou portais públicos;
- migração ou uso de dados reais;
- publicação em produção;
- funcionalidades das Sprints 2 a 7.

O site público deve ser responsivo. O sistema interno é desktop-first e deve funcionar adequadamente a partir de 1024 px. Não crie a experiência operacional mobile.

STACK E REGRAS TÉCNICAS

- Next.js 16, App Router.
- React e TypeScript com strict true.
- Tailwind CSS v4.
- shadcn/ui para componentes-base.
- Lucide React para ícones.
- Zod para validação de estruturas de conteúdo e formulários.
- next/font para tipografia.
- ESLint e Prettier.
- Vitest e Testing Library para testes unitários/componentes.
- Playwright para smoke tests, se a infraestrutura permitir.
- Não instalar TanStack Query, Zustand, Recharts ou outras dependências antes de haver uso real.
- Não usar any.
- Não colocar regra de negócio diretamente em páginas ou componentes de apresentação.
- Não executar fetch direto em páginas/componentes. Nesta sprint, os dados vêm de repositórios estáticos.
- Preferir Server Components; usar Client Components somente para interação real.
- Manter componentes pequenos, semânticos, acessíveis e reutilizáveis.
- Usar nomes de código em inglês e conteúdo de interface em português do Brasil.

ARQUITETURA DESEJADA

Adapte ao repositório existente. Se ele estiver vazio, use uma estrutura equivalente a:

src/
  app/
    (public)/
    (demo)/
  components/
    ui/
    layout/
  features/
    institutional/
    demo-auth/
    dashboard/
  data/
    official/
    demo/
  lib/
    content/
    repositories/
    utils/
  types/
docs/
  architecture/
  content/
  sprints/
  future/

Crie uma fronteira clara entre:

- conteúdo verificado;
- requisitos do briefing;
- dados fictícios;
- interface;
- repositórios estáticos;
- futuras implementações de API.

GOVERNANÇA DE DADOS

Crie tipos equivalentes a:

SourceType =
  | VERIFIED_CURRENT_SITE
  | VERIFIED_PUBLIC_RECORD
  | BRIEFING_REQUIREMENT
  | DEMO_FICTIONAL
  | PENDING_CLIENT_VALIDATION

Todo conteúdo relevante deve possuir metadados de origem:

- sourceType;
- sourceUrl quando existir;
- accessedAt;
- isFictional;
- needsClientValidation;
- notes opcional.

Crie docs/content/content-inventory.md com uma tabela contendo:

- campo/conteúdo;
- valor usado;
- origem;
- URL;
- classificação;
- onde aparece;
- precisa de validação?;
- observação.

REGRAS SOBRE CONTEÚDO

1. Nunca apresente dado fictício como resultado real.
2. Todo dashboard e case fictício deve mostrar "Dados demonstrativos".
3. Não invente clientes reais, avaliações, faturamento, economia, quantidade de atendimentos ou índices de satisfação.
4. Não use logotipos de terceiros.
5. Não copie ou faça hotlink de imagens encontradas na internet.
6. Se não houver imagem autorizada no repositório, crie um componente de placeholder visual elegante, com descrição do tipo de fotografia necessária.
7. Certificações podem ser listadas, mas precisam receber o estado "Informado no site atual - documentação pendente de validação".
8. Conteúdo provisório precisa estar centralizado nos arquivos de dados, nunca espalhado pelo JSX.

CONTEÚDO VERIFICADO A UTILIZAR

Marca:
SERVSAM - Serviços de Saneamento e Meio Ambiente.

Proposta-base:
"Soluções técnicas em saneamento, água e controle de pragas."

Texto institucional-base:
"A SERVSAM é uma empresa nacional que nasceu no Pará e atua em serviços relacionados a saneamento e meio ambiente, contribuindo para a prevenção de doenças, a qualidade de vida e o desenvolvimento da sociedade."

Equipe:
"Profissionais qualificados e treinados nas normas exigidas pelos órgãos de fiscalização e controle."

Treinamentos informados:
- espaços confinados;
- trabalho em altura;
- energia elétrica;
- controle de pragas.

Contato:
- horário: 8h às 18h, de segunda a sexta-feira;
- endereço: Travessa Barão de Mamoré, 161, Guamá, Belém/PA;
- telefone/WhatsApp: (91) 98054-5097;
- telefone: (91) 3274-2960;
- e-mail: servsam.adm@gmail.com;
- Instagram: https://www.instagram.com/servsam.belem/.

Dados públicos:
- razão social: SERVISAM - Serviços de Saneamento e Meio Ambiente Ltda.;
- nome fantasia: SERVSAM - Serviços de Saneamento e Meio Ambiente;
- CNPJ: 21.332.050/0001-46;
- abertura: 30/10/2014;
- situação: ativa.

Fontes:
- https://servsam.com.br/
- https://servsam.com.br/contato/
- https://www.instagram.com/servsam.belem/
- https://portaldatransparencia.gov.br/licitacoes/398193037/pessoa-juridica/21332050000146

SERVIÇOS

Categoria Água e saneamento:

1. Higienização de poço tubular.
Descrição provisória: limpeza técnica destinada a preservar as condições de funcionamento e higiene do poço.

2. Perfuração e construção de poço tubular.
Descrição provisória: implantação de solução de captação de água conforme condições técnicas e ambientais do local.

3. Higienização de caixas d'água.
Descrição provisória: limpeza e higienização programada de reservatórios, com organização de data e horário.

4. Desinfecção de reservatórios.
Descrição provisória: serviço técnico de higienização e desinfecção, com atenção às condições do reservatório.

5. Análise da qualidade da água.
Descrição provisória: avaliação da água destinada ao uso e consumo, conforme o tipo de análise contratado.

6. Tratamento de água - ETA.
Descrição provisória: soluções relacionadas ao tratamento da água para adequação à finalidade de uso.

Categoria Controle ambiental e de pragas:

7. Sanitização de ambientes.
Descrição provisória: tratamento de ambientes voltado à redução de agentes que prejudicam a higiene e a qualidade do espaço.

8. Desratização.
Descrição provisória: identificação, controle e prevenção de ocorrência de roedores.

9. Descupinização.
Descrição provisória: tratamento por barreira química, madeiramento, conduítes ou aplicação localizada, conforme diagnóstico.

10. Desinsetização.
Descrição provisória: controle de insetos e prevenção de proliferação no ambiente.

CERTIFICAÇÕES INFORMADAS NO SITE ATUAL

- Vigilância Sanitária;
- Corpo de Bombeiros;
- Prefeitura de Belém;
- SEMAS;
- ANVISA;
- CREA.

Não invente números, validade, links ou selos. Marque todos como pendentes de validação documental.

SEGMENTOS DEFINIDOS NO BRIEFING

- condomínios;
- empresas;
- restaurantes;
- escolas;
- clínicas;
- indústrias;
- setor público.

CASES DEMONSTRATIVOS FICTÍCIOS

Crie três cases estruturais, sempre com selo visível "Caso demonstrativo fictício":

1. Condomínio Rio Guamá - higienização programada de reservatórios.
2. Clínica Horizonte Amazônia - plano preventivo de controle de pragas.
3. Indústria Porto Verde - organização de serviços recorrentes de saneamento.

Não atribua resultados numéricos. O objetivo é demonstrar o layout que depois receberá cases autorizados.

CONTEÚDOS DEMONSTRATIVOS

Crie cards editoriais, marcados como conteúdo demonstrativo:

- Quando revisar a higienização de caixas d'água?
- Sinais que indicam necessidade de controle de cupins.
- Por que acompanhar a qualidade da água?

Não escreva recomendações sanitárias definitivas nem periodicidades legais sem fonte oficial. Use apenas resumo editorial provisório.

ROTAS PÚBLICAS DA SPRINT 1

- /
- /sobre
- /servicos
- /servicos/[slug]
- /segmentos
- /experiencia
- /licencas-certificacoes
- /conteudos
- /contato
- /privacidade

HOME

Implemente:

1. Hero:
   - eyebrow: "Saneamento, água e controle ambiental";
   - H1: "Soluções técnicas para ambientes mais seguros e operações mais confiáveis.";
   - subtítulo institucional;
   - CTA primário "Solicitar orçamento";
   - CTA secundário "Conhecer serviços".

2. Categorias de serviço.
3. Bloco "Por que escolher a SERVSAM?" baseado apenas em:
   - origem paraense;
   - atuação técnica;
   - equipe treinada;
   - variedade de serviços;
   - atendimento a diferentes segmentos.
4. Segmentos atendidos.
5. Processo comercial demonstrativo:
   - entender a necessidade;
   - avaliar o serviço;
   - apresentar proposta;
   - programar atendimento.
6. Cases fictícios claramente marcados.
7. Certificações informadas, com aviso de validação.
8. CTA final e contato.

Não crie contadores de clientes, anos, avaliações ou resultados sem origem.

DIREÇÃO VISUAL

- aparência técnica, corporativa e confiável;
- evitar visual genérico de dedetizadora;
- base em azul profundo, teal/verde e neutros claros;
- tipografia moderna e muito legível;
- espaços generosos;
- ícones técnicos simples;
- contraste acessível;
- sem carrossel automático;
- sem animações excessivas;
- fotos reais somente se forem fornecidas e autorizadas;
- placeholders elegantes quando faltarem fotos;
- mobile-first apenas para o site público.

LOGIN E SISTEMA DEMONSTRATIVO

Crie:

- /demonstracao/login;
- credenciais claramente demonstrativas;
- sessão local simples, sem promessa de segurança de produção;
- opção de entrar como Direção;
- /demonstracao com sidebar, cabeçalho, breadcrumb e área principal;
- banner permanente "Ambiente demonstrativo - dados fictícios";
- botão "Sair da demonstração";
- botão "Restaurar dados demonstrativos".

Credencial sugerida:
- e-mail: direcao@demo.servsam.local
- senha: servsam-demo

Não use essa senha como segredo. Ela deve existir apenas como fixture de demonstração e aparecer na própria tela.

DASHBOARD INICIAL REDUZIDO

Crie um preview visual, sem implementar a Sprint 2 completa:

- faturamento demonstrativo do mês;
- propostas em aberto;
- serviços agendados;
- documentos próximos do vencimento;
- pequeno bloco de próximos serviços;
- pequeno bloco de alertas;
- aviso visível de que os números são fictícios.

Centralize o snapshot em src/data/demo. Não espalhe números no JSX. Na Sprint 2, ele será substituído por métricas derivadas de uma massa coerente.

MENU DO SISTEMA

Exiba:

- Visão geral;
- Comercial;
- Clientes;
- Agenda;
- Ordens de serviço;
- Contratos;
- Licitações;
- Estoque;
- Financeiro;
- Documentos;
- Relatórios;
- Configurações.

Somente Visão geral será implementada nesta sprint. As demais opções devem abrir uma página planejada com:

- nome do módulo;
- objetivo;
- sprint prevista;
- mensagem "Módulo planejado - ainda não implementado";
- link para voltar.

Não crie telas falsas fingindo que os módulos estão prontos.

FORMULÁRIO DE CONTATO

Campos:

- nome;
- empresa/condomínio;
- telefone;
- e-mail;
- tipo de serviço;
- cidade;
- mensagem;
- consentimento.

Use Zod. O envio será simulado:

- não criar endpoint;
- mostrar feedback de sucesso demonstrativo;
- permitir abrir WhatsApp com mensagem pré-preenchida;
- documentar que o recebimento real será integrado posteriormente.

SEO E ACESSIBILIDADE

- metadata por rota;
- títulos e descrições coerentes;
- sitemap e robots adequados à homologação;
- homologação não deve ser indexada;
- HTML semântico;
- navegação por teclado;
- foco visível;
- labels reais;
- contraste adequado;
- textos alternativos;
- preferência de movimento reduzido;
- heading hierarchy válida.

DOCUMENTAÇÃO OBRIGATÓRIA

Crie ou atualize:

1. README.md
   - propósito;
   - stack;
   - instalação;
   - execução;
   - comandos;
   - credenciais demo;
   - estrutura;
   - limitações.

2. .cursor/rules/servsam-mvp.mdc
   - alwaysApply true;
   - regras de escopo;
   - separação entre dados reais e fictícios;
   - arquitetura;
   - testes;
   - proibição do fluxo mobile nesta fase.

3. docs/content/content-inventory.md
4. docs/content/pending-client-validation.md
5. docs/architecture/overview.md
6. docs/architecture/data-provenance.md
7. docs/product-backlog.md
8. docs/sprints/sprint-01.md
9. docs/sprints/sprint-02.md até sprint-07.md
10. docs/future/mobile-field-epic.md
11. docs/decision-log.md
12. docs/sprints/sprint-01-report.md ao final.

ORGANIZAÇÃO DAS SPRINTS FUTURAS

Nos arquivos de Sprint 2 a 7, registre:

- objetivo;
- valor para o negócio;
- histórias de usuário;
- critérios de aceite;
- dependências;
- dados necessários;
- telas previstas;
- testes previstos;
- riscos;
- itens fora do escopo;
- Definition of Ready;
- Definition of Done;
- status PENDING.

Use este roadmap:

Sprint 2: massa demonstrativa coerente e dashboard executivo.
Sprint 3: CRM, clientes, oportunidades e propostas.
Sprint 4: agenda e ordens de serviço administrativas em desktop.
Sprint 5: contratos e documentos/compliance.
Sprint 6: licitações, estoque e financeiro gerencial.
Sprint 7: relatórios, perfis representados, configurações, QA, SEO, documentação e roteiro de apresentação.

O mobile deve existir apenas em docs/future/mobile-field-epic.md, marcado como FUTURE / NOT CONTRACTED.

TESTES OBRIGATÓRIOS DA SPRINT 1

1. Unitários:
   - classificação de conteúdo;
   - schema dos serviços;
   - metadados de origem;
   - validação do formulário;
   - identificação de dados fictícios.

2. Componentes:
   - banner de dados demonstrativos;
   - cards de serviço;
   - navegação;
   - estado de certificação pendente.

3. Smoke/E2E:
   - Home abre;
   - menu percorre todas as rotas públicas;
   - página de serviço por slug abre;
   - formulário apresenta sucesso simulado;
   - login demo funciona;
   - dashboard abre;
   - rota futura exibe estado planejado;
   - logout funciona.

4. Qualidade:
   - lint;
   - typecheck;
   - testes;
   - build de produção local.

Se algum teste não puder ser executado por limitação do ambiente, registre o comando, o erro e a ação necessária. Não declare que passou sem evidência.

DEFINITION OF DONE DA SPRINT 1

- rotas públicas completas e navegáveis;
- identidade consistente;
- conteúdo centralizado e classificado;
- toda ficção identificada;
- login demonstrativo funcional;
- dashboard inicial reduzido;
- módulos futuros sem links quebrados;
- nenhum fluxo mobile;
- acessibilidade básica validada;
- sem erros de TypeScript;
- lint, testes e build aprovados;
- README e documentação atualizados;
- backlog futuro organizado;
- relatório final produzido.

ORDEM DE EXECUÇÃO

1. Auditoria.
2. Plano curto e registro das decisões.
3. Fundação e regras do projeto.
4. Dados e inventário de conteúdo.
5. Design system.
6. Layout público.
7. Páginas públicas.
8. Formulário e WhatsApp demonstrativo.
9. Login demo.
10. Shell e dashboard inicial.
11. Estados planejados.
12. Testes.
13. Build.
14. Documentação e relatório.

COMPORTAMENTO ESPERADO

- Trabalhe de forma autônoma dentro deste escopo.
- Faça perguntas apenas se houver bloqueio material.
- Não invente campos, integrações ou regras definitivas.
- Não transforme um placeholder em funcionalidade de produção.
- Preserve alterações existentes.
- Não implemente itens de sprint futura só porque parecem rápidos.
- Prefira solução simples, legível e substituível.
- Ao encontrar ambiguidade, registre a suposição e use a opção mais reversível.

RELATÓRIO FINAL

Ao terminar, responda com:

1. resultado da Sprint 1;
2. rotas implementadas;
3. principais arquivos criados/alterados;
4. fontes utilizadas;
5. conteúdos fictícios;
6. pendências de validação do cliente;
7. testes e comandos executados com resultado;
8. limitações conhecidas;
9. confirmação explícita de que o fluxo mobile não foi implementado;
10. recomendação objetiva para iniciar a Sprint 2.

Não finalize enquanto houver erro conhecido de build, TypeScript ou navegação que possa ser corrigido dentro do escopo.
~~~~

---

## 10. Orientação para uso do prompt

1. Abrir no Cursor a pasta raiz do projeto.
2. Colocar o briefing PDF em docs/references/, se possível.
3. Garantir que o Cursor tenha acesso ao terminal e ao repositório.
4. Colar o prompt inteiro em uma nova conversa do Agent.
5. Permitir primeiro a auditoria.
6. Não pedir ao Cursor que execute a Sprint 2 na mesma conversa.
7. Revisar a demonstração da Sprint 1 antes de aprovar o próximo prompt.
8. Guardar o relatório produzido como critério formal de aceite.

---

## 11. Resultado esperado ao fim da Sprint 1

Ao final, Alexandre deverá conseguir:

- apresentar uma nova imagem institucional da SERVSAM;
- navegar pelos serviços e segmentos;
- mostrar onde cases e certificações entrarão;
- receber uma solicitação demonstrativa de orçamento;
- entrar no sistema com credencial de demonstração;
- mostrar o padrão visual do dashboard;
- explicar claramente quais módulos virão depois;
- provar que dados reais e fictícios estão separados;
- iniciar a Sprint 2 sem reestruturar o projeto.

Esse resultado reduz risco técnico e comercial: a direção valida primeiro o posicionamento, a linguagem, o design e a arquitetura geral, antes de investir nos fluxos mais complexos.

