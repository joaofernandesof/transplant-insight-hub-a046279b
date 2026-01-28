# 📋 Checklist de QA Mobile - NeoHub

**Data:** 2026-01-28  
**Versão:** 1.0.0

---

## 🔧 Pré-requisitos

- [ ] Projeto exportado para GitHub
- [ ] `npm install` executado
- [ ] `npx cap add ios` (para iOS)
- [ ] `npx cap add android` (para Android)
- [ ] `npm run build` executado
- [ ] `npx cap sync` executado

---

## 📱 Testes de Inicialização

### Splash Screen
- [ ] Splash screen exibe por 2 segundos
- [ ] Logo NeoHub visível
- [ ] Transição suave para login

### Login
- [ ] Tela de login carrega corretamente
- [ ] Campos email/senha funcionais
- [ ] Validação de campos
- [ ] Botão "Esqueci senha" funcional
- [ ] Login com credenciais válidas
- [ ] Erro com credenciais inválidas
- [ ] Redirecionamento pós-login correto

---

## 🎓 Testes Academy (Perfil: Aluno)

### Navegação
- [ ] Home Academy carrega
- [ ] Menu lateral correto
- [ ] Tabs funcionais
- [ ] Back button funciona

### Funcionalidades
- [ ] Lista de cursos visível
- [ ] Detalhes do curso abre
- [ ] Provas disponíveis
- [ ] Realização de prova funcional
- [ ] Certificados acessíveis
- [ ] Galeria de fotos funcional
- [ ] Perfil editável

---

## 🏢 Testes NeoLicense (Perfil: Licenciado)

### Navegação
- [ ] Home NeoLicense carrega
- [ ] Menu lateral correto
- [ ] Cards de módulos visíveis

### Funcionalidades
- [ ] Universidade ByNeofolic acessível
- [ ] Central de Materiais funcional
- [ ] Download de materiais
- [ ] Sistema de indicações
- [ ] Perfil editável

---

## 🚫 Testes de Bloqueio

### Rotas Bloqueadas
- [ ] `/neocare` → Tela de bloqueio
- [ ] `/neoteam` → Tela de bloqueio
- [ ] `/clinic` → Tela de bloqueio
- [ ] `/ipromed` → Tela de bloqueio
- [ ] `/avivar` → Tela de bloqueio
- [ ] `/neohairscan` → Tela de bloqueio
- [ ] `/admin` → Tela de bloqueio

### Deep Links
- [ ] Deep link para rota liberada → OK
- [ ] Deep link para rota bloqueada → Tela de bloqueio
- [ ] Deep link inválido → Fallback correto

---

## 🎨 Testes de UI/UX

### Visual
- [ ] Cores consistentes
- [ ] Fontes legíveis
- [ ] Espaçamentos adequados
- [ ] Modo escuro/claro funcional
- [ ] Sem overflow de texto

### Interação
- [ ] Touch responsivo
- [ ] Scroll suave
- [ ] Pull-to-refresh onde aplicável
- [ ] Gestos nativos funcionais
- [ ] Keyboard handling correto

### Loading States
- [ ] Skeletons visíveis durante carregamento
- [ ] Loaders para ações assíncronas
- [ ] Sem telas brancas

---

## 📶 Testes de Conectividade

### Online
- [ ] Todas funcionalidades operam normalmente
- [ ] Dados sincronizados

### Offline
- [ ] Mensagem clara de "Sem conexão"
- [ ] App não quebra
- [ ] Reconexão automática

---

## 🔔 Testes de Push Notifications

- [ ] Permissão solicitada corretamente
- [ ] Aceitar permissão funciona
- [ ] Negar permissão não quebra app
- [ ] Recebimento de notificação
- [ ] Tap em notificação abre app
- [ ] Deep link via notificação

---

## 🔐 Testes de Segurança

- [ ] Token de autenticação armazenado seguramente
- [ ] Logout limpa sessão
- [ ] Dados sensíveis não expostos
- [ ] Console sem logs sensíveis
- [ ] Nenhuma chamada a módulos bloqueados

---

## ⚡ Testes de Performance

### Carregamento
- [ ] Splash → Login < 3s
- [ ] Login → Home < 2s
- [ ] Navegação entre telas < 1s

### Memória
- [ ] Sem memory leaks
- [ ] App não fecha inesperadamente

### Bateria
- [ ] Consumo razoável em uso
- [ ] Baixo consumo em background

---

## 📱 Testes por Dispositivo

### iOS
- [ ] iPhone SE (tela pequena)
- [ ] iPhone 14/15 (tela média)
- [ ] iPhone Pro Max (tela grande)
- [ ] iPad (opcional)

### Android
- [ ] Tela 5" (pequena)
- [ ] Tela 6" (média)
- [ ] Tela 6.7"+ (grande)
- [ ] Tablet (opcional)

---

## 📊 Resumo de Testes

| Categoria | Passou | Total |
|-----------|--------|-------|
| Inicialização | /3 | 3 |
| Academy | /9 | 9 |
| NeoLicense | /6 | 6 |
| Bloqueio | /10 | 10 |
| UI/UX | /14 | 14 |
| Conectividade | /4 | 4 |
| Push | /6 | 6 |
| Segurança | /5 | 5 |
| Performance | /5 | 5 |
| **TOTAL** | **/62** | **62** |

---

## 📝 Issues Encontradas

| # | Descrição | Severidade | Status |
|---|-----------|------------|--------|
| - | - | - | - |

---

## ✅ Aprovação

- [ ] **QA Aprovado** - Pronto para submissão
- [ ] **QA Reprovado** - Requer correções

**Testador:**  
**Data:**  

---

*Checklist para validação manual antes da submissão às lojas.*
