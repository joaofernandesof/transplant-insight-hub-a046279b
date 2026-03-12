

## Diagnóstico do usuário mariocdamotta@gmail.com

O usuário possui:
- ✅ Conta `auth.users` (ID: `2adaf727-247a-4bf7-b7ba-ff562c8e95da`)
- ✅ Registro em `neohub_users` com `allowed_portals: [avivar]` e `is_active: true`
- ❌ **Nenhum registro em `avivar_account_members`** — causa do erro "Could not resolve account for user"
- ❌ **Nenhum perfil em `neohub_user_profiles`** — falta o perfil `cliente_avivar`
- ❌ **Nenhuma conta própria em `avivar_accounts`**

O erro na screenshot ("Erro ao criar instância") ocorre porque a edge function `avivar-uazapi/create-instance` exige um `account_id` via `avivar_account_members`, que não existe.

Além disso, a edge function `avivar-uazapi` tem CORS headers incompletos (faltam os headers `x-supabase-client-platform*`), o que pode causar falhas de preflight.

## Plano de Correção

### 1. Criar conta Avivar para o Mario
Inserir uma nova conta em `avivar_accounts` e vincular o usuário como `owner` em `avivar_account_members`.

### 2. Criar perfil em `neohub_user_profiles`
Inserir o perfil `cliente_avivar` para completar o cadastro.

### 3. Corrigir CORS da edge function `avivar-uazapi`
Atualizar os headers para incluir `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version` — mesma correção feita na `admin-reset-user-password`.

### Detalhes Técnicos

**Dados a inserir:**

```text
avivar_accounts:
  name: "Mario Cezar da Motta"
  slug: "mario-motta"
  owner_id: "2adaf727-247a-4bf7-b7ba-ff562c8e95da"

avivar_account_members:
  user_id: "2adaf727-247a-4bf7-b7ba-ff562c8e95da"
  account_id: <novo account_id>
  role: "owner"
  is_active: true

neohub_user_profiles:
  neohub_user_id: "2b7ec97c-70c5-4fd4-af42-737c0309d453"
  profile: "cliente_avivar"
  is_active: true
```

**CORS fix** em `supabase/functions/avivar-uazapi/index.ts` linha 10:
```
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```

