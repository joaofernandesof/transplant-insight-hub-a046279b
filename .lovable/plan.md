

## Alterar formato de data nos cards de HotLeads

Trocar o formato de data de "Chegou em 09 de fev" para "09/02/2025" (dd/MM/yyyy) nos dois componentes de card.

### Arquivos afetados
- `src/components/hotleads/AvailableLeadCard.tsx` - alterar formato de `"dd 'de' MMM"` para `"dd/MM/yyyy"`
- `src/components/hotleads/AcquiredLeadCard.tsx` - mesma alteracao

### Mudanca
Onde esta:
```typescript
format(new Date(lead.created_at), "dd 'de' MMM", { locale: ptBR })
```
Trocar por:
```typescript
format(new Date(lead.created_at), "dd/MM/yyyy")
```

E o texto do label muda de `Chegou em {arrivalDate}` para apenas `{arrivalDate}`.

