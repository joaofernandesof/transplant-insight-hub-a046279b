

## Disponibilidade da Agenda Cirúrgica

### Resumo

Criar um sistema de configuração de disponibilidade da agenda cirúrgica com duas funcionalidades:
1. **Bloqueio de datas específicas** por filial
2. **Limite de agendamentos por dia** por filial

A configuração será visível apenas para administradores. A visualização da disponibilidade será visível para todos os usuários.

---

### 1. Nova tabela: `surgery_agenda_availability`

```sql
CREATE TABLE surgery_agenda_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  date DATE NOT NULL,
  max_slots INTEGER NOT NULL DEFAULT 5,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch, date)
);

-- RLS: leitura para autenticados, escrita para admins
ALTER TABLE surgery_agenda_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read" ON surgery_agenda_availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage" ON surgery_agenda_availability
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
  );
```

### 2. Aba "Configuração" na Agenda Cirúrgica (admin only)

Adicionar uma terceira aba no `ClinicDashboard.tsx`, visível apenas para `isAdmin`:
- **Aba "Configuração da Agenda"** com:
  - Seletor de filial
  - Calendário mensal interativo onde o admin pode:
    - Clicar em um dia para bloquear/desbloquear
    - Definir o número máximo de agendamentos para cada dia
  - Visualização em tabela/grid do mês mostrando: data, slots máximos, status (bloqueado/aberto), agendamentos já existentes

### 3. Visualização de Disponibilidade (todos os usuários)

Na aba "Agenda" existente, adicionar um componente visual mostrando:
- Um mini calendário ou barra de disponibilidade por filial
- Dias bloqueados marcados em vermelho
- Dias com vagas esgotadas marcados em amarelo/laranja
- Dias disponíveis em verde
- Contagem de vagas restantes (`max_slots - agendamentos existentes`)

### 4. Novo hook: `useSurgeryAgendaAvailability`

```typescript
// src/clinic/hooks/useSurgeryAgendaAvailability.ts
// - Busca configurações de disponibilidade por filial e período
// - Cruza com contagem de cirurgias agendadas por dia
// - Retorna: disponibilidade por data, se está bloqueado, vagas restantes
// - Mutations para admin: criar/atualizar configuração
```

### 5. Validação no agendamento

Ao adicionar cirurgia (`AddSurgeryDialog`), validar:
- Se a data está bloqueada para a filial selecionada → impedir agendamento
- Se o número de agendamentos no dia atingiu o limite → alertar/impedir

### Estrutura de arquivos

- `src/clinic/hooks/useSurgeryAgendaAvailability.ts` — hook de dados
- `src/clinic/components/AgendaAvailabilityConfig.tsx` — painel admin (configuração)
- `src/clinic/components/AgendaAvailabilityView.tsx` — visualização para todos
- Editar `src/clinic/pages/ClinicDashboard.tsx` — adicionar aba config + visualização
- Editar `src/clinic/components/AddSurgeryDialog.tsx` — validação no agendamento
- Migração SQL para criar a tabela

