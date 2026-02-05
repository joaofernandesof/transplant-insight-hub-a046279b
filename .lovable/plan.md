

# Plano: Redesign HotLeads — Sistema de Competicao de Leads

## Resumo

Transformar a pagina HotLeads no Portal de Licenciados em um sistema de competicao onde o Admin Master importa leads via planilha e os licenciados competem para adquiri-los. O primeiro a clicar bloqueia o lead e recebe os dados completos por e-mail via webhook n8n.

---

## 1. O Que Muda

### Situacao Atual
A pagina HotLeads funciona como um CRM completo com kanban de 5 colunas (Lead Novo, Captado, Agendado, Vendido, Descartado), drag-and-drop, dashboard de metricas e comparativo de licenciados.

### Nova Proposta
A pagina sera simplificada para um layout de **duas colunas** (Disponveis / Adquiridos) com foco na competicao de aquisicao e envio de dados via webhook.

---

## 2. Funcionalidades

### 2.1 Importacao de Leads (Admin Master)

- Botao "Importar Planilha" visivel apenas para Admin Master
- Aceita arquivos `.xls`, `.xlsx` e `.csv`
- Valida colunas obrigatorias: Nome, Telefone, Email, Estado, Cidade
- Preview dos dados antes de confirmar importacao
- Feedback de quantos leads foram importados com sucesso / erros

### 2.2 Exportacao de Leads (Admin Master)

- Botao "Exportar Planilha" visivel apenas para Admin Master
- Exporta todos os leads em formato `.xlsx`
- Inclui colunas extras: status (disponivel/adquirido), adquirido por, data de aquisicao

### 2.3 Visualizacao de Leads (Todos os Licenciados)

**Coluna 1 — Leads Disponiveis**
- Lista de leads que ainda nao foram adquiridos
- Cada card exibe: Nome, Cidade + Estado
- Botao "Adquirir Lead" em cada card

**Coluna 2 — Leads Adquiridos**
- Lista de leads ja adquiridos
- Cada card exibe: Nome, Cidade + Estado, "Adquirido por: [Nome]"
- Sem botao de acao (bloqueado)

### 2.4 Fluxo de Aquisicao

1. Licenciado clica em "Adquirir Lead"
2. Modal aparece com campo obrigatorio de e-mail
3. Licenciado digita o e-mail e clica "Receber dados do lead"
4. Sistema:
   - Marca o lead como `claimed_by` no banco (atomico, previne duplicidade)
   - Envia POST para webhook n8n com payload:
     ```json
     {
       "user_email": "email@cliente.com",
       "lead": {
         "nome": "Nome",
         "telefone": "Telefone",
         "email": "Email",
         "cidade": "Cidade",
         "estado": "Estado"
       }
     }
     ```

---

## 3. Secao Tecnica

### 3.1 Banco de Dados

A tabela `leads` ja possui todos os campos necessarios (name, phone, email, city, state, claimed_by, claimed_at). **Nenhuma migration de schema e necessaria.**

Sera necessario apenas ajustar as **politicas RLS** para:
- Permitir SELECT para qualquer usuario autenticado (licenciados precisam ver todos os leads)
- Permitir INSERT apenas para admins (importacao)
- Manter UPDATE restrito (claim atomico)

### 3.2 Configuracao do Webhook

Sera necessario armazenar a URL do webhook n8n como um secret no backend para uso na edge function. O Admin configurara a URL uma vez.

### 3.3 Edge Function: `hotleads-acquire`

Nova edge function que:
1. Recebe `lead_id` e `user_email`
2. Faz o claim atomico do lead (UPDATE WHERE claimed_by IS NULL)
3. Envia o POST para o webhook n8n
4. Retorna sucesso ou erro (lead ja foi adquirido)

### 3.4 Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| `src/pages/HotLeads.tsx` | Refatorar completamente para o novo layout de 2 colunas |
| `src/components/hotleads/LeadImportDialog.tsx` | **Novo** — Modal de importacao com preview |
| `src/components/hotleads/LeadAcquireDialog.tsx` | **Novo** — Modal de aquisicao com campo de e-mail |
| `src/components/hotleads/AvailableLeadCard.tsx` | **Novo** — Card simplificado para lead disponivel |
| `src/components/hotleads/AcquiredLeadCard.tsx` | **Novo** — Card para lead adquirido/bloqueado |
| `supabase/functions/hotleads-acquire/index.ts` | **Novo** — Edge function para claim + webhook |
| `src/hooks/useHotLeads.ts` | **Novo** — Hook dedicado com React Query |

### 3.5 Bibliotecas Existentes

- `xlsx` (ja instalado) — para leitura de planilhas .xls/.xlsx/.csv
- Nenhuma dependencia nova necessaria

### 3.6 Fluxo de Importacao (Frontend)

```text
1. Admin clica "Importar"
2. Seleciona arquivo (.xls, .xlsx, .csv)
3. Frontend le com biblioteca xlsx
4. Valida colunas obrigatorias
5. Mostra preview em tabela
6. Admin confirma
7. Frontend envia batch insert via Supabase client
8. Toast com resultado (X importados, Y erros)
```

### 3.7 Prevencao de Race Condition na Aquisicao

O claim sera feito via edge function com UPDATE atomico:
```sql
UPDATE leads SET claimed_by = $user_id, claimed_at = now()
WHERE id = $lead_id AND claimed_by IS NULL
```
Se `rowCount = 0`, significa que outro usuario ja adquiriu. Retorna erro.

### 3.8 Permissoes

- **Admin Master** (`isAdmin` via `useAuth`): Importar, Exportar, Visualizar tudo
- **Licenciados**: Apenas visualizar leads e adquirir

---

## 4. Etapas de Implementacao

1. Criar secret para URL do webhook n8n
2. Criar edge function `hotleads-acquire`
3. Criar hook `useHotLeads.ts` com React Query
4. Criar componentes: `LeadImportDialog`, `LeadAcquireDialog`, cards
5. Refatorar `HotLeads.tsx` com novo layout de 2 colunas
6. Ajustar RLS se necessario
7. Testar fluxo completo

