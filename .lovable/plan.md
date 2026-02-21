
# Correcao: Duracao da Consulta Nao Atualiza na Agenda

## Problema

Ao alterar a duracao da consulta de 30 para 20 minutos nas configuracoes e salvar, a agenda continua mostrando slots de 30 minutos.

## Causa Raiz

Ha dois problemas no `onSuccess` do `saveConfigMutation` em `AvivarAgendaSettings.tsx` (linhas 375-388):

1. **Query key incompativel**: O cache e invalidado com a chave `['avivar-schedule-config', agendaId, accountId]`, mas o hook `useAvivarScheduleConfig` usa `['avivar-schedule-config', agendaId, user?.authUserId]`. Como `accountId` e `authUserId` sao valores diferentes, a invalidacao nunca atinge o cache correto que a pagina da agenda consulta.

2. **`refetchType: 'none'`**: Mesmo que a chave fosse correta, `refetchType: 'none'` impede o refetch automatico. O `setQueryData` acima so atualiza o campo `id`, sem incluir o novo `consultation_duration`.

## Correcao

No `onSuccess` do `saveConfigMutation`, alterar para:

1. Usar `setQueryData` que atualiza TODOS os campos da config (nao so o `id`)
2. Invalidar usando `user.authUserId` em vez de `accountId` para alinhar com o query key real
3. Remover `refetchType: 'none'` para permitir refetch automatico
4. Tambem invalidar `avivar-schedule-hours` com refetch ativo

### Arquivo: `src/pages/avivar/AvivarAgendaSettings.tsx`

Linhas 375-388, trocar o `onSuccess`:

```text
// ANTES:
onSuccess: (configId) => {
  setConfig(prev => ({ ...prev, id: configId! }));
  toast.success('Configuracoes salvas com sucesso!');
  const agendaId = selectedAgenda?.id || null;
  queryClient.setQueryData(
    ['avivar-schedule-config', agendaId, accountId],
    (old: any) => old ? { ...old, id: configId } : { ... }
  );
  queryClient.invalidateQueries({ queryKey: ['avivar-schedule-config', agendaId, accountId], refetchType: 'none' });
  queryClient.invalidateQueries({ queryKey: ['avivar-schedule-hours', configId], refetchType: 'none' });
}

// DEPOIS:
onSuccess: (configId) => {
  setConfig(prev => ({ ...prev, id: configId! }));
  toast.success('Configuracoes salvas com sucesso!');
  const agendaId = selectedAgenda?.id || null;
  // Invalidate with the correct key (authUserId, not accountId)
  queryClient.invalidateQueries({ queryKey: ['avivar-schedule-config'] });
  queryClient.invalidateQueries({ queryKey: ['avivar-schedule-hours'] });
}
```

Usar invalidacao ampla (sem especificar todo o key) garante que qualquer variacao da query seja atualizada. O `refetchType` default (`'active'`) garante refetch automatico.

## Arquivo Modificado

- `src/pages/avivar/AvivarAgendaSettings.tsx` - corrigir invalidacao de cache no onSuccess

## Impacto

- Ao salvar configuracoes (duracao, intervalo, etc.), a agenda atualizara imediatamente os time slots
- Nenhuma mudanca no banco de dados - o problema e apenas de cache do React Query
