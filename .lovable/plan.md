

## Plano: Criar acesso Avivar CRM para karinnemendessg@gmail.com

### O que será feito

Este processo envolve múltiplas etapas no banco de dados para criar um usuário totalmente isolado no CRM Avivar, sem acesso a outros portais.

### Etapas de implementação

1. **Criar usuário no Auth** via Edge Function `create-admin-user` (ou SQL direto)
   - Email: `karinnemendessg@gmail.com`
   - Senha gerada: `Karine@Avivar2026!`
   - Nome: Karine Mendes

2. **Criar registro em `neohub_users`**
   - `allowed_portals`: apenas `['avivar']` (sem acesso a outros portais)
   - `is_active: true`

3. **Criar perfil em `neohub_user_profiles`**
   - Perfil: `cliente_avivar` (perfil padrão Avivar)

4. **Criar conta Avivar isolada em `avivar_accounts`**
   - Nome: "Karine Mendes"
   - Slug: `karine-mendes`
   - `owner_user_id`: o auth ID do novo usuário

5. **Criar membro em `avivar_account_members`**
   - Role: `owner` (liberdade total dentro da conta, inclusive cadastrar novos usuários)
   - Vinculado à nova conta criada

6. **Criar API Token/Webhook único em `avivar_api_tokens`**
   - Webhook slug único gerado automaticamente
   - Vinculado ao `account_id` da nova conta

### Isolamento garantido pela arquitetura

- Todas as tabelas Avivar usam `account_id` com RLS, garantindo que a Karine **não verá leads, conversas ou dados de outras contas**
- O webhook slug será exclusivo desta conta
- `allowed_portals: ['avivar']` bloqueia acesso a qualquer outro portal

### Credenciais que serão fornecidas

| Campo | Valor |
|-------|-------|
| Email | karinnemendessg@gmail.com |
| Senha | Karine@Avivar2026! |
| Portal | CRM Avivar (exclusivo) |
| Role | Owner (admin total da conta) |

