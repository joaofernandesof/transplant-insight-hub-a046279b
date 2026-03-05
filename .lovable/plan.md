

# Correção: Espaço no teclado causa erro no Menu de Opções

## Problema

O `KeyboardSensor` do `@dnd-kit` (drag-and-drop) intercepta a tecla **espaço** para iniciar o arrasto, mesmo quando o foco está em um `<input>` ou `<textarea>`. Isso impede o usuário de digitar espaços nos campos do Menu de Opções.

## Solução

Modificar o `KeyboardSensor` em `StepFluxoSimple.tsx` para **não ativar** quando o elemento focado for um input, textarea ou contenteditable.

### Alteração em `src/pages/avivar/config/components/steps/simple/StepFluxoSimple.tsx`

Adicionar uma função `shouldHandleEvent` customizada no `KeyboardSensor` que ignora eventos vindos de campos de texto:

```typescript
useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
  keyboardCodes: {
    start: ['Space', 'Enter'],
    cancel: ['Escape'],
    end: ['Space', 'Enter'],
  },
  onActivation: undefined,
})
```

Na prática, a abordagem mais limpa é passar uma função de filtro que retorna `false` quando o `event.target` é um input/textarea:

```typescript
function shouldHandleEvent(element: HTMLElement) {
  const interactiveElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
  return !interactiveElements.includes(element.tagName) && !element.isContentEditable;
}
```

Isso será aplicado apenas ao sensor de teclado, mantendo o drag-and-drop funcional via ponteiro (mouse/touch).

