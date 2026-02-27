

## Bug: Passos Cronológicos desaparecem ao avançar da etapa 3 para 4 com objetivo secundário

### Causa raiz

Condição de corrida entre dois `useEffect` no `StepFluxoSimple.tsx`:

1. **Effect 1** (linha 191, dep: `objectives.primary`): Carrega o template com `passosCronologicos` e chama `onChange(template)`.
2. **Effect 2** (linha 214, dep: `objectives.secondary`): Lê `fluxoAtendimento` (ainda vazio, pois o `onChange` do Effect 1 não propagou ainda) e chama `onChange({...fluxoAtendimento, passosExtras: updatedExtras})` — sobrescrevendo `passosCronologicos` com `[]`.

Resultado: Effect 2 anula Effect 1. Quando o usuário volta e avança, Effect 1 roda novamente (pois `passosCronologicos` está vazio), mas Effect 2 não dispara (deps não mudaram), então funciona.

### Correção

Unificar a lógica: o Effect 2 deve **não executar** na montagem inicial quando o template ainda não foi carregado. Usar um `ref` para rastrear se o template já foi aplicado.

### Mudanças

**Arquivo:** `src/pages/avivar/config/components/steps/simple/StepFluxoSimple.tsx`

1. Adicionar `const templateLoadedRef = useRef(false)` para rastrear se o Effect 1 já executou.
2. No **Effect 1** (linha 191-211): após `onChange(template)`, setar `templateLoadedRef.current = true`. Também resetar o ref no cleanup ou quando `objectives.primary` mudar.
3. No **Effect 2** (linha 214-262): adicionar guarda `if (!templateLoadedRef.current) return;` no início — impedindo que execute antes do template ser carregado, eliminando a condição de corrida.

