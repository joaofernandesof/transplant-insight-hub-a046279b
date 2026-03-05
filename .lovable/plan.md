

# Adicionar Modo de Atendimento ao Wizard Simplificado

## Problema
O `StepAttendanceMode` (seletor Humanizado/Chatbot/Híbrido + editor de botões) só existe no wizard completo (`AvivarConfigWizard.tsx`, step 13). O wizard simplificado (`AvivarSimpleWizard.tsx`) usado em `/avivar/config/new` não inclui essa etapa.

## Solução
Adicionar uma nova etapa "Modo de Atendimento" no wizard simplificado, **após o step de Fluxo** (step 3) e **antes do FAQ** (step 4).

## Alterações

### 1. `AvivarSimpleWizard.tsx`
- Importar `StepAttendanceMode` de `../components/steps/StepAttendanceMode`
- Adicionar `{ id: 'attendance', title: 'Modo IA', description: 'Chatbot ou humanizado' }` no array `SIMPLE_STEPS` na posição 4 (após fluxo)
- Adicionar `case 4` no `renderStepContent` renderizando `StepAttendanceMode` com `config.attendanceMode` e `config.chatbotFlows`
- Ajustar cases subsequentes (FAQ → 5, Knowledge → 6, Review → 7)
- Incluir `attendance_mode` e `chatbot_flows` no payload de save/update do agente

O wizard simplificado passará de 7 para 8 etapas.

