

## Plano: Remover Etapa "Pagamentos" do Wizard Avivar

Mesma abordagem da remoção anterior de Serviços. O wizard passa de 9 para 8 etapas.

### Alterações

**1. `src/pages/avivar/config/AvivarSimpleWizard.tsx`**
- Remover `StepPaymentsSimple` do import
- Remover `PAYMENT_METHODS` do import de types (se não usado em outro lugar)
- Remover `{ id: 'payments', ... }` do `SIMPLE_STEPS` (9 → 8 etapas)
- Remover `case 2` (StepPaymentsSimple) do `renderStep()` e reindexar: 3→2, 4→3, 5→4, 6→5, 7→6, 8→7
- Remover `case 2` do `canProceed()` e reindexar
- Ajustar referência ao step FAQ: `currentStep === 5` → `currentStep === 4`
- Remover `paymentMethods: [...PAYMENT_METHODS]` da inicialização do config (manter default vazio)

**2. `src/pages/avivar/config/components/steps/simple/index.ts`**
- Remover export do `StepPaymentsSimple`

**3. `src/pages/avivar/config/types.ts`**
- Remover entrada "Pagamentos" do `WIZARD_STEPS` legado (se existir)

**4. Dados existentes**
- Coluna `avivar_agents.payment_methods` permanece no banco — sem exclusão de dados
- Os dados de pagamento continuarão sendo passados ao FAQ Generator via `config.paymentMethods` (valores default) para que a IA possa usar se necessário

