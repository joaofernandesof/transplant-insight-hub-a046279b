# 📋 Documentação: Acesso Público Seguro do NeoHub Web

## Visão Geral

Esta documentação descreve as implementações de segurança para tornar o NeoHub acessível publicamente via web com controle restrito de acesso.

---

## 🔐 Arquitetura de Acesso

### Níveis de Acesso

| Perfil | Acesso | Como é criado |
|--------|--------|---------------|
| Visitante Público | Landing page apenas | Automático |
| Usuário Autorizado | Portais conforme RBAC | Via admin/script interno |
| Administrador | Acesso total | Via banco de dados |

### Rotas Públicas

- `/` - Landing page (sem login)
- `/login` - Tela de login (sem cadastro)
- `/reset-password` - Recuperação de senha
- `/privacy-policy` - Política de privacidade
- `/terms` - Termos de serviço
- `/public/dashboard/:token` - Dashboards compartilhados

### Rotas Protegidas

Todas as demais rotas exigem autenticação válida:
- `/academy/*` - Portal do Aluno
- `/neoteam/*` - Portal do Colaborador
- `/neocare/*` - Portal do Paciente
- `/neolicense/*` - Portal do Licenciado
- `/avivar/*` - Marketing
- `/ipromed/*` - Jurídico
- `/vision/*` - Diagnóstico IA
- `/admin-*` - Áreas administrativas

---

## 🛡️ Medidas de Segurança Implementadas

### 1. Cadastro Desabilitado

- ❌ Botão "Criar conta" removido da interface
- ❌ Formulário de signup eliminado do código
- ✅ Apenas login e recuperação de senha disponíveis
- ✅ Mensagem clara: "Acesso restrito a usuários autorizados"

### 2. Session Timeout (30 minutos)

```typescript
// src/hooks/useSessionTimeout.ts
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_BEFORE_MS = 2 * 60 * 1000;   // Aviso 2 min antes
```

- Inatividade de 30 minutos = logout automático
- Aviso visual 2 minutos antes da expiração
- Reset automático ao interagir (mouse, teclado, scroll)

### 3. Proteção de Rotas (Guards)

```tsx
// Todas as rotas protegidas usam:
<ProtectedRoute>
  <ProfileGuard allowedProfiles={['aluno', 'administrador']}>
    <AcademyRoutes />
  </ProfileGuard>
</ProtectedRoute>
```

- `ProtectedRoute`: Exige login válido
- `ProfileGuard`: Verifica perfil NeoHub
- `AdminRoute`: Exige role admin
- `MobileGuard`: Bloqueia módulos no mobile

### 4. RBAC via RPC

```sql
-- Verificação de permissões via get_user_context()
SELECT public.get_user_context();
-- Retorna: user, profiles, permissions, modules, is_admin
```

### 5. robots.txt Restritivo

```
User-agent: *
Disallow: /

# Apenas landing permitida para SEO mínimo
User-agent: Googlebot
Allow: /$
```

---

## 📄 Arquivos Criados/Modificados

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/LandingPage.tsx` | Landing page pública |
| `src/hooks/useSessionTimeout.ts` | Controle de expiração de sessão |

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Login.tsx` | Removido signup, adicionado aviso de acesso restrito |
| `src/App.tsx` | Adicionada landing como rota `/`, SessionManager |
| `public/robots.txt` | Bloqueio de indexação |

---

## 🧪 Checklist de Testes

- [x] Landing aparece publicamente sem login
- [x] Login funciona com usuário criado internamente
- [x] Nenhum botão de cadastro está visível
- [x] Menu só exibe o que o perfil pode acessar
- [x] Login inválido mostra mensagem clara
- [x] Deep links bloqueados redirecionam para login
- [x] Session timeout funciona após 30 min de inatividade
- [x] Logout visível e funcional

---

## 🚀 Como Criar Usuários

### Via Admin Panel (UI)

1. Acesse `/admin-panel` como administrador
2. Vá em "Gestão de Usuários"
3. Clique em "Adicionar Usuário"
4. Preencha dados e selecione perfis

### Via Edge Function

```bash
# Endpoint: add-single-student
curl -X POST \
  https://tubzywibnielhcjeswww.supabase.co/functions/v1/add-single-student \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -d '{"email": "novo@email.com", "full_name": "Nome", "profile": "aluno"}'
```

### Via SQL (último recurso)

```sql
-- 1. Criar usuário no auth.users
-- 2. Criar entrada em neohub_users
-- 3. Adicionar perfil em neohub_user_profiles
-- Ver documentação RBAC para detalhes
```

---

## 📞 Suporte

Dúvidas sobre acesso? Entre em contato com o administrador do sistema.
