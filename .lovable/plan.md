
# Plano: Remover Tabs e Consolidar Dashboard Administrativo

## Objetivo
Remover os dois botões de abas ("Dashboard Global" e "Portais & Acesso Rápido") e exibir todas as informações diretamente em uma única página, sem necessidade de navegação entre tabs.

---

## Mudanças Principais

### Arquivo: `src/pages/admin/AdminHome.tsx`

1. **Remover Sistema de Tabs**
   - Remover imports de `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
   - Remover o estado `activeTab` e `setActiveTab` (URL params)
   - Remover todo o bloco `<Tabs>` com seus elementos

2. **Consolidar Conteúdo em Layout Contínuo**
   - Manter o banner "Portal Administrativo" no topo
   - Renderizar `<GlobalDashboard />` diretamente após o banner
   - Adicionar uma seção de separação visual (ex: linha ou espaçamento)
   - Renderizar a seção "Portais do NeoHub" com os cards de acesso rápido
   - Renderizar as métricas do sistema (Total Usuários, Online, Licenciados, Alunos)
   - Renderizar `<AdminTrendCharts />` no final

---

## Estrutura Final do Layout

```text
┌─────────────────────────────────────────────────────────┐
│  Banner: Portal Administrativo + Botão Notificações    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [GlobalDashboard completo]                             │
│  - KPIs Globais                                          │
│  - Tabs internos (Visão Geral, Por Portal, etc.)        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Portais do NeoHub (grid de ícones)                     │
│  [Aluno] [Licenciado] [Paciente] [Colaborador] etc.     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Métricas do Sistema (cards)                            │
│  [Total Usuários] [Online] [Licenciados] [Alunos]       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [AdminTrendCharts - Gráficos de Tendência]             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Imports a Remover
```tsx
// Remover:
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Remover do array de icons:
LayoutDashboard, BarChart3  // (não mais necessários para tabs)
```

### Estado a Remover
```tsx
// Remover:
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'global';
const setActiveTab = (tab: string) => { ... };
```

### Nova Estrutura JSX
```tsx
<div className="space-y-6">
  {/* Banner */}
  <div className="relative ...">...</div>
  
  {/* GlobalDashboard - todas as métricas consolidadas */}
  <GlobalDashboard />
  
  {/* Separador visual */}
  <div className="border-t border-slate-700/50" />
  
  {/* Portais do NeoHub */}
  <div className="rounded-2xl ...">
    {portals.map(...)}
  </div>
  
  {/* Stats Row */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {/* Cards de métricas */}
  </div>
  
  {/* Gráficos de Tendência */}
  <AdminTrendCharts />
</div>
```

---

## Benefícios
- Interface mais limpa sem navegação extra
- Todas as informações visíveis em uma única rolagem
- Menor complexidade de código
- Melhor experiência mobile (sem troca de tabs)
