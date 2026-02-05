
# Plano de Implementacao: Modulo de Rotina Diaria de Limpeza, Fiscalizacao e Estoque

## Resumo Executivo

Este plano detalha a implementacao completa do modulo de Rotina de Limpeza dentro do Portal NeoTeam. O sistema gerenciara a execucao diaria de limpeza de ambientes em clinicas de transplante capilar, com fluxos separados para execucao (perfil Limpeza), fiscalizacao (perfil Fiscal), e monitoramento em tempo real.

---

## 1. Estrutura de Arquivos a Criar

```text
src/pages/neoteam/cleaning/
├── CleaningRoutinePage.tsx          # Pagina principal com sistema de tabs
├── types.ts                         # Tipos TypeScript do modulo
├── hooks/
│   ├── useCleaningRoutine.ts        # Hook principal - rotina diaria
│   ├── useCleaningEnvironments.ts   # CRUD de ambientes
│   ├── useCleaningChecklists.ts     # CRUD de checklists
│   ├── useCleaningExecution.ts      # Execucao e marcacao de itens
│   ├── useCleaningInspection.ts     # Fiscalizacao e aprovacao
│   └── useCleaningSupplies.ts       # Estoque de insumos
├── tabs/
│   ├── DailyRoutineTab.tsx          # Rotina do dia (perfil Limpeza)
│   ├── InspectionTab.tsx            # Fiscalizacao (perfil Fiscal)
│   ├── MonitoringTab.tsx            # Painel tempo real
│   ├── EnvironmentsTab.tsx          # Cadastro de ambientes
│   ├── ChecklistsTab.tsx            # Gestao de checklists
│   ├── SuppliesTab.tsx              # Estoque de insumos
│   └── HistoryTab.tsx               # Historico e auditoria
└── components/
    ├── EnvironmentCard.tsx          # Card de ambiente na fila
    ├── ChecklistExecutor.tsx        # Executor interativo
    ├── InspectionPanel.tsx          # Painel de fiscalizacao
    ├── RejectionDialog.tsx          # Modal de reprovacao
    ├── ProgressIndicators.tsx       # Barras de progresso
    └── StatusBadges.tsx             # Badges de status
```

---

## 2. Migracao de Banco de Dados

### 2.1 Novos Enums

```sql
-- Nivel de risco sanitario
CREATE TYPE sanitary_risk_level AS ENUM (
  'critico',      -- Centro cirurgico, salas de procedimento
  'semicritico',  -- Consultorios, areas de recuperacao
  'nao_critico'   -- Recepcao, administrativo, copa
);

-- Status de execucao do ambiente
CREATE TYPE cleaning_execution_status AS ENUM (
  'pendente',
  'em_execucao',
  'finalizado_limpeza',
  'aguardando_fiscalizacao',
  'reprovado',
  'corrigido',
  'aprovado'
);
```

### 2.2 Novas Tabelas

**Tabela: cleaning_environments**
Cadastro de ambientes fisicos da clinica.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK para tenants (multi-tenant) |
| branch_id | uuid | FK para neoteam_branches |
| name | varchar(255) | Nome do ambiente |
| description | text | Descricao opcional |
| environment_type | varchar(100) | Tipo (sala, corredor, etc) |
| sanitary_risk_level | enum | critico/semicritico/nao_critico |
| priority_order | integer | Ordem de execucao (menor = primeiro) |
| is_active | boolean | Ambiente ativo |
| created_at, updated_at | timestamp | Metadados |

---

**Tabela: cleaning_checklists**
Versoes de checklist por ambiente.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| environment_id | uuid | FK para cleaning_environments |
| version | integer | Numero da versao |
| version_notes | text | Notas da versao |
| is_active | boolean | Versao ativa |
| created_at | timestamp | Criacao |
| created_by | uuid | Usuario que criou |

---

**Tabela: cleaning_checklist_items**
Itens individuais do checklist.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| checklist_id | uuid | FK para cleaning_checklists |
| description | text | Descricao do item |
| category | varchar(50) | limpeza_geral/desinfeccao/organizacao |
| order_index | integer | Ordem de exibicao |
| is_critical | boolean | Item critico (obrigatorio) |
| created_at | timestamp | Criacao |

---

**Tabela: cleaning_daily_routines**
Rotina agregada por dia.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK para tenants |
| branch_id | uuid | FK para neoteam_branches |
| routine_date | date | Data da rotina |
| status | varchar(20) | em_andamento/finalizada |
| total_environments | integer | Total de ambientes |
| completed_environments | integer | Ambientes aprovados |
| created_at, updated_at | timestamp | Metadados |

---

**Tabela: cleaning_environment_executions**
Execucao individual de cada ambiente por dia.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| routine_id | uuid | FK para cleaning_daily_routines |
| environment_id | uuid | FK para cleaning_environments |
| checklist_id | uuid | FK para cleaning_checklists |
| status | enum | cleaning_execution_status |
| started_at | timestamp | Inicio da execucao |
| finished_at | timestamp | Finalizacao pela limpeza |
| executed_by | uuid | Usuario que executou |
| approved_at | timestamp | Data de aprovacao |
| approved_by | uuid | Fiscal que aprovou |
| rejection_reason | text | Motivo da reprovacao |
| rejection_notes | text | Observacoes da reprovacao |
| correction_count | integer | Quantas vezes foi reprovado |
| is_locked | boolean | Travado apos aprovacao |
| created_at, updated_at | timestamp | Metadados |

---

**Tabela: cleaning_execution_items**
Marcacao de cada item do checklist.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| execution_id | uuid | FK para cleaning_environment_executions |
| checklist_item_id | uuid | FK para cleaning_checklist_items |
| is_completed | boolean | Marcado como concluido |
| completed_at | timestamp | Quando foi marcado |
| completed_by | uuid | Usuario que marcou |
| is_rejected | boolean | Rejeitado na fiscalizacao |
| rejection_note | text | Nota de rejeicao do item |

---

**Tabela: cleaning_supplies**
Insumos de limpeza (pode reaproveitar stock_items adicionando categoria).

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK para tenants |
| branch_id | uuid | FK para neoteam_branches |
| name | varchar(255) | Nome do produto |
| category | varchar(50) | desinfetante/detergente/pano/epi |
| unit | varchar(20) | Unidade de medida |
| current_stock | decimal | Estoque atual |
| min_stock | decimal | Estoque minimo (alerta) |
| cost_unit | decimal | Custo unitario |
| is_active | boolean | Ativo |
| created_at, updated_at | timestamp | Metadados |

---

**Tabela: cleaning_supply_movements**
Movimentacoes de estoque de insumos.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| supply_id | uuid | FK para cleaning_supplies |
| movement_type | varchar(20) | entrada/saida/ajuste |
| quantity | decimal | Quantidade movimentada |
| execution_id | uuid | FK opcional para cleaning_environment_executions |
| notes | text | Observacoes |
| created_at | timestamp | Criacao |
| created_by | uuid | Usuario |

---

**Tabela: cleaning_audit_logs**
Auditoria completa de acoes.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK para tenants |
| action | varchar(50) | Acao realizada |
| entity_type | varchar(50) | Tipo da entidade |
| entity_id | uuid | ID da entidade |
| old_values | jsonb | Valores anteriores |
| new_values | jsonb | Novos valores |
| notes | text | Observacoes |
| created_at | timestamp | Criacao |
| created_by | uuid | Usuario |

---

## 3. Perfis e Permissoes

### 3.1 Novos Cargos em staff_roles

Inserir novos cargos na tabela `staff_roles`:

| code | name | department | default_route | icon | color |
|------|------|------------|---------------|------|-------|
| limpeza | Auxiliar de Limpeza | operacoes | /neoteam/cleaning | Sparkles | bg-cyan-500 |
| fiscal_limpeza | Fiscal de Limpeza | operacoes | /neoteam/cleaning?tab=inspection | ClipboardCheck | bg-purple-500 |
| gestor_limpeza | Gestor de Higienizacao | gestao | /neoteam/cleaning?tab=monitoring | Shield | bg-indigo-500 |

### 3.2 Matriz de Permissoes

| Acao | Limpeza | Fiscal | Gestor |
|------|---------|--------|--------|
| Ver checklist do dia | Sim | Sim | Sim |
| Executar limpeza | Sim | Nao | Nao |
| Marcar itens | Sim | Nao | Nao |
| Finalizar ambiente | Sim | Nao | Nao |
| Aprovar ambiente | Nao | Sim | Sim |
| Reprovar ambiente | Nao | Sim | Sim |
| Ver monitoramento | Nao | Sim | Sim |
| Cadastrar ambientes | Nao | Nao | Sim |
| Gerenciar checklists | Nao | Nao | Sim |
| Gerenciar estoque | Nao | Nao | Sim |
| Ver historico/auditoria | Nao | Sim | Sim |

---

## 4. Regras de Negocio Criticas

### 4.1 Sequencia Obrigatoria de Ambientes

```text
REGRA: A ordem de execucao e fixa e imutavel para o perfil Limpeza.

PRIORIDADE:
1. Ambientes CRITICOS (menor priority_order primeiro)
2. Ambientes SEMICRITICOS
3. Ambientes NAO_CRITICOS

COMPORTAMENTO:
- O proximo ambiente so fica disponivel apos finalizar o atual
- Nao e possivel pular ambientes
- A interface mostra apenas o ambiente ativo + fila bloqueada
```

### 4.2 Fluxo de Estados

```text
PENDENTE
    |
    v
EM_EXECUCAO (Limpeza inicia)
    |
    v
FINALIZADO_LIMPEZA (todos os itens marcados + botao Finalizar)
    |
    v
AGUARDANDO_FISCALIZACAO
    |
    +---> APROVADO (imutavel, is_locked = true)
    |
    +---> REPROVADO (seleciona itens + observacao obrigatoria)
              |
              v
          CORRIGIDO (apos correcao)
              |
              v
          AGUARDANDO_FISCALIZACAO (novo ciclo)
```

### 4.3 Imutabilidade Pos-Aprovacao

```text
Quando status = APROVADO:
- is_locked = true
- Nenhum UPDATE e permitido
- RLS bloqueia qualquer alteracao
- Registro vai para cleaning_audit_logs
```

### 4.4 Reprovacao com Feedback Obrigatorio

```text
Para reprovar, o Fiscal DEVE:
1. Selecionar pelo menos 1 item nao conforme
2. Preencher observacao com minimo 10 caracteres
3. Itens rejeitados ficam marcados (is_rejected = true)

Apos reprovacao:
- correction_count incrementa
- Ambiente volta para fila da Limpeza
- Itens rejeitados aparecem destacados em vermelho
```

---

## 5. Componentes de Interface

### 5.1 DailyRoutineTab (Perfil Limpeza)

```text
+----------------------------------------------------------+
|  Rotina de Limpeza - 05/02/2026                          |
+----------------------------------------------------------+
|  [===========================-------] 75% concluido      |
|                                                          |
|  | Pendentes | Em Exec | Aguardando | Reprovados | OK |  |
|  |     2     |    1    |      3     |      1     |  4 |  |
|                                                          |
|  PROXIMO AMBIENTE:                                       |
|  +------------------------------------------------------+|
|  | [!] CENTRO CIRURGICO 1          [Risco: CRITICO]    ||
|  | Prioridade: 1 de 10                                 ||
|  | Checklist: 15 itens                                 ||
|  |                                         [INICIAR >] ||
|  +------------------------------------------------------+|
|                                                          |
|  FILA DE AMBIENTES (bloqueados):                        |
|  - Sala de Recuperacao 1 (semicritico)                  |
|  - Sala de Recuperacao 2 (semicritico)                  |
|  - Consultorio 1 (nao critico)                          |
+----------------------------------------------------------+
```

### 5.2 ChecklistExecutor

```text
+----------------------------------------------------------+
|  < Voltar    CENTRO CIRURGICO 1         Timer: 12:34    |
+----------------------------------------------------------+
|  Itens: [========--] 8/10 concluidos                    |
|                                                          |
|  LIMPEZA GERAL                                          |
|  [x] Varrer todo o piso              14:32 - Maria      |
|  [x] Passar pano umido               14:35 - Maria      |
|  [ ] Limpar superficies de trabalho                     |
|  [x] Limpar equipamentos             14:40 - Maria      |
|                                                          |
|  DESINFECCAO                                            |
|  [x] Aplicar quaternario             14:42 - Maria      |
|  [x] Higienizar macanetas            14:45 - Maria      |
|  [ ] Desinfetar instrumentos                            |
|                                                          |
|  ORGANIZACAO                                            |
|  [x] Repor materiais                 14:50 - Maria      |
|  [x] Organizar mobiliario            14:52 - Maria      |
|  [x] Verificar lixeiras              14:53 - Maria      |
|                                                          |
|  +------------------------------------------------------+|
|  |         [ FINALIZAR AMBIENTE ]                       ||
|  |         (2 itens pendentes - desabilitado)           ||
|  +------------------------------------------------------+|
+----------------------------------------------------------+
```

### 5.3 InspectionTab (Perfil Fiscal)

```text
+----------------------------------------------------------+
|  Fiscalizacao de Limpeza - 05/02/2026                   |
+----------------------------------------------------------+
|  Aguardando Aprovacao: 3 ambientes                      |
|                                                          |
|  +------------------------------------------------------+|
|  | CENTRO CIRURGICO 1                                  ||
|  | Executado por: Maria Silva                          ||
|  | Finalizado as: 15:05 | Duracao: 33 min              ||
|  |                                                      ||
|  | Checklist: 10/10 itens concluidos                   ||
|  | [Ver detalhes v]                                    ||
|  |                                                      ||
|  | [Aprovar]              [Reprovar]                   ||
|  +------------------------------------------------------+|
|                                                          |
|  +------------------------------------------------------+|
|  | SALA DE RECUPERACAO 1                               ||
|  | Executado por: Maria Silva                          ||
|  | Reprovado anteriormente: 1 vez                      ||
|  | ...                                                 ||
|  +------------------------------------------------------+|
+----------------------------------------------------------+
```

### 5.4 RejectionDialog

```text
+----------------------------------------------------------+
|  Reprovar Ambiente: CENTRO CIRURGICO 1                  |
+----------------------------------------------------------+
|                                                          |
|  Selecione os itens nao conformes:                      |
|                                                          |
|  [ ] Varrer todo o piso                                 |
|  [ ] Passar pano umido com desinfetante                 |
|  [x] Limpar superficies de trabalho                     |
|  [ ] Limpar equipamentos                                |
|  [x] Desinfetar area de instrumentos                    |
|  ...                                                    |
|                                                          |
|  Observacao (obrigatoria): *                            |
|  +------------------------------------------------------+|
|  | Superficies ainda com residuos visiveis. Area de    ||
|  | instrumentos precisa de mais atencao.               ||
|  +------------------------------------------------------+|
|  Minimo 10 caracteres                                   |
|                                                          |
|  [Cancelar]                    [Confirmar Reprovacao]   |
+----------------------------------------------------------+
```

---

## 6. Rotas e Menu

### 6.1 Nova Rota

```tsx
// Em App.tsx, dentro de NeoTeamRoutes
<Route path="cleaning" element={<CleaningRoutinePage />} />
```

### 6.2 Atualizacao do Menu

Adicionar ao `NEOTEAM_MENU_CATEGORIES` em `src/config/menuConfig.ts`:

```typescript
// Na categoria 'neoteam_operations'
{
  id: 'neoteam_cleaning',
  code: 'neoteam_cleaning',
  title: 'Limpeza',
  icon: Sparkles,
  route: '/neoteam/cleaning'
}
```

---

## 7. RLS Policies

### 7.1 cleaning_daily_routines

```sql
-- Usuarios autenticados da mesma branch podem visualizar
CREATE POLICY "branch_select" ON cleaning_daily_routines
FOR SELECT TO authenticated
USING (
  branch_id IN (
    SELECT branch_id FROM staff_user_roles
    WHERE neohub_user_id = (
      SELECT id FROM neohub_users WHERE user_id = auth.uid()
    )
  )
);

-- Apenas sistema ou gestor pode inserir
CREATE POLICY "gestor_insert" ON cleaning_daily_routines
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'gestor_limpeza'));
```

### 7.2 cleaning_environment_executions

```sql
-- Limpeza: pode editar apenas se status = em_execucao
CREATE POLICY "limpeza_update" ON cleaning_environment_executions
FOR UPDATE TO authenticated
USING (
  status = 'em_execucao' AND
  executed_by = auth.uid()
)
WITH CHECK (status IN ('em_execucao', 'finalizado_limpeza'));

-- Fiscal: pode editar apenas se status = aguardando_fiscalizacao
CREATE POLICY "fiscal_update" ON cleaning_environment_executions
FOR UPDATE TO authenticated
USING (
  status = 'aguardando_fiscalizacao' AND
  has_role(auth.uid(), 'fiscal_limpeza')
)
WITH CHECK (status IN ('aprovado', 'reprovado'));

-- Bloqueia alteracao apos aprovacao
CREATE POLICY "lock_approved" ON cleaning_environment_executions
FOR UPDATE TO authenticated
USING (is_locked = false);
```

---

## 8. Trigger para Auditoria

```sql
CREATE OR REPLACE FUNCTION log_cleaning_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'aprovado' THEN
    INSERT INTO cleaning_audit_logs (
      tenant_id, action, entity_type, entity_id,
      old_values, new_values, created_by
    ) VALUES (
      NEW.tenant_id,
      'aprovacao',
      'cleaning_environment_executions',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      auth.uid()
    );
    
    -- Trava o registro
    NEW.is_locked := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_cleaning_audit
BEFORE UPDATE ON cleaning_environment_executions
FOR EACH ROW
EXECUTE FUNCTION log_cleaning_audit();
```

---

## 9. Integracao com Sistema Existente

### 9.1 Reaproveitamento

| Componente Existente | Uso no Modulo de Limpeza |
|---------------------|--------------------------|
| `useTabFromUrl` | Navegacao entre tabs |
| `staff_roles` / `staff_user_roles` | Permissoes de limpeza/fiscal |
| `neoteam_branches` | Filtro por unidade |
| Padrao de tabs do InventoryPage | Estrutura da CleaningRoutinePage |
| Padrao de cards e tabelas | Componentes visuais |

### 9.2 Estoque de Insumos

Opcao 1: Criar tabelas separadas (`cleaning_supplies`)
Opcao 2: Adicionar categoria `limpeza` ao enum `kit_item_category` existente e usar `stock_items`

Recomendacao: Usar tabelas separadas para maior clareza e independencia do modulo.

---

## 10. Fases de Implementacao

### Fase 1: Infraestrutura Backend (Migrations)
1. Criar enums `sanitary_risk_level` e `cleaning_execution_status`
2. Criar todas as tabelas do modulo
3. Configurar RLS policies
4. Criar triggers de auditoria
5. Inserir cargos em `staff_roles`

### Fase 2: Tipos e Hooks
6. Criar `types.ts` com todas as interfaces
7. Implementar hooks de dados (React Query)

### Fase 3: Pagina Principal
8. Criar `CleaningRoutinePage.tsx` com sistema de tabs
9. Adicionar rota em `App.tsx`
10. Adicionar item no menu em `menuConfig.ts`

### Fase 4: Fluxo de Limpeza
11. Implementar `DailyRoutineTab`
12. Implementar `ChecklistExecutor`
13. Implementar logica de sequencia obrigatoria
14. Implementar finalizacao de ambiente

### Fase 5: Fluxo de Fiscalizacao
15. Implementar `InspectionTab`
16. Implementar `InspectionPanel`
17. Implementar `RejectionDialog`
18. Implementar retorno para correcao

### Fase 6: Monitoramento e Estoque
19. Implementar `MonitoringTab` (tempo real)
20. Implementar `SuppliesTab`
21. Implementar alertas de estoque minimo

### Fase 7: Administracao
22. Implementar `EnvironmentsTab`
23. Implementar `ChecklistsTab`
24. Implementar `HistoryTab`

### Fase 8: Testes e Validacao
25. Testar fluxo completo de limpeza
26. Testar fiscalizacao com aprovacao/reprovacao
27. Testar bloqueio de sequencia
28. Testar imutabilidade pos-aprovacao
29. Testar estoque e alertas
30. Validar auditoria

---

## 11. Checklist de Validacao Final

Antes de declarar o modulo como concluido, verificar:

- [ ] Perfis limpeza/fiscal/gestor funcionam corretamente
- [ ] Sequencia de ambientes esta bloqueada para Limpeza
- [ ] Nao e possivel fiscalizar antes da finalizacao
- [ ] Reprovacoes geram retorno obrigatorio para correcao
- [ ] Ambientes aprovados ficam imutaveis (is_locked)
- [ ] Estoque nao permite valores negativos
- [ ] Alertas de estoque minimo funcionam
- [ ] Historico e auditoria registram todas as acoes
- [ ] Todos os botoes executam a funcao esperada
- [ ] RLS policies bloqueiam acessos indevidos
