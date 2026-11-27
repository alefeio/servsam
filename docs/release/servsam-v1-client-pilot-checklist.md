# Roteiro de homologação — SERVSAM (piloto)

Este guia é para a equipe da SERVSAM validar o sistema em homologação.

**Importante:** tudo o que você fizer aqui é **homologação**. Não é operação financeira real, não emite nota fiscal verdadeira e não movimenta conta bancária.

Use sempre nomes de teste, por exemplo começando com `[PILOTO]` ou `[HOMOL]`. Não cadastre clientes reais nem dados pessoais sensíveis desnecessários.

---

## Antes de começar

1. Você recebeu um **link de acesso** (ambiente de homologação).
2. Pode ser necessário entrar primeiro na proteção da Vercel (e-mail convidado).
3. Em seguida, entre com seu **usuário e senha** do sistema SERVSAM.
4. Se esquecer a senha, use **Esqueci minha senha** na tela de login (desde que o e-mail esteja configurado).

---

## O que você vai validar

### 1. Entrar no sistema

- Abra o link.
- Faça login.
- Confirme que chega ao painel inicial.

### 2. Cadastrar cliente fictício

- Vá em **Clientes** → **Novo cliente**.
- Cadastre um cliente de teste (nome inventado).
- Salve e confira se ele aparece na lista.

### 3. Criar orçamento

- Vá em **Orçamentos** → **Novo orçamento**.
- Vincule o cliente de teste.
- Inclua um serviço fictício e um valor de teste.
- Salve o rascunho.

### 4. Registrar aceite

- Marque o orçamento como enviado.
- Registre o aceite do cliente (simulado).

### 5. Gerar contratação

- Gere a contratação a partir do orçamento aceito.
- Confira número, cliente e valor.

### 6. Registrar O.C. (cenário próprio)

- Se o seu perfil permitir, registre uma ordem de compra de teste **em um cenário separado**.
- Não misture com dados reais.

### 7. Emitir OS

- Na contratação, emita uma ordem de serviço de teste.
- Confira se a OS aparece na lista.

### 8. Cadastrar colaborador

- Vá em **Colaboradores**.
- Cadastre um colaborador fictício (somente se o seu perfil permitir).
- Use cargo/função de teste.

### 9. Agendar e remarcar serviço

- Na OS, agende um horário de teste.
- Confira na **Agenda**.
- Remarque para outro horário e confira de novo.

### 10. Solicitar providências fiscais

- Na contratação, solicite providências de nota.
- Deixe claro nas observações que é **simulação**.
- Isso **não** emite nota fiscal de verdade.

### 11. Informar recebimento fictício

- Informe um recebimento de teste (por exemplo, um sinal).
- Isso apenas envia para conferência do Financeiro.
- **Não** é pagamento bancário real.

### 12. Conferir no perfil Financeiro

- Com o perfil Financeiro (ou quem tiver essa permissão), abra **Financeiro**.
- Confira a solicitação e o recebimento.
- Se autorizado, confirme, rejeite ou reverta **somente** os lançamentos de teste.
- Não trate a confirmação como comprovante bancário.

### 13. Registrar sugestões e problemas

Anote em um canal combinado com a equipe:

- O que funcionou bem.
- O que ficou confuso.
- Erros, telas lentas ou permissões faltando.
- Sugestões de melhoria (sem urgência de implementação imediata).

---

## O que ainda não faz parte deste piloto

- RH completo.
- Gestão financeira completa (além do fluxo básico de solicitação fiscal e recebimento manual).
- Recorrência automatizada de serviços.
- Emissão fiscal real (NF-e / prefeitura / integrações externas).
- WhatsApp, e-mail comercial automatizado ou ERP.
- App mobile de campo / offline.

---

## Encerramento

Ao terminar a sessão:

1. Não apague dados sem orientação da equipe técnica.
2. Avise se precisar de mais acesso ou de outro perfil.
3. Guarde dúvidas e evidências (prints sem senhas) para a reunião de alinhamento.
