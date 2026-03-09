

## Situação Atual do Usuário Josélio

**Encontrado no banco:**
- **Nome:** Josélio Alves Sousa
- **Email:** joselio0611@gmail.com
- **user_id (auth):** `3215d2f5-98d7-43ef-af4a-6c266e8cb5db`
- **neohub_user_id:** `1397a323-3980-42d5-93bc-3287ca66a7ce`
- **Perfil:** operador
- **Portais liberados:** `[hotleads]` (apenas HotLeads)
- **Conta Avivar:** Nenhuma. Não existe registro em `avivar_accounts` nem em `avivar_account_members`.

---

## Plano

Chamar a Edge Function `provision-avivar-account` passando os dados do Josélio. Essa function já faz tudo automaticamente:

1. **Detecta usuário existente** — não cria auth duplicado, apenas reutiliza o `user_id` existente
2. **Adiciona `avivar` ao `allowed_portals`** — atualiza de `[hotleads]` para `[hotleads, avivar]`
3. **Cria perfil `cliente_avivar`** no `neohub_user_profiles`
4. **Cria conta Avivar** com todas as configurações copiadas do template (agente IA, kanbans, colunas, checklists, regras de follow-up, lembretes, base de conhecimento, agenda, onboarding, token API)

### Implementação

Invocar a function via código existente no frontend ou diretamente via `supabase.functions.invoke('provision-avivar-account', { body })` com:

```json
{
  "email": "joselio0611@gmail.com",
  "password": "<senha temporária>",
  "full_name": "Joselio Alves Sousa",
  "account_name": "Joselio Alves Sousa",
  "allowed_nichos": ["saude"]
}
```

Como a function requer uma senha (para atualizar caso já exista), precisarei definir uma senha temporária ou pedir ao usuário.

### Pré-requisito

Preciso saber qual senha definir para o Josélio. A function exige o campo `password`.

