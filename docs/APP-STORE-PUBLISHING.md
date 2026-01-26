# 📱 Guia de Publicação - App Store & Play Store

> Checklist completo para publicação do NeoHub nas lojas de aplicativos.

---

## ✅ Itens Implementados

### Páginas Legais
- [x] **Política de Privacidade** → `/privacy-policy`
- [x] **Termos de Uso** → `/terms`

### Assets Visuais
- [x] **Ícone do App** → `public/app-icon.png` (1024x1024)
- [x] **Splash Screen** → `public/splash.png` (1080x1920)

### Capacitor & Nativo
- [x] **capacitor.config.ts** configurado com:
  - App ID: `app.lovable.d75807d51df7446daac336166617be60`
  - App Name: `NeoHub`
  - Push Notifications
  - Splash Screen config

### Push Notifications
- [x] **@capacitor/push-notifications** instalado
- [x] **usePushNotifications hook** criado em `src/hooks/usePushNotifications.ts`

### Deep Links
- [x] **@capacitor/app** instalado
- [x] **useDeepLinks hook** criado em `src/hooks/useDeepLinks.ts`
- [x] **apple-app-site-association** em `public/.well-known/`
- [x] **assetlinks.json** em `public/.well-known/`

---

## 📋 Passos para Publicação

### 1. Configuração do Desenvolvedor

#### Apple (iOS)
```bash
# Criar conta Apple Developer ($99/ano)
# https://developer.apple.com/programs/

# Gerar certificados no Xcode:
# - Distribution Certificate
# - Push Notification Certificate
# - App ID com Push capability

# Atualizar apple-app-site-association com seu TEAM_ID
```

#### Google (Android)
```bash
# Criar conta Google Play Console ($25 único)
# https://play.google.com/console

# Gerar keystore:
keytool -genkey -v -keystore neohub-release.keystore \
  -alias neohub -keyalg RSA -keysize 2048 -validity 10000

# Obter SHA256 fingerprint:
keytool -list -v -keystore neohub-release.keystore -alias neohub

# Atualizar assetlinks.json com seu SHA256 fingerprint
```

### 2. Build do Projeto

```bash
# 1. Clone o repositório
git clone [seu-repo]
cd neohub

# 2. Instale dependências
npm install

# 3. Adicione plataformas
npx cap add ios
npx cap add android

# 4. Build para produção
npm run build

# 5. Sincronize com plataformas nativas
npx cap sync
```

### 3. Configuração de Ícones e Splash

```bash
# Copie os assets gerados:
# iOS: ios/App/App/Assets.xcassets/AppIcon.appiconset/
# Android: android/app/src/main/res/mipmap-*/

# Use @capacitor/assets para gerar todos os tamanhos:
npx @capacitor/assets generate --iconBackgroundColor '#0d9488'
```

### 4. Abrir em IDE

```bash
# iOS (requer Mac com Xcode)
npx cap open ios

# Android (requer Android Studio)
npx cap open android
```

### 5. Configurações Finais

#### iOS (Xcode)
1. Selecione seu Team em Signing & Capabilities
2. Adicione capability "Push Notifications"
3. Adicione capability "Associated Domains" com:
   - `applinks:transplant-insight-hub.lovable.app`
4. Configure Background Modes se necessário

#### Android (Android Studio)
1. Configure keystore em `android/app/build.gradle`
2. Adicione `google-services.json` para Firebase (Push)
3. Configure intent-filters para deep links

### 6. Publicação

#### App Store (iOS)
1. Archive em Xcode (Product → Archive)
2. Upload via Xcode ou Transporter
3. Preencha metadados no App Store Connect:
   - Screenshots (6.5", 5.5", iPad)
   - Descrição, Keywords, Categorias
   - URL de suporte e privacidade
4. Submit para Review

#### Play Store (Android)
1. Gere APK/AAB assinado
2. Upload no Google Play Console
3. Preencha ficha da loja:
   - Screenshots, Ícone, Feature graphic
   - Descrição curta e longa
   - Classificação de conteúdo
   - Política de privacidade
4. Rollout para produção

---

## 📝 Metadados Sugeridos

### Título
**NeoHub - Gestão em Saúde**

### Descrição Curta (80 chars)
Plataforma completa para clínicas, pacientes e profissionais de saúde.

### Descrição Longa
```
O NeoHub é a plataforma definitiva para gestão em saúde, conectando clínicas, 
pacientes e profissionais de forma integrada e segura.

✓ Portal do Paciente (NeoCare)
- Agende consultas e procedimentos
- Acompanhe seus tratamentos
- Acesse orientações personalizadas
- Gerencie seus documentos médicos

✓ Portal do Colaborador (NeoTeam)
- Gestão de agendamentos
- Prontuário eletrônico
- Sala de espera digital
- Comunicação integrada

✓ Academia (IBRAMEC)
- Cursos para profissionais de saúde
- Certificações reconhecidas
- Comunidade de networking
- Material didático exclusivo

✓ Segurança e Privacidade
- Criptografia de ponta a ponta
- Conformidade com LGPD
- Controle de acesso granular

Baixe agora e transforme sua experiência em saúde!
```

### Keywords
saúde, clínica, agendamento, paciente, médico, prontuário, LGPD, gestão, consulta

### Categorias
- **iOS**: Medical / Health & Fitness
- **Android**: Medical / Health & Fitness

---

## 🔗 URLs Necessárias

| Recurso | URL |
|---------|-----|
| Política de Privacidade | https://transplant-insight-hub.lovable.app/privacy-policy |
| Termos de Uso | https://transplant-insight-hub.lovable.app/terms |
| Suporte | mailto:contato@neohub.com.br |
| Marketing | https://transplant-insight-hub.lovable.app |

---

## ⚠️ Checklist Final

- [ ] TEAM_ID atualizado em `apple-app-site-association`
- [ ] SHA256 atualizado em `assetlinks.json`
- [ ] Certificado de push configurado (APNs + Firebase)
- [ ] Screenshots em todos os tamanhos necessários
- [ ] Conta de desenvolvedor ativa
- [ ] Testado em dispositivos físicos
- [ ] Build de release sem erros

---

## 📚 Recursos

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [Lovable Mobile Blog Post](https://lovable.dev/blog/mobile-apps)
