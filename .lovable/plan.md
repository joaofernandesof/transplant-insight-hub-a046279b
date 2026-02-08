
# Galeria de Variacao de Midia por Passo do Fluxo

## Problema
Quando a IA envia sempre a mesma midia (mesmo hash de arquivo) para todos os leads em um passo do fluxo, o WhatsApp detecta isso como spam e pode bloquear o numero.

## Solucao
Permitir anexar **multiplas midias** (3-5) por passo do fluxo. No momento do envio, a IA seleciona aleatoriamente uma delas, quebrando o padrao de hash repetido.

## Mudancas

### 1. Atualizar o tipo `FluxoStep` (types.ts)
- Adicionar campo `mediaVariations: FluxoStepMedia[]` ao `FluxoStep`
- Manter o campo `media` existente para compatibilidade (midia unica vira a primeira variacao)

### 2. Atualizar o componente `FluxoStepMediaPicker`
- Transformar de seletor de midia unica para galeria de variacoes
- Exibir lista de midias anexadas com badges (ex: "1/5", "2/5")
- Botao "Adicionar variacao" para anexar mais midias do mesmo tipo
- Limite maximo de 5 variacoes por passo
- Permitir remover variacoes individuais
- Indicador visual: "X variacoes - rotacao anti-spam ativa"

### 3. Atualizar a Edge Function `avivar-ai-agent`
- Na funcao `sendFluxoMedia`: ao encontrar o passo, verificar se existe `mediaVariations`
- Se sim, selecionar uma midia aleatoria do array (`Math.random()`)
- Se nao, usar o campo `media` existente (compatibilidade)
- Log qual variacao foi selecionada

### 4. Atualizar o prompt do sistema
- Nenhuma mudanca necessaria no prompt - a selecao aleatoria acontece no backend, transparente para a IA

## Detalhes Tecnicos

### Tipo atualizado
```text
FluxoStep {
  id: string
  ordem: number
  titulo: string
  descricao: string
  exemploMensagem?: string
  media?: FluxoStepMedia          // legado, compatibilidade
  mediaVariations?: FluxoStepMedia[] // novo: array de variacoes
}
```

### Logica de selecao (Edge Function)
```text
1. Buscar passo pelo step_id
2. Se mediaVariations existe e tem itens:
   -> Selecionar indice aleatorio
   -> Usar mediaVariations[indice]
3. Senao, usar media (comportamento atual)
```

### UI do MediaPicker
```text
Passo: "Enviar video de boas-vindas"
  [Video1.mp4] [Video2.mp4] [Video3.mp4]
  [+ Adicionar variacao] (max 5)
  "3 variacoes - rotacao anti-spam ativa"
```

### Migracao de dados
- Nenhuma migracao de banco necessaria (dados ficam no JSON do `fluxo_atendimento`)
- Agentes existentes com `media` unica continuam funcionando sem mudanca

## Arquivos a modificar
1. `src/pages/avivar/config/types.ts` - Adicionar `mediaVariations` ao `FluxoStep`
2. `src/pages/avivar/config/components/steps/simple/FluxoStepMediaPicker.tsx` - Suportar multiplas midias
3. `supabase/functions/avivar-ai-agent/index.ts` - Selecao aleatoria na funcao `sendFluxoMedia`
