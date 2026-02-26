

## Plano: Remover Etapa "Serviços" do Wizard Avivar

A etapa 2 (index 2, "O que você oferece?") será removida do wizard simplificado, reduzindo de 10 para 9 etapas. Os serviços/produtos passam a ser configurados via FAQ e Base de Conhecimento.

### Alterações

**1. `src/pages/avivar/config/AvivarSimpleWizard.tsx`**
- Remover `StepServicesOnly` do import
- Remover `{ id: 'services', ... }` do array `SIMPLE_STEPS` (10 → 9 etapas)
- Remover `case 2` (StepServicesOnly) do `renderStep()` e reindexar cases 3→2, 4→3, 5→4, 6→5, 7→6, 8→7, 9→8
- Remover `case 2` do `canProceed()` e reindexar
- Ajustar referência ao step FAQ (`currentStep === 6` → `currentStep === 5`) na lógica do botão Próximo
- Remover `services` das props passadas ao `StepFAQGenerator` (se necessário)

**2. `src/pages/avivar/config/components/steps/simple/index.ts`**
- Remover export do `StepServicesOnly`

**3. `src/pages/avivar/config/types.ts`**
- Remover entrada "Serviços" do array `WIZARD_STEPS` legado (se existir)

**4. Dados existentes**
- Coluna `avivar_agents.services` permanece no banco — sem exclusão de dados
- Agentes já criados mantêm seus serviços salvos, apenas não são mais editáveis via wizard

