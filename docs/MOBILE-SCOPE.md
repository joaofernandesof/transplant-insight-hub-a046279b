# 📱 NeoHub Mobile - Escopo de Publicação

**Versão:** 1.0.0  
**Data:** 2026-01-28  
**Status:** Store-Safe ✅

---

## 🎯 Objetivo

Definir o escopo de módulos disponíveis na versão mobile (iOS/Android via Capacitor) do NeoHub para publicação nas lojas Apple App Store e Google Play Store.

---

## ✅ Módulos Liberados para Mobile

| Módulo | Perfil | Status | Observação |
|--------|--------|--------|------------|
| **Academy** | `aluno` | ✅ Liberado | Cursos, provas, certificados, galerias |
| **NeoLicense** | `licenciado` | ✅ Liberado | Hub do licenciado, materiais, indicações |

---

## ❌ Módulos Bloqueados no Mobile

| Módulo | Motivo do Bloqueio | Impacto |
|--------|-------------------|---------|
| **NeoCare** | Dados sensíveis de pacientes | Segurança |
| **NeoTeam** | Módulo interno de equipe | Operacional |
| **Clínica/Prontuário** | Dados médicos sensíveis | Compliance |
| **Marketplace** | Não otimizado para mobile | UX |
| **Pós-Venda** | Módulo interno | Operacional |
| **IPROMED** | Módulo jurídico interno | Segurança |
| **Avivar** | Não otimizado para mobile | UX |
| **NeoHairScan** | Processamento IA pesado | Performance |
| **Admin** | Administração global | Segurança |
| **Portal Externo** | Sistema legado | Migração |

---

## 🔐 Implementação Técnica

### Detecção de Ambiente
```typescript
import { Capacitor } from '@capacitor/core';
const isNative = Capacitor.isNativePlatform();
```

### Componentes de Controle
- `useMobileEnvironment` - Hook de detecção
- `MobileGuard` - Guard de rotas
- `MobileAppWrapper` - Layout wrapper
- `HideOnMobile` / `ShowOnMobile` - Componentes condicionais

### Tabela de Controle (Banco)
```sql
SELECT * FROM public.mobile_blocked_modules WHERE is_active = true;
```

---

## 📋 Rotas Bloqueadas

```typescript
const BLOCKED_MOBILE_ROUTES = [
  '/neocare',
  '/neoteam',
  '/clinic',
  '/prontuario',
  '/anamnese',
  '/marketplace',
  '/postvenda',
  '/portal',
  '/ipromed',
  '/avivar',
  '/neohairscan',
  '/admin',
];
```

---

## 🛡️ Comportamento de Bloqueio

Quando um usuário tenta acessar um módulo bloqueado no mobile:

1. **Tela de Bloqueio** exibida com mensagem clara
2. **Botão "Voltar"** para navegação anterior
3. **Botão "Ir para Academy"** como fallback
4. **Nenhum dado sensível** exposto

---

## 📊 Justificativa de Escopo Reduzido

O escopo mobile foi reduzido estrategicamente para:

1. **Segurança**: Evitar exposição de dados clínicos/médicos
2. **Compliance**: Atender requisitos de privacidade (LGPD/HIPAA)
3. **Performance**: Garantir experiência fluida
4. **Foco**: Priorizar funcionalidades core para cada perfil
5. **Iteração**: Permitir expansão controlada após aprovação

---

## 📝 Declarações para Stores

### Apple App Store
- App fechado com acesso restrito
- Usuários: alunos e licenciados autenticados
- Sem dados clínicos nesta versão
- Privacidade conforme App Privacy Labels

### Google Play Store
- App requer login para acesso
- Dados pessoais mínimos (nome, email)
- Sem coleta de dados de saúde
- Conforme Data Safety requirements

---

## 🔄 Histórico de Versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0.0 | 2026-01-28 | Definição inicial do escopo mobile |

---

*Documento gerado automaticamente como parte do processo de preparação para publicação mobile.*
