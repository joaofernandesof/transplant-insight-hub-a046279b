

## Diagnóstico

O problema é que a função `is_neohub_admin` no banco de dados só reconhece o perfil `'administrador'` — mas não reconhece `'super_administrador'`. Quem está logado provavelmente tem o perfil `super_administrador` sem ter `admin` na tabela `user_roles`, e por isso a verificação falha retornando 403.

Além disso, a edge function `admin-reset-user-password` **não está registrada** no `config.toml`, o que pode causar problemas com verificação de JWT.

## Plano de Correção

### 1. Atualizar a função `is_neohub_admin` no banco
Adicionar verificação para o perfil `'super_administrador'` além de `'administrador'`:

```sql
CREATE OR REPLACE FUNCTION public.is_neohub_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.neohub_user_profiles nup
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.user_id = _user_id
      AND nup.profile IN ('administrador', 'super_administrador')
      AND nup.is_active = true
      AND nu.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;
```

### 2. Registrar a edge function no `config.toml`
Adicionar entrada para `admin-reset-user-password` com `verify_jwt = false` (a validação já é feita manualmente no código).

### 3. Atualizar CORS headers da edge function
Adicionar os headers extras que o Supabase JS client envia, para evitar falhas de preflight.

