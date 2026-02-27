

## Refatorar etapa FAQ: manual em vez de geração automática

### Mudanças no `StepFAQGenerator.tsx`
1. **Remover** toda a lógica de geração automática (`handleGenerate`, `isGenerating`, chamada ao edge function `avivar-generate-faq`)
2. **Substituir** o card de geração automática por um botão "Adicionar Pergunta e Resposta" que ao clicar abre os campos de pergunta + resposta inline
3. **Novas perguntas sempre no topo** da lista (`onFAQChange([newItem, ...generatedFAQ])`)
4. **Paginação interna** de 10 itens por página (estado local `currentPage`), com controles Anterior/Próxima sem mudar de etapa do wizard
5. **Atualizar textos**: subtítulo para "Crie as perguntas e respostas mais comuns do seu negócio", remover badge "Etapa opcional", remover botão "Copiar para Base de Conhecimento"
6. Manter funcionalidade de editar e excluir itens existentes

### Arquivo afetado
- `src/pages/avivar/config/components/steps/simple/StepFAQGenerator.tsx` — reescrita do componente

