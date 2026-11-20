# Checklist de homologação — Sprint 11A (cliente)

**Objetivo:** validar Clientes e Orçamentos persistentes em `/sistema` no Preview de homologação.  
**Branch:** `sprint-11a-persistent-core` (+ ACCESS-01 / PREP-01 em branches isoladas)  
**Ambiente:** Preview Vercel com autenticação da Vercel (não é site público).  
**Fechamento interno PREP-01:** ver `prep-01-11a-homologation-closure.md` (evidência visual ≠ aceite formal deste checklist).

Não há credenciais neste documento. Contas e senhas ficam no vault / convite individual — nunca na UI pública nem no Git.

Provisionamento interno: `sprint-11a-client-access-runbook.md`.

## O que esta versão cobre

Clientes, contatos, unidades e orçamentos com login real (Better Auth) e PostgreSQL de homologação.

## O que ainda **não** está operacional nesta versão

Ordem de serviço, agenda persistente, O.C., contratos periódicos, RH e financeiro completo **não** fazem parte da Sprint 11A. Podem existir só no demo (`/demonstracao`), sem persistência de produção.

## Sequência simples (9 passos)

1. Entrar com a sua conta (proteção Vercel + login `/sistema`).  
2. Cadastrar um **cliente de teste** (não use dados reais sensíveis desnecessários).  
3. Adicionar um contato.  
4. Adicionar uma unidade.  
5. Criar um orçamento ligado a esse cliente.  
6. Incluir itens, salvar e conferir o total.  
7. Recarregar a página (F5) e confirmar que tudo continua lá.  
8. Sair e entrar novamente; confirmar os mesmos registros.  
9. Anotar observações sobre a experiência (usabilidade, dúvidas, bugs) na seção de aceite.

## Antes de começar

| # | Item | Feito |
| --- | --- | --- |
| A1 | Receber o **link do Preview protegido** da equipe SERVSAM | ☐ |
| A2 | Ter **conta individual autorizada** na proteção Vercel (e-mail convidado) | ☐ |
| A3 | Ter **usuário do sistema** (`/sistema`) com papéis/permissões adequados (não usar senha do demo) | ☐ |
| A4 | Usar navegador desktop (≥ 1024px). Homologação de `/sistema` é desktop-first | ☐ |
| A5 | Confirmar que **não** está em Production (`servsam.vercel.app`) nem em `/demonstracao` | ☐ |

Acesso anônimo ao Preview ou ao banco HOMOL **não** será liberado.

## Roteiro funcional (detalhe)

### 1. Acesso e login

| # | Passo | Esperado | Feito |
| --- | --- | --- | --- |
| 1.1 | Abrir o Preview e passar pela autenticação Vercel com a conta autorizada | Entra no app sem erro de permissão da Vercel | ☐ |
| 1.2 | Ir para `/sistema/login` | Tela “Entrar no sistema”; **sem** textos do demo (`servsam-demo`, e-mails `@demo`) | ☐ |
| 1.3 | Entrar com Better Auth (e-mail/senha do sistema) | Redireciona ao Painel `/sistema` | ☐ |
| 1.4 | Conferir menu | Itens Clientes e Orçamentos conforme o perfil | ☐ |
| 1.5 | Link **Esqueci minha senha** (ACCESS-01) | Abre `/sistema/esqueci-senha`; mensagem genérica; redefinição só com token válido (ver `homol-access-01-password-recovery.md`) | ☐ |

### 2. Cliente, contato e unidade

| # | Passo | Esperado | Feito |
| --- | --- | --- | --- |
| 2.1 | Cadastrar um cliente novo | Aparece na listagem; dados batem com o formulário | ☐ |
| 2.2 | Incluir um contato | Contato visível no detalhe do cliente | ☐ |
| 2.3 | Incluir uma unidade | Unidade visível no detalhe do cliente | ☐ |
| 2.4 | Editar o cliente | Alterações persistem ao reabrir o registro | ☐ |

### 3. Orçamento

| # | Passo | Esperado | Feito |
| --- | --- | --- | --- |
| 3.1 | Criar orçamento ligado ao cliente (e unidade, se couber) | Código `ORC-…`; itens e totais coerentes | ☐ |
| 3.2 | Editar rascunho | Alterações salvas; total recalculado | ☐ |
| 3.3 | (Se o perfil permitir) enviar / aceitar / recusar conforme o fluxo | Transições só com permissão; estados corretos na tela | ☐ |

### 4. Persistência e sessões

| # | Passo | Esperado | Feito |
| --- | --- | --- | --- |
| 4.1 | Recarregar a página (F5) no detalhe do cliente e do orçamento | Dados permanecem (banco, não só memória do navegador) | ☐ |
| 4.2 | Sair (logout) e entrar de novo | Mesmos registros visíveis | ☐ |
| 4.3 | Abrir segunda sessão (outra janela anônima ou outro navegador) com o mesmo usuário | Vê os mesmos dados; sem misturar com `/demonstracao` | ☐ |

### 5. Permissões (dois perfis, se disponíveis)

| # | Passo | Esperado | Feito |
| --- | --- | --- | --- |
| 5.1 | Usuário **com** permissão de criar/editar | Consegue as ações do roteiro | ☐ |
| 5.2 | Usuário **sem** permissão de criar cliente ou orçamento | UI oculta ou bloqueia; servidor recusa a ação | ☐ |
| 5.3 | Confirmar que login do **demo** não abre `/sistema` com dados reais | Experiências separadas | ☐ |

## Fora deste checklist

- Sinal, OS, agenda, contratos, O.C., financeiro e RH (próximas entregas; ver `sprint-11a-contracts-11b-11c.md`)
- Dados em Production
- Acesso público sem login Vercel
- Validação de regras comerciais ainda **pendentes** (obrigatoriedade de sinal, etc.)

## Como registrar o aceite

| Campo | Preenchimento |
| --- | --- |
| Data | |
| Responsável (cliente) | |
| Preview usado (URL, sem senha) | |
| Resultado | ☐ Aprovado · ☐ Aprovado com ressalvas · ☐ Reprovado |
| Ressalvas / bugs | |

Devolver este checklist preenchido à equipe SERVSAM. **Não** colar senhas no e-mail nem em issues públicas.
