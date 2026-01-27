# Guia de Publicação Mobile - NeoHub

Este documento contém todas as informações necessárias para publicar o aplicativo NeoHub nas lojas App Store (iOS) e Google Play (Android).

## 📱 Visão Geral

O aplicativo mobile é uma versão restrita do sistema NeoHub, focada no módulo Academy para a primeira versão de lançamento nas lojas.

### Módulos Disponíveis no Mobile
- ✅ Academy (cursos, materiais, provas, certificados)
- ✅ Perfil do usuário
- ✅ Notificações

### Módulos Bloqueados no Mobile (Primeira Versão)
- ❌ NeoCare (portal do paciente)
- ❌ NeoTeam (portal do colaborador)
- ❌ Clinic (operação clínica)
- ❌ Prontuário médico
- ❌ Anamnese
- ❌ Marketplace
- ❌ Pós-venda

---

## 🔐 Credenciais para Revisão das Lojas

### App Store (Apple)
```
Email: appstore.reviewer@neofolic.com.br
Senha: ReviewerApp2026!
```

### Google Play Store
```
Email: playstore.reviewer@neofolic.com.br
Senha: ReviewerPlay2026!
```

### Instruções para Revisores
1. Abra o aplicativo
2. Faça login com as credenciais acima
3. Navegue pelo módulo Academy
4. Visualize cursos, materiais e cronogramas
5. Acesse o perfil do usuário

---

## ⚙️ Configuração Técnica

### Capacitor Config
O arquivo `capacitor.config.ts` está configurado para:
- **Produção**: Apontar para `https://transplant-insight-hub.lovable.app`
- **Desenvolvimento**: Hot-reload via Lovable preview

### Feature Flags
Os módulos são controlados via tabela `feature_flags` no banco de dados:
- `mobile_academy_enabled`: true
- `mobile_profile_enabled`: true
- `mobile_notifications_enabled`: true
- Todos os outros módulos sensíveis: false

### Módulos Bloqueados
Lista de módulos bloqueados armazenada em `mobile_blocked_modules`:
- neocare, neoteam, clinic, prontuario, anamnese, marketplace, postvenda

---

## 📋 Checklist de Publicação

### Pré-Requisitos
- [ ] Conta de desenvolvedor Apple ($99/ano)
- [ ] Conta de desenvolvedor Google ($25 única)
- [ ] Certificados de assinatura configurados
- [ ] Ícones e assets em todas as resoluções
- [ ] Screenshots para todas as dimensões de tela
- [ ] Textos de descrição da loja

### Preparação do Build
1. **Atualizar versão** em `package.json`
2. **Build de produção**: `npm run build`
3. **Sync Capacitor**: `npx cap sync`
4. **Testar localmente** antes de submeter

### iOS (App Store)
1. Abrir projeto no Xcode: `npx cap open ios`
2. Configurar signing & capabilities
3. Criar archive: Product → Archive
4. Submeter via App Store Connect
5. Aguardar revisão (1-3 dias úteis)

### Android (Play Store)
1. Abrir projeto no Android Studio: `npx cap open android`
2. Gerar APK/AAB assinado: Build → Generate Signed Bundle
3. Upload no Google Play Console
4. Submeter para revisão (1-3 dias úteis)

---

## 🔒 Segurança

### Políticas Implementadas
1. **RLS no Backend**: Todas as tabelas têm Row Level Security
2. **Feature Flags**: Controle centralizado de módulos
3. **Mobile Guards**: Bloqueio de rotas no frontend
4. **Perfil Limitado**: Usuários mobile têm acesso restrito

### Proteção de Dados Sensíveis
- Prontuários médicos: Bloqueados no mobile
- Dados de pacientes: Inacessíveis via app
- Informações clínicas: Apenas via web

---

## 🚀 Deploy Edge Functions

Antes de publicar, certifique-se de que a Edge Function de teste está deployada:

```bash
# Criar usuários de teste
npx supabase functions invoke setup-mobile-test-users
```

---

## 📞 Suporte

Em caso de problemas durante a revisão:
- Email: suporte@neofolic.com.br
- Documentação: docs/APP-STORE-PUBLISHING.md

---

## Histórico de Versões

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-01 | Primeira versão - apenas Academy |

---

*Documento gerado automaticamente - NeoHub Mobile Publishing Guide*
