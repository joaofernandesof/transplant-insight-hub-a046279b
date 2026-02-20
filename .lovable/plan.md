
# Notificacao de Grupo HotLead via Webhook n8n

## Objetivo
Quando um usuario adquirir um lead na pagina HotLeads, enviar um webhook para o n8n com:
- Nome do usuario que adquiriu
- Nome do paciente (lead)
- Cidade e estado do lead

## Webhook destino
`https://n8n-n8n-start.bym1io.easypanel.host/webhook/notificagrupohotlead`

## Mudanca necessaria

### Edge Function `hotleads-acquire/index.ts`

A funcao ja faz o claim do lead e ja envia um webhook para `N8N_HOTLEADS_WEBHOOK_URL`. A mudanca sera:

1. **Buscar o nome do usuario**: A query atual de `neohub_users` so traz `address_state, user_id`. Adicionar `full_name` no select.

2. **Adicionar segundo webhook** (apos o webhook existente): Enviar POST para a URL fixa de notificacao de grupo com o payload:

```json
{
  "usuario_nome": "Nome do licenciado",
  "lead_nome": "Nome do paciente",
  "lead_cidade": "Cidade",
  "lead_estado": "UF"
}
```

3. O webhook sera **non-blocking** (mesmo padrao do existente) -- se falhar, nao impede a aquisicao.

## Detalhes tecnicos

- A URL sera salva como secret `N8N_HOTLEADS_GROUP_WEBHOOK_URL` para facilitar manutencao futura
- A query de `neohub_users` sera alterada de `.select('address_state, user_id')` para `.select('address_state, user_id, full_name')`
- O segundo fetch sera feito em paralelo (nao sequencial) ao webhook existente para nao adicionar latencia
