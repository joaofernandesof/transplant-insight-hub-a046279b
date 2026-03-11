

## Problem

The lunch field (`Almoço`) uses `onChange` to call `handleFieldSave` on **every keystroke**. This triggers a database update and shows the "Cirurgia atualizada!" toast for each character typed, making it impossible to type freely.

Other fields like `companionName`, `grade`, etc. use an `EditableField` component that likely handles this with a local state + save-on-blur pattern. But the lunch field was added as a raw `<Input>` with direct `onChange` → save.

## Fix

In `src/clinic/components/SurgeryDetailDialog.tsx`:

1. **Replace the raw `<Input>` with the existing `EditableField` component** that other fields already use (companionName, companionPhone, grade, etc.). This component manages local state internally and only saves on blur/enter, preventing the per-keystroke save issue.

```tsx
// Replace raw Input with:
<EditableField
  label="🍱 Almoço"
  value={surgery.lunchChoice || ''}
  field="lunchChoice"
  onSave={handleFieldSave}
  placeholder="Ex: Normal, Vegetariano..."
/>
```

This matches the pattern used by all other text fields in the dialog and eliminates the repeated save/toast issue.

