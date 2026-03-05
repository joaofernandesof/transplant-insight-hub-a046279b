

# Por que a IA não envia o Menu de Opções na primeira mensagem

## Diagnóstico

O backend (`avivar-ai-agent/index.ts`) **corretamente** injeta as opções do menu no prompt do Passo 1. O problema é de **conflito de instruções no prompt**:

1. **Regra "UM PASSO POR VEZ"** (linha 4065): diz para executar apenas um passo por resposta e aguardar resposta do lead
2. **Descrição do Passo 1**: "Cumprimente o lead... e pergunte o nome" — a IA interpreta isso como o conteúdo principal
3. **Menu diz "AGUARDE a escolha"** — a IA entende que deve primeiro perguntar o nome, e só depois apresentar o menu

A IA resolve o conflito fazendo a saudação + pergunta do nome, e "guarda" o menu para a próxima interação. Resultado: o lead recebe apenas "Olá! Eu sou a Iza... Como posso te chamar?" sem o menu.

## Solução

Alterar a função `buildMenuInstructions` no backend para adicionar uma instrução explícita de que **o menu FAZ PARTE do passo atual e DEVE ser apresentado na mesma resposta**.

### Alteração em `supabase/functions/avivar-ai-agent/index.ts`

Na função `buildMenuInstructions` (linhas 4115-4155):

1. Adicionar no início do menu text: **"OBRIGATÓRIO: Apresente este menu NA MESMA MENSAGEM deste passo. O menu é parte integrante deste passo, NÃO é um passo separado."**
2. Alterar "AGUARDE a escolha do lead antes de prosseguir" para: **"Após apresentar o menu, AGUARDE a escolha do lead. NÃO avance para o próximo passo até o lead escolher."**

Isso elimina a ambiguidade: a IA entende que o menu é conteúdo obrigatório do passo, não algo para "depois".

### Alteração secundária na regra "UM PASSO POR VEZ" (linhas 4065-4074)

Adicionar uma exceção: **"Se o passo tiver um MENU DE OPÇÕES, o menu DEVE ser apresentado junto com o texto do passo — ambos são parte do mesmo passo."**

