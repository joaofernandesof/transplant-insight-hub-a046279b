# NeoHub - Guia de Arquitetura Completo
## Documentação para Desenvolvimento de Portais e Módulos

---

## 1. VISÃO GERAL DO ECOSSISTEMA

O NeoHub é um ecossistema SaaS de gestão para clínicas capilares composto por **10 portais unificados**:

| Portal | Descrição | Rota Base |
|--------|-----------|-----------|
| **Admin** | Administração central do sistema | `/admin` |
| **NeoTeam** | Gestão de equipe e operações | `/neoteam` |
| **NeoCare** | Portal do paciente | `/portal` |
| **Academy** | Educação e treinamentos | `/academy` |
| **NeoLicense** | Portal do licenciado/franqueado | `/neolicense` |
| **Avivar** | Marketing, CRM e IA | `/avivar` |
| **IPROMED** | Jurídico e compliance | `/ipromed` |
| **Vision** | Análise capilar com IA | `/vision` |
| **NeoPay** | Pagamentos e financeiro | `/neopay` |
| **NeoHair** | Tratamento capilar | `/neohair` |

---

## 2. ESTRUTURA DE DIRETÓRIOS

```
src/
├── components/           # Componentes compartilhados globais
│   ├── ui/              # Componentes shadcn/ui
│   ├── guards/          # Guards de proteção de rotas
│   │   └── UnifiedGuards.tsx
│   └── shared/          # Componentes reutilizáveis
│
├── contexts/            # Contextos React globais
│   ├── UnifiedAuthContext.tsx  # ⭐ CONTEXTO PRINCIPAL DE AUTH
│   ├── AuthContext.tsx         # Wrapper de compatibilidade
│   └── ...
│
├── hooks/               # Hooks globais compartilhados
│
├── integrations/        # Integrações externas
│   └── supabase/
│       ├── client.ts    # ❌ NÃO EDITAR
│       └── types.ts     # ❌ NÃO EDITAR
│
├── lib/                 # Utilitários e helpers
│
├── pages/               # Páginas e portais
│   ├── admin/           # Portal Admin
│   ├── ipromed/         # Portal IPROMED
│   └── Index.tsx        # Landing Page
│
├── neohub/              # Core do NeoHub
│   ├── components/      # Componentes do hub
│   ├── contexts/        # Contextos específicos
│   ├── hooks/           # Hooks específicos
│   └── NeoHubApp.tsx    # App principal
│
├── portal/              # Portal NeoCare (paciente)
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   └── PortalApp.tsx
│
└── App.tsx              # Roteamento principal
```

---

## 3. SISTEMA DE AUTENTICAÇÃO (CRÍTICO)

### 3.1 UnifiedAuthContext - O Coração do Sistema

**Arquivo:** `src/contexts/UnifiedAuthContext.tsx`

Este é o contexto CENTRAL de autenticação. TODOS os portais devem usar este contexto.

```typescript
// SEMPRE importe assim:
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

// Tipos principais:
type NeoHubProfile = 
  | 'administrador' 
  | 'colaborador' 
  | 'paciente' 
  | 'aluno' 
  | 'licenciado' 
  | 'ipromed';

type Portal = 
  | 'admin' 
  | 'neoteam' 
  | 'neocare' 
  | 'academy' 
  | 'neolicense' 
  | 'avivar' 
  | 'ipromed' 
  | 'vision' 
  | 'neopay' 
  | 'neohair';

// Interface do usuário unificado:
interface UnifiedUser {
  id: string;              // ID na tabela neohub_users
  authUserId: string;      // ID no auth.users do Supabase
  email: string;
  fullName: string;
  profiles: NeoHubProfile[];
  activeProfile: NeoHubProfile | null;
  isAdmin: boolean;
  // ... outros campos
}

// Hook principal:
const {
  user,              // UnifiedUser | null
  session,           // Session do Supabase
  isLoading,         // boolean
  isAdmin,           // boolean
  activeProfile,     // NeoHubProfile | null
  hasProfile,        // (profile: NeoHubProfile) => boolean
  canAccess,         // (portal: Portal) => boolean
  setActiveProfile,  // (profile: NeoHubProfile) => void
  login,             // (email, password) => Promise
  signup,            // (data) => Promise
  logout,            // () => Promise
} = useUnifiedAuth();
```

### 3.2 Mapeamento Perfil → Portal

```typescript
const PROFILE_PORTAL_MAP: Record<NeoHubProfile, Portal[]> = {
  'administrador': ['admin', 'neoteam', 'neocare', 'academy', 'neolicense', 'avivar', 'ipromed', 'vision', 'neopay', 'neohair'],
  'colaborador': ['neoteam', 'neocare'],
  'paciente': ['neocare'],
  'aluno': ['academy'],
  'licenciado': ['neolicense', 'avivar'],
  'ipromed': ['ipromed'],
};
```

### 3.3 Wrappers de Compatibilidade

Para manter compatibilidade com código legado, existem wrappers:

```typescript
// Portal legado (NeoCare)
import { usePortalAuth } from '@/portal/contexts/PortalAuthContext';

// NeoHub legado
import { useNeoHubAuth } from '@/neohub/contexts/NeoHubAuthContext';

// Auth legado geral
import { useAuth } from '@/contexts/AuthContext';
```

**⚠️ Para NOVO código, sempre use `useUnifiedAuth` diretamente!**

---

## 4. GUARDS DE PROTEÇÃO DE ROTAS

**Arquivo:** `src/components/guards/UnifiedGuards.tsx`

### 4.1 Tipos de Guards Disponíveis

```typescript
// 1. ProtectedRoute - Apenas verifica autenticação
<ProtectedRoute>
  <MinhaPage />
</ProtectedRoute>

// 2. RouteGuard - Proteção com permissões
<RouteGuard 
  adminOnly={true}           // Apenas admins
  allowedProfiles={['colaborador', 'administrador']}
  requiredModule="agenda"    // Módulo necessário
  fallbackRoute="/unauthorized"
>
  <MinhaPage />
</RouteGuard>

// 3. ProfileGuard - Exige perfil ativo específico
<ProfileGuard allowedProfiles={['paciente']}>
  <AreaDoPaciente />
</ProfileGuard>

// 4. PortalGuard - Proteção por portal
<PortalGuard portal="neoteam">
  <NeoTeamApp />
</PortalGuard>

// 5. AdminRoute - Atalho para rotas admin
<AdminRoute>
  <PainelAdmin />
</AdminRoute>

// 6. ComponentGuard - Proteção de componentes (não rotas)
<ComponentGuard adminOnly fallback={<span>Sem acesso</span>}>
  <BotaoSensivel />
</ComponentGuard>
```

---

## 5. PADRÃO PARA CRIAR UM NOVO PORTAL

### 5.1 Estrutura de Diretórios

```
src/pages/meuportal/
├── MeuPortalApp.tsx        # Componente principal com rotas
├── components/
│   ├── MeuPortalLayout.tsx # Layout com sidebar
│   └── MeuPortalSidebar.tsx
├── pages/
│   ├── MeuPortalHome.tsx   # Dashboard principal
│   ├── MeuPortalSettings.tsx
│   └── ...
└── hooks/
    └── useMeuPortalData.ts
```

### 5.2 Componente Principal do Portal

```typescript
// src/pages/meuportal/MeuPortalApp.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalGuard } from '@/components/guards/UnifiedGuards';
import MeuPortalLayout from './components/MeuPortalLayout';
import MeuPortalHome from './pages/MeuPortalHome';

export default function MeuPortalApp() {
  return (
    <PortalGuard portal="meuportal">
      <MeuPortalLayout>
        <Routes>
          <Route path="/" element={<MeuPortalHome />} />
          <Route path="settings" element={<MeuPortalSettings />} />
          <Route path="*" element={<Navigate to="/meuportal" replace />} />
        </Routes>
      </MeuPortalLayout>
    </PortalGuard>
  );
}
```

### 5.3 Layout Padrão

```typescript
// src/pages/meuportal/components/MeuPortalLayout.tsx
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import MeuPortalSidebar from "./MeuPortalSidebar";

interface MeuPortalLayoutProps {
  children: ReactNode;
}

export default function MeuPortalLayout({ children }: MeuPortalLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <MeuPortalSidebar 
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />
      
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-60"
      )}>
        {children}
      </main>
    </div>
  );
}
```

### 5.4 Registrar no Roteamento Principal

```typescript
// src/App.tsx
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const MeuPortalApp = lazy(() => import('./pages/meuportal/MeuPortalApp'));

function App() {
  return (
    <Routes>
      {/* ... outras rotas ... */}
      
      <Route 
        path="/meuportal/*" 
        element={
          <Suspense fallback={<Loading />}>
            <MeuPortalApp />
          </Suspense>
        } 
      />
    </Routes>
  );
}
```

### 5.5 Adicionar ao UnifiedAuthContext

Se for um novo portal, adicione ao tipo `Portal`:

```typescript
// src/contexts/UnifiedAuthContext.tsx

// 1. Adicionar ao tipo Portal
export type Portal = 
  | 'admin' 
  | 'neoteam' 
  // ... existentes ...
  | 'meuportal';  // ← NOVO

// 2. Adicionar ao mapeamento de perfis
const PROFILE_PORTAL_MAP: Record<NeoHubProfile, Portal[]> = {
  'administrador': [...existentes, 'meuportal'],
  'colaborador': [...existentes], // se tiver acesso
  // ...
};
```

---

## 6. PADRÃO PARA CRIAR UM NOVO MÓDULO

Módulos são funcionalidades DENTRO de um portal existente.

### 6.1 Estrutura

```
src/pages/meuportal/
├── modules/
│   └── meumodulo/
│       ├── MeuModuloPage.tsx
│       ├── components/
│       │   ├── MeuModuloList.tsx
│       │   └── MeuModuloForm.tsx
│       └── hooks/
│           └── useMeuModulo.ts
```

### 6.2 Adicionar Rota ao Portal

```typescript
// MeuPortalApp.tsx
<Routes>
  <Route path="/" element={<MeuPortalHome />} />
  <Route path="meu-modulo" element={<MeuModuloPage />} />
  <Route path="meu-modulo/:id" element={<MeuModuloDetails />} />
</Routes>
```

### 6.3 Adicionar ao Menu/Sidebar

```typescript
// MeuPortalSidebar.tsx
const menuItems = [
  { icon: Home, label: 'Início', path: '/meuportal' },
  { icon: Package, label: 'Meu Módulo', path: '/meuportal/meu-modulo' },
];
```

---

## 7. BANCO DE DADOS - TABELAS PRINCIPAIS

### 7.1 Estrutura de Usuários (RBAC)

```sql
-- Tabela central de usuários
CREATE TABLE neohub_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cpf TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de perfis (relacionamento 1:N)
CREATE TABLE neohub_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES neohub_users(id),
  profile TEXT NOT NULL, -- 'administrador', 'colaborador', etc.
  is_active BOOLEAN DEFAULT true,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES neohub_users(id)
);

-- Índice para busca rápida
CREATE INDEX idx_user_profiles ON neohub_user_profiles(user_id, profile);
```

### 7.2 RLS Policies Padrão

```sql
-- Habilitar RLS
ALTER TABLE minha_tabela ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem seus próprios dados
CREATE POLICY "Users can view own data" 
ON minha_tabela FOR SELECT 
USING (auth.uid() = user_id);

-- Policy para admins verem tudo
CREATE POLICY "Admins can view all" 
ON minha_tabela FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM neohub_user_profiles 
    WHERE user_id = (SELECT id FROM neohub_users WHERE auth_user_id = auth.uid())
    AND profile = 'administrador'
  )
);
```

---

## 8. COMPONENTES UI PADRÃO

### 8.1 Imports Obrigatórios

```typescript
// Sempre use componentes do shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

// Utilitários
import { cn } from "@/lib/utils";

// Ícones
import { Home, Settings, Users } from "lucide-react";

// Toast/Notificações
import { toast } from "sonner";
```

### 8.2 Cores e Tokens (CRÍTICO)

**NUNCA use cores hardcoded!** Use tokens semânticos:

```typescript
// ❌ ERRADO
<div className="bg-blue-500 text-white">

// ✅ CORRETO
<div className="bg-primary text-primary-foreground">

// Tokens disponíveis:
// - background, foreground
// - primary, primary-foreground
// - secondary, secondary-foreground
// - muted, muted-foreground
// - accent, accent-foreground
// - destructive, destructive-foreground
// - border, input, ring
```

---

## 9. HOOKS PADRÃO

### 9.1 Hook de Dados com React Query

```typescript
// hooks/useMeusDados.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMeusDados() {
  return useQuery({
    queryKey: ['meus-dados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCriarDado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (novoDado: NovoDadoType) => {
      const { data, error } = await supabase
        .from('minha_tabela')
        .insert(novoDado)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-dados'] });
      toast.success('Criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar: ' + error.message);
    },
  });
}
```

---

## 10. CHECKLIST PARA NOVO PORTAL/MÓDULO

### Novo Portal
- [ ] Criar diretório em `src/pages/meuportal/`
- [ ] Criar `MeuPortalApp.tsx` com rotas
- [ ] Criar `MeuPortalLayout.tsx` e `MeuPortalSidebar.tsx`
- [ ] Adicionar rota em `src/App.tsx` com lazy loading
- [ ] Adicionar tipo ao `Portal` em `UnifiedAuthContext.tsx`
- [ ] Mapear perfis que têm acesso em `PROFILE_PORTAL_MAP`
- [ ] Usar `PortalGuard` para proteger o portal
- [ ] Adicionar ao grid de portais na Landing Page
- [ ] Criar tabelas necessárias com RLS

### Novo Módulo
- [ ] Criar diretório em `src/pages/portal/modules/meumodulo/`
- [ ] Criar página principal e componentes
- [ ] Adicionar rota no `PortalApp.tsx` do portal pai
- [ ] Adicionar item no menu/sidebar
- [ ] Criar hooks de dados se necessário
- [ ] Adicionar guards de permissão se necessário

---

## 11. REGRAS IMPORTANTES

1. **NUNCA edite arquivos auto-gerados:**
   - `src/integrations/supabase/client.ts`
   - `src/integrations/supabase/types.ts`
   - `supabase/config.toml`
   - `.env`

2. **Sempre use `useUnifiedAuth`** para novo código de autenticação

3. **Lazy loading obrigatório** para páginas de portal

4. **RLS obrigatório** em todas as tabelas com dados de usuário

5. **Tokens semânticos** para cores - nunca hardcode

6. **React Query** para gerenciamento de estado do servidor

7. **Toast (sonner)** para feedback ao usuário

8. **Componentes shadcn/ui** como base de UI

---

## 12. EXEMPLO COMPLETO: MINI PORTAL

```typescript
// src/pages/exemplo/ExemploApp.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalGuard } from '@/components/guards/UnifiedGuards';
import { Loader2 } from 'lucide-react';

const ExemploLayout = lazy(() => import('./components/ExemploLayout'));
const ExemploHome = lazy(() => import('./pages/ExemploHome'));

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ExemploApp() {
  return (
    <PortalGuard portal="exemplo">
      <Suspense fallback={<Loading />}>
        <ExemploLayout>
          <Routes>
            <Route path="/" element={<ExemploHome />} />
            <Route path="*" element={<Navigate to="/exemplo" replace />} />
          </Routes>
        </ExemploLayout>
      </Suspense>
    </PortalGuard>
  );
}
```

---

**Documento gerado em:** 2026-02-01  
**Versão:** 1.0  
**Sistema:** NeoHub - Transplant Insight Hub
