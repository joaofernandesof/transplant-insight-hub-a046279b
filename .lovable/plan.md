

## Bug Fix: Race condition between Effects 1 and 2 in StepFluxoSimple

### Root Cause (refined)

Both `useEffect` hooks run in the same render cycle on mount. Effect 1 sets `templateLoadedRef.current = true` **synchronously** before calling `onChange`. Effect 2 then checks the ref (passes), but reads the **stale** `fluxoAtendimento` prop (still empty). The `onChange({...fluxoAtendimento, passosExtras})` in Effect 2 overwrites `passosCronologicos` with `[]`.

### Solution

**Merge both effects into a single effect.** Instead of two separate effects with a ref-based synchronization that doesn't work across the same render cycle, combine the logic:

**File:** `src/pages/avivar/config/components/steps/simple/StepFluxoSimple.tsx`

1. **Remove** the `templateLoadedRef` ref (line 188)
2. **Merge Effects 1 and 2** (lines 192-271) into a single `useEffect` with deps `[objectives.primary, objectives.secondary, objectives.secondaryCustomIds]`:
   - If `fluxoAtendimento.passosCronologicos.length > 0` (existing data), only update `passosExtras` from secondary objectives (don't touch cronológicos)
   - If no existing fluxo, load template from `getFluxoByObjective(objectives.primary)`, then append secondary objective steps to its `passosExtras`, and call `onChange` **once** with the complete result
3. This eliminates the race condition entirely — one `onChange` call with both cronológicos and extras populated

### Key Logic

```typescript
useEffect(() => {
  if (!objectives.primary) return;

  const hasExistingFluxo = fluxoAtendimento?.passosCronologicos?.length > 0;

  if (hasExistingFluxo) {
    // Only update extras from secondary objectives
    // (same logic as old Effect 2, using fluxoAtendimento which is valid here)
    ...
    return;
  }

  // Load fresh template + append secondary steps in one go
  const template = getFluxoByObjective(objectives.primary);
  const secondarySteps = generateSecondarySteps(objectives, template.passosExtras || []);
  template.passosExtras = [...(template.passosExtras || []), ...secondarySteps];
  onChange(template); // Single call with complete data
}, [objectives.primary, objectives.secondary, objectives.secondaryCustomIds]);
```

