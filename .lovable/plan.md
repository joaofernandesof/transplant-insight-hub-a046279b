

# Remover Etapa de Imagens do Wizard de Configuração do Agente

## O que muda

Remover a etapa 7 ("Imagens") dos dois wizards de configuração do agente Avivar:
1. **Wizard Simplificado** (`AvivarSimpleWizard.tsx`) — passa de 8 para 7 etapas
2. **Wizard Completo** (`AvivarConfigWizard.tsx`) — remove step 10 ("Imagens")

As imagens continuarão sendo gerenciadas via FAQ (Perguntas e Respostas com mídia), que é mais intuitivo e dá à IA melhor contexto para decidir qual imagem enviar.

## Alterações

### 1. `AvivarSimpleWizard.tsx`
- Remover import de `StepImagesSimple`
- Remover `{ id: 'images', ... }` do array `SIMPLE_STEPS` (fica com 7 etapas)
- Remover `case 6` (StepImagesSimple) do `renderStepContent`
- Ajustar `case 7` (review) para `case 6`
- Remover validação de imagens do `canProceed()` (case 6)
- Remover referência a `EMPTY_IMAGE_GALLERY` no import se não usado em outro lugar
- Remover `image_gallery` e `before_after_images` do payload de save/update (linhas ~177 e ~441)

### 2. `AvivarConfigWizard.tsx`
- Remover import de `StepImages`
- Remover `case 10` (StepImages) do switch de renderização
- Remover validação de imagens do `canProceed()` (case 10)
- Ajustar numeração dos cases subsequentes (11→10, 12→11, etc.)

### 3. `types.ts`
- Remover `{ id: 'images', ... }` do array `WIZARD_STEPS`

### 4. Componentes de steps
- Não precisa deletar os arquivos `StepImagesSimple.tsx` e `StepImages.tsx` (podem ficar como código morto), mas remover dos exports em `index.ts`

### 5. `StepReviewSimple.tsx`
- Remover seção que mostra resumo de imagens na revisão (se existir)

### 6. Migration SQL — Limpar image_gallery das contas existentes
- `UPDATE avivar_agents SET image_gallery = '{}', before_after_images = '[]' WHERE account_id != 'b0317d67-fda3-46dd-8dbc-c69bf3821938';`
- Isso garante que contas existentes não tenham dados órfãos de imagem (exceto Karine)

## Impacto
- O wizard simplificado fica com 7 etapas (ao invés de 8)
- O wizard completo perde 1 etapa
- A funcionalidade de envio de imagens pela IA **continua funcionando** via FAQ/Knowledge Base (sistema de mídia já implementado)
- Nenhuma lógica de backend de envio de imagens é afetada

