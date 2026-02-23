

# Unificar "Vendidos (Sem Data)" dentro da Agenda Cirurgica

## Objetivo

Remover "Vendidos (Sem Data)" como item separado no menu lateral e transforma-lo em uma **aba/tab dentro da Agenda Cirurgica**. O usuario acessa `/neoteam/agenda-cirurgica` e encontra tudo em um unico modulo com abas.

---

## Estrutura de Abas da Agenda Cirurgica

```text
+------------------------------------------------------------------+
| Agenda Cirurgica                                                  |
|  [Visao Geral]  [Vendidos Sem Data]                               |
|------------------------------------------------------------------|
|  (conteudo da aba ativa)                                          |
+------------------------------------------------------------------+
```

- **Aba "Visao Geral"**: Dashboard atual (cards + lista semanal + pendencias)
- **Aba "Vendidos Sem Data"**: Tabela estrategica com filtros (conteudo atual do NoDateQueue)

---

## Mudancas

### 1. Menu Lateral (`src/config/menuConfig.ts`)
- Remover o item `neoteam_no_date` (Vendidos Sem Data) da lista de itens do menu
- Manter apenas "Agenda Cirurgica" como ponto de acesso unico

### 2. Rotas (`src/App.tsx`)
- Remover a rota separada `/neoteam/vendidos-sem-data`
- Manter apenas `/neoteam/agenda-cirurgica`

### 3. Pagina Unificada (`src/clinic/pages/ClinicDashboard.tsx`)
- Adicionar componente `Tabs` (Radix) com duas abas:
  - `"visao-geral"` -- conteudo atual do dashboard
  - `"vendidos-sem-data"` -- importar e renderizar o conteudo do NoDateQueue
- Titulo principal: "Agenda Cirurgica" (sem mudar por aba)
- Manter o filtro de unidade global no topo (funciona para ambas as abas)

### 4. Breadcrumbs e EventTracker
- Remover referencias a rota `/neoteam/vendidos-sem-data`
- Atualizar label de `/neoteam/agenda-cirurgica` para "Agenda Cirurgica"

### 5. Pagina NoDateQueue
- Converter de pagina independente para componente exportavel (remover cabecalho duplicado, pois ja estara dentro da Agenda Cirurgica)

