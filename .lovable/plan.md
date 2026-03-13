

# Correção: Brenna não consegue bloquear dias na Agenda Cirúrgica

## Problema Identificado

A Brenna (`brenna.miranda@neofolic.com.br`) tem role `colaborador` no banco de dados. O **frontend** permite que ela gerencie a agenda (via `canManageAgenda = isAdmin || canWrite('neoteam_surgical_dashboard')`), mas as **políticas RLS** na tabela `surgery_agenda_availability` só permitem INSERT/UPDATE/DELETE para usuários com role `admin`:

```
has_role(auth.uid(), 'admin'::app_role)
```

Resultado: a UI mostra os controles de bloqueio, mas o banco rejeita a operação silenciosamente.

## Solução

Atualizar as 3 políticas RLS de escrita na tabela `surgery_agenda_availability` para aceitar tanto `admin` quanto `colaborador`:

**Migração SQL:**
```sql
-- Drop existing restrictive policies
DROP POLICY "Admins can insert availability" ON surgery_agenda_availability;
DROP POLICY "Admins can update availability" ON surgery_agenda_availability;
DROP POLICY "Admins can delete availability" ON surgery_agenda_availability;

-- Recreate with broader access
CREATE POLICY "Staff can insert availability" ON surgery_agenda_availability
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'colaborador'::app_role)
  );

CREATE POLICY "Staff can update availability" ON surgery_agenda_availability
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'colaborador'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'colaborador'::app_role)
  );

CREATE POLICY "Staff can delete availability" ON surgery_agenda_availability
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'colaborador'::app_role)
  );
```

Nenhuma alteração de código frontend necessária — a lógica `canManageAgenda` já está correta.

