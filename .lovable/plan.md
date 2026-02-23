

# Módulo Técnico: Agenda Cirúrgica + Pipeline de Pacientes Vendidos

## Resumo

Transformar a página "Sem Data Definida" de uma lista de cards simples em uma **fila estratégica com tabela técnica**, filtros combinaveis, alertas visuais por tempo de espera, e um dashboard card na Visão Operacional. Também enriquecer o hook de dados para incluir informações da venda (VGV, data da venda, vendedor/responsável).

---

## 1. Migração de Banco de Dados

Adicionar colunas que faltam na tabela `clinic_surgeries` para suportar o campo "responsável" dedicado:

- Nenhuma nova coluna necessária -- os dados de venda (VGV, data da venda, responsável/seller, status contrato) já existem na tabela `clinic_sales` e serão obtidos via JOIN no `sale_id` existente.

A query do hook será expandida para incluir o JOIN com `clinic_sales`.

---

## 2. Atualizar Hook `useClinicSurgeries`

**Arquivo:** `src/clinic/hooks/useClinicSurgeries.ts`

- Expandir a query Supabase para incluir `clinic_sales(sale_date, vgv, seller, contract_status, service_type)` no select
- Adicionar campos ao tipo `ClinicSurgery`: `saleDate`, `vgv`, `seller`, `contractStatus`
- Calcular `daysSinceSale` derivado automaticamente de `saleDate`
- Adicionar listas derivadas:
  - `noDateOver30`: vendidos sem data ha mais de 30 dias
  - `noDateOver60`: vendidos sem data ha mais de 60 dias
- Expandir `stats` com `noDateOver30` e `noDateOver60` counts

---

## 3. Nova Pagina: Pacientes Vendidos (Sem Data) - Tabela Tecnica

**Arquivo:** `src/clinic/pages/NoDateQueue.tsx` (reescrever)

### Cabecalho
- Titulo: "Pacientes Vendidos (Sem Data)"
- Subtitulo dinamico com total de registros

### Filtros (sempre visiveis, no topo)
Barra de filtros combinaveis com:
- Busca por nome do paciente
- Filtro por intervalo de data da venda (DatePicker range)
- Filtro por unidade/branch
- Filtro por categoria (A, B, C, D)
- Filtro por procedimento
- Filtro por responsavel (seller)
- Filtro por tempo sem agendamento: Todos / +30 dias / +60 dias

### Tabela Tecnica
Colunas:
| Paciente | Categoria | Procedimento | Grau | VGV | Data da Venda | Unidade | Status Contrato | Observacoes | Dias desde Venda | Responsavel |

### Regras Visuais Inteligentes
- `daysSinceSale` calculado automaticamente
- Linha com fundo amarelo sutil se >= 30 dias
- Linha com fundo vermelho sutil se >= 60 dias
- Badge colorido na coluna "Dias desde Venda"

### Acao Principal
- Botao "Agendar Cirurgia" em cada linha
- Ao clicar: abre um Dialog pre-preenchido com dados do paciente
- Usuario escolhe data e horario
- Sistema atualiza `surgery_date`, `surgery_time`, `schedule_status = 'agendado'`
- Ao remover data de uma cirurgia, status volta automaticamente para `sem_data`

---

## 4. Dialog de Agendamento Rapido

**Arquivo novo:** `src/clinic/components/ScheduleSurgeryDialog.tsx`

Modal com:
- Dados do paciente (somente leitura): nome, procedimento, categoria, grau
- Campo de data (Calendar/DatePicker)
- Campo de horario (Select com slots)
- Campo de medico plantonista (opcional)
- Botao "Confirmar Agendamento"

Ao salvar: chama `updateSurgery` com `surgeryDate`, `surgeryTime`, `scheduleStatus: 'agendado'`

---

## 5. Dashboard (Visao Operacional) - Novo Card

**Arquivo:** `src/clinic/pages/ClinicDashboard.tsx`

Adicionar card estrategico:

```text
+-----------------------------------+
| Vendidos Sem Data                 |
| [TOTAL]                           |
| X acima de 30 dias (amarelo)      |
| Y acima de 60 dias (vermelho)     |
+-----------------------------------+
```

Apenas numeros estrategicos, sem exagero visual. Usar icone `AlertTriangle` para destaque.

---

## 6. Sidebar - Reorganizar Menu

**Arquivo:** `src/clinic/components/ClinicSidebar.tsx`

Reorganizar items do menu conforme a nova estrutura:

```text
Dashboard (Visao Operacional)
Agenda (Cirurgias Agendadas)
Pacientes Vendidos (Sem Data)   <-- renomear
Nova Venda
Cadastrar Paciente
Configuracoes (admin)
```

---

## 7. Logica de Status Derivado

O status do paciente sera derivado automaticamente, nao manual:

- Se `surgery_date IS NULL` → "Vendido (sem data)" / `sem_data`
- Se `surgery_date IS NOT NULL` e `schedule_status = 'agendado'|'confirmado'` → "Agendado"
- Se `schedule_status = 'realizado'` → "Concluido"

Ao remover a data de uma cirurgia (set `surgery_date = null`), o hook/mutation atualizara automaticamente o `schedule_status` para `sem_data`.

---

## Sequencia de Implementacao

1. Atualizar hook `useClinicSurgeries` (JOIN com sales, novos campos, novas listas)
2. Criar componente `ScheduleSurgeryDialog`
3. Reescrever pagina `NoDateQueue` com tabela tecnica + filtros
4. Atualizar `ClinicDashboard` com card estrategico
5. Reorganizar `ClinicSidebar`
6. Garantir logica de status derivado no `updateSurgery`

