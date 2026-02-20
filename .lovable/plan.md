

# Webhook Unico por Instancia UazAPI

## Problema Confirmado

Todas as instancias criadas recebem o mesmo webhook:
```
https://.../functions/v1/uazapi-webhook
```

Sem nenhum parametro diferenciador. Quando duas instancias existem na mesma instalacao UazAPI, as mensagens podem ser roteadas para a instancia errada.

## Solucao

Adicionar o `instance_token` como query parameter na URL do webhook, tornando cada URL unica:

```
https://.../functions/v1/uazapi-webhook?token=TOKEN_DA_INSTANCIA
```

## Mudancas

### 1. Edge Function `avivar-uazapi/index.ts`

Alterar os 3 locais onde o webhook e configurado para incluir o token na URL:

- **Linha ~114 (criacao)**: Mudar de `${supabaseUrl}/functions/v1/uazapi-webhook` para `${supabaseUrl}/functions/v1/uazapi-webhook?token=${data.instance.token}`
- **Linha ~422 (auto-config)**: Mesmo padrao, usando o token da instancia ja salvo
- **Linha ~600 (config manual)**: Mesmo padrao

### 2. Edge Function `uazapi-webhook/index.ts`

No inicio do handler, extrair o token da URL e usar como filtro primario para resolver a instancia:

```typescript
const url = new URL(req.url);
const urlToken = url.searchParams.get("token");
```

Se `urlToken` estiver presente, buscar a instancia diretamente por `instance_token` ao inves de depender do `instanceName` no payload:

```typescript
if (urlToken) {
  const { data } = await supabase
    .from('avivar_uazapi_instances')
    .select('id, user_id, instance_id, instance_name, instance_token, phone_number, status, account_id')
    .eq('instance_token', urlToken)
    .single();
}
```

Se o token nao estiver na URL (retrocompatibilidade com instancias antigas), manter o fallback pelo `instanceName` do payload.

### 3. Instancias ja existentes

Instancias criadas antes dessa correcao continuarao funcionando pelo fallback de `instanceName`. Para corrigir instancias existentes, o usuario pode desconectar e reconectar (o que reconfigurar o webhook automaticamente com o token na URL).

## Resultado

- Cada instancia tera um webhook unico identificado pelo token
- Impossivel confundir mensagens entre instancias
- Retrocompativel com instancias antigas
