

# Problema: Menu de Opções não visível ao expandir um passo

## Diagnóstico

O componente `FluxoMenuEditor` **já está sendo renderizado** dentro de cada passo expandido (linha 676 do `StepFluxoSimple.tsx`). Porém, ele aparece **no final** do conteúdo expandido, abaixo da instrução, exemplo de mensagem e botões de mídia. O problema é de **visibilidade/UX**:

1. A seção "Menu de Opções" com o botão "+ Opção" é pequena e fica escondida abaixo de todo o conteúdo — o usuário precisa rolar para baixo dentro do passo expandido
2. Quando o passo está em modo de edição (com Save/Cancel), o espaço fica ainda mais apertado e empurra o menu editor para fora da tela
3. O label "Menu de Opções" não é suficientemente chamativo para o usuário perceber que existe essa funcionalidade

## Solução

Tornar o acesso ao Menu de Opções mais visível e intuitivo:

### 1. Adicionar botão "Menu de Opções" ao lado de "Adicionar exemplo" e "Anexar mídia"
- Na seção de botões de ação do passo (onde ficam "Adicionar exemplo" e "Anexar mídia"), adicionar um terceiro botão **"Menu de Opções"** com ícone de `GitBranch`
- O botão só aparece quando o passo **não tem** `menuOptions` ainda (ou tem array vazio)
- Ao clicar, adiciona automaticamente a primeira opção vazia no menu e rola para a seção do editor

### 2. Destacar visualmente a seção FluxoMenuEditor quando tem opções
- Quando o passo já possui `menuOptions`, mostrar um `Badge` "Menu" no header do passo (ao lado do badge "Exemplo" existente) para indicar que há ramificação configurada
- Mover o `FluxoMenuEditor` para uma posição mais proeminente, logo após a instrução (antes do exemplo de mensagem)

### Arquivos a alterar
- **`StepFluxoSimple.tsx`**: Adicionar botão "Menu de Opções" junto aos botões de ação, badge no header, e reposicionar o `FluxoMenuEditor` para ficar logo abaixo da instrução da IA (antes do exemplo de mensagem)

