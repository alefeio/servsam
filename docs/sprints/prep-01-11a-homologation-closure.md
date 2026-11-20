# PREP-01 — Fechamento da homologação 11A

**Branch:** `prep/prep-01-next-presentation`  
**Base:** `hotfix/homol-access-01-password-recovery` (`c6aa5d5`)  
**Data:** 2026-11-20

## Critério de classificação

| Classe | Significado |
| --- | --- |
| **Evidência visual** | Relato do responsável (Diretoria) de ter inspecionado a tela |
| **Automatizado** | lint / unit / integration HOMOL / e2e preview / Gate F |
| **Manual com persistência** | Fluxo humano + F5 / logout-login / 2ª sessão comprovados |
| **Pendente** | Sem evidência suficiente nesta data |

## Matriz do checklist 11A

| Item | Classe | Evidência / risco |
| --- | --- | --- |
| Vercel Authentication + login `/sistema` | Evidência visual + ACCESS-01 | Responsável entrou com Diretoria; proteção permanece ativa |
| Menu Clientes / Orçamentos / Usuários / Perfis | Evidência visual | Inspeção relatada; e2e cobre Clientes/Orçamentos e Usuários (seed) |
| Recuperação de senha ACCESS-01 | Automatizado + evidência visual | Fluxo implementado; conta provisionada; recebimento/redefinição pelo responsável (fora do chat) |
| Cadastro cliente / contato / unidade | Automatizado | e2e `sistema-core` + Gate F + integration; **não** declarar inspeção manual do cliente como “manual com persistência” além do relato de navegação |
| Criar/editar orçamento + total | Automatizado | Mesmas suítes; estados aceito/enviado cobertos em integration |
| Arquivar cliente / contato / unidade | Automatizado (parcial) | Integration cobre archive/restore; UI agora exige confirmação (PREP-01) — **sem** roteiro manual formal assinado |
| Persistência F5 / logout-login / 2ª sessão | Automatizado | e2e preview PASS na 11A |
| Negação de permissão | Automatizado | Gate F + integration |
| Aceite formal do checklist pelo cliente externo | Pendente | Checklist ainda com caixas abertas para preenchimento do cliente |

## Riscos

1. Massa HOMOL ainda dominada por `[E2E]` / `[GATEF]` — métricas do Painel misturam resíduos de teste.  
2. Sem massa “apresentação” limpa até autorização de limpeza + cadastro dedicado.  
3. Demo 10.2 ainda diverge do feedback 19/11 (sinal/O.C.) — não usar como verdade de produto sem hotfix.  
4. Permissões futuras visíveis em Perfis (agora agrupadas e marcadas) podem confundir se não explicadas.

## Veredito 11A para apresentação

**Tecnicamente homologada** (automatizado + isolamento HOMOL + acesso Diretoria).  
**Comercialmente pronta para mostrar núcleo Clientes/Orçamentos** após limpeza/cadastro de apresentação autorizado.  
**Não** iniciar 11B sem decisão explícita.
