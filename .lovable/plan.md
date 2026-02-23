

# Agenda Cirurgica + Pipeline de Pacientes Vendidos (Sem Data)

## Resumo

Construir um modulo de **Agenda Cirurgica independente** integrado ao modulo de Pacientes, sem alterar a Agenda existente (`ClinicSchedule`). O sistema permitira multiplas cirurgias por paciente, com classificacao automatica de estados e uma fila estrategica de "Vendidos (Sem Data)".

---

## 1. Nenhuma Migracao de Banco Necessaria

As tabelas `clinic_surgeries` e `clinic_sales` ja possuem todos os campos necessarios:
- `clinic_surgeries` tem `patient_id`, `sale_id`, `surgery_date`, `schedule_status`, `branch`, `procedure`, `category`, `grade`, `notes`, `doctor_on_duty`
- `clinic_sales` tem `sale_date`, `vgv`, `seller`, `contract_status`, `service_type`, `patient_id`, `branch`
- O relacionamento N:1 (paciente tem N cirurgias) ja esta suportado

A logica de "Vendidos Sem Data" sera derivada no frontend: pacientes com venda ativa (`contract_status != 'cancelado'`) que nao possuem nenhuma cirurgia futura (`surgery_date >= hoje` ou `surgery_date IS NULL com status sem_data`).

---

## 2. Atualizar Hook `useClinicSurgeries`

**Arquivo:** `src/clinic/hooks/useClinicSurgeries.ts`

Mudancas:
- Expandir o `select` do Supabase para incluir JOIN com `clinic_sales`: `clinic_sales(sale_date, vgv, seller, contract_status)`
- Adicionar campos ao tipo `ClinicSurgery`: `saleDate`, `vgv`, `seller`, `contractStatus`
- Calcular `daysSinceSale` derivado de `saleDate`
- Adicionar listas derivadas: `noDateOver30`, `noDateOver60`
- Expandir `stats` com contagens de `noDateOver30` e `noDateOver60`
- Garantir que ao atualizar `surgeryDate` para `null`, o `scheduleStatus` seja automaticamente definido como `sem_data`

---

## 3. Novo Hook: `useNoDatePatients`

**Arquivo novo:** `src/clinic/hooks/useNoDatePatients.ts`

Hook dedicado para a logica de "Vendidos Sem Data":
- Busca todas as vendas ativas (`contract_status != 'cancelado'`) com JOIN em `clinic_patients`
- Busca todas as cirurgias futuras (agendadas ou sem data)
- Filtra: paciente aparece na lista **apenas** se nao possui nenhuma cirurgia futura com `surgery_date` preenchido
- Calcula `daysSinceSale` para cada registro
- Suporta filtros: data da venda (intervalo), unidade, categoria, procedimento, responsavel, tempo sem agendar

---

## 4. Novo Componente: `ScheduleSurgeryDialog`

**Arquivo novo:** `src/clinic/components/ScheduleSurgeryDialog.tsx`

Modal de agendamento rapido:
- Dados do paciente em modo somente leitura (nome, procedimento, categoria, grau)
- DatePicker para data da cirurgia
- Select para horario
- Campo opcional para medico plantonista
- Ao confirmar: chama `createSurgery` do hook `useClinicSurgeries` (criando nova cirurgia vinculada ao paciente e venda)
- O paciente sai automaticamente da lista "Sem Data" apos a criacao

---

## 5. Reescrever Pagina `NoDateQueue`

**Arquivo:** `src/clinic/pages/NoDateQueue.tsx`

Transformar de cards simples para tabela estrategica:

### Cabecalho
- Titulo: "Pacientes Vendidos (Sem Data)"
- Subtitulo dinamico com total

### Filtros (sempre visiveis no topo)
Barra de filtros combinaveis:
- Busca por nome do paciente (Input de texto)
- Data da venda -- intervalo com dois DatePickers
- Unidade/branch (Select)
- Categoria (Select)
- Procedimento (Select)
- Responsavel/seller (Select)
- Tempo sem agendar: Todos / +30 dias / +60 dias (Select)

### Tabela
Colunas: Paciente | Unidade | Procedimento | Categoria | VGV | Data da Venda | Dias desde Venda | Responsavel | Status Contrato | Observacoes | Acao

### Regras Visuais
- Linha com fundo amarelo sutil se `daysSinceSale >= 30`
- Linha com fundo vermelho sutil se `daysSinceSale >= 60`
- Badge colorido na coluna "Dias desde Venda"

### Acao
- Botao "Agendar" em cada linha abrindo o `ScheduleSurgeryDialog`

---

## 6. Atualizar Dashboard com Card Estrategico

**Arquivo:** `src/clinic/pages/ClinicDashboard.tsx`

Substituir o card simples "Sem Data Definida" por card estrategico:
- Total de vendidos sem data
- Quantidade acima de 30 dias (indicador amarelo)
- Quantidade acima de 60 dias (indicador vermelho)
- Apenas numeros, sem exagero visual

---

## 7. Reorganizar Sidebar

**Arquivo:** `src/clinic/components/ClinicSidebar.tsx`

Nova ordem do menu:
1. Dashboard (Visao Operacional)
2. Agenda (nao alterada)
3. Agenda Cirurgica (nova -- link para pagina de cirurgias agendadas)
4. Pacientes Vendidos (Sem Data) -- renomear item existente
5. Nova Venda
6. Cadastrar Paciente
7. Configuracoes (admin)

---

## 8. Logica de Status Derivado

Regras automaticas aplicadas no hook e nas mutations:

```text
Se surgery_date IS NULL --> sem_data
Se surgery_date >= hoje --> agendado
Se schedule_status = 'realizado' --> concluido
Se schedule_status = 'cancelado' --> cancelado (e paciente volta para Vendidos se nao houver outra futura)
```

Na mutation `updateSurgery`:
- Se `surgeryDate` for definido como `null`, `scheduleStatus` sera automaticamente `sem_data`
- Se `surgeryDate` for preenchido e status era `sem_data`, muda para `agendado`

---

## 9. Sequencia de Implementacao

1. Atualizar hook `useClinicSurgeries` (JOIN com sales, novos campos, logica de status derivado)
2. Criar hook `useNoDatePatients` (logica de filtragem de vendidos sem cirurgia futura)
3. Criar componente `ScheduleSurgeryDialog`
4. Reescrever pagina `NoDateQueue` com tabela tecnica + filtros
5. Atualizar `ClinicDashboard` com card estrategico
6. Reorganizar `ClinicSidebar`
7. Registrar novas rotas em `ClinicApp.tsx` se necessario

