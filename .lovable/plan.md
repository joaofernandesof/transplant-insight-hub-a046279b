

# Preparação do NeoHub para Apple App Store + HotLeads no Mobile

## Resumo

Preparar o NeoHub para submissão na Apple App Store e adicionar o módulo HotLeads como terceiro portal disponível no mobile (ao lado de Academy e NeoLicense).

---

## 1. Liberar HotLeads no Mobile

**Arquivo:** `src/hooks/useMobileEnvironment.ts`

- Remover `'hotleads'` e sub-módulos do array `BLOCKED_MOBILE_MODULES` (linhas ~68-70 referentes a hotleads, se existirem indiretamente via neolicense)
- Remover `/hotleads` do array `BLOCKED_MOBILE_ROUTES` (atualmente não está listado explicitamente, mas confirmar que não há bloqueio indireto)
- Nota: `/hotleads` atualmente NAO está em `BLOCKED_MOBILE_ROUTES`, então o módulo já passa pelo guard de rotas. Porém os módulos `neolicense_hotleads` relacionados podem precisar de ajuste.

**Arquivo:** `src/components/MobileAppWrapper.tsx`

- Garantir que `/hotleads` não é bloqueado pela lógica de `isRouteBlockedOnMobile`

**Arquivo:** `src/components/guards/MobileGuard.tsx`

- Garantir que o `MobileGuard` permite o módulo `hotleads` em ambiente nativo

---

## 2. Configuração iOS para Apple App Store

**Arquivo:** `capacitor.config.ts`

- Aprimorar a seção `ios` com configurações específicas para App Store:
  - `allowsLinkPreview: true`
  - Garantir `scheme: 'NeoHub'`
  - Adicionar comentários sobre Associated Domains e Push Notifications capabilities

**Arquivo:** `public/.well-known/apple-app-site-association`

- Já existe e está configurado. Necessário apenas lembrete para substituir `TEAM_ID` pelo ID real do time Apple Developer.

---

## 3. Atualizar Documentação

**Arquivo:** `docs/MOBILE-SCOPE.md`

- Adicionar HotLeads na tabela de "Modulos Liberados para Mobile" com perfil `licenciado`
- Atualizar versão para 1.1.0

**Arquivo:** `docs/MOBILE-PUBLISHING-GUIDE.md`

- Adicionar HotLeads na lista de módulos disponíveis
- Atualizar credenciais de teste para incluir perfil licenciado
- Adicionar instruções específicas para revisores acessarem HotLeads
- Atualizar descrição da loja para incluir funcionalidade de leads

**Arquivo:** `docs/MOBILE-STORE-COMPLIANCE.md`

- Adicionar HotLeads no escopo funcional
- Atualizar públicos-alvo (agora inclui licenciados com acesso a leads)
- Revisar Apple App Privacy Labels (sem novos dados coletados)
- Atualizar versão para 1.1.0

**Arquivo:** `docs/APP-STORE-PUBLISHING.md`

- Atualizar descrição longa da loja para incluir HotLeads
- Atualizar keywords com termos relevantes (leads, captação, clínica)

---

## 4. Usuário de Teste para Review das Stores

**Arquivo:** `supabase/functions/setup-mobile-test-users/index.ts`

- Adicionar um terceiro usuário de teste com perfil `licenciado` para que os revisores da Apple/Google possam testar o módulo HotLeads
- Credenciais: `appstore.reviewer.licensee@neofolic.com.br` / `ReviewerLicensee2026!`
- Atualizar `storeSubmissionInfo` com instruções para o fluxo de HotLeads

---

## 5. Profile Selector - Mostrar HotLeads no Mobile

**Arquivo:** `src/neohub/pages/ProfileSelector.tsx`

- Garantir que o card HotLeads aparece desbloqueado no mobile para perfis `licenciado`
- A lógica de `canAccessModule` já verifica permissões, então com HotLeads liberado das listas de bloqueio, deve funcionar automaticamente

---

## Detalhes Técnicos

### Alterações no `useMobileEnvironment.ts`:

A rota `/hotleads` ja NAO está na lista `BLOCKED_MOBILE_ROUTES`. No entanto, a verificação no `MobileAppWrapper` usa `isRouteBlockedOnMobile()` que checa prefixos. Como `/hotleads` não tem prefixo em nenhuma rota bloqueada, ja esta liberada tecnicamente. A alteração principal é garantir que os módulos `hotleads`-related não estão nos `BLOCKED_MOBILE_MODULES`.

### Alterações no Edge Function:

Adicionar user de teste licenciado com:
- Permissões de `neolicense_hotleads:read`
- Perfil ativo `licenciado`
- Enrollment em HotLeads

### Sequência de implementação:

1. Atualizar `useMobileEnvironment.ts` (garantir hotleads desbloqueado)
2. Atualizar edge function de teste
3. Atualizar todos os 4 docs
4. Aprimorar `capacitor.config.ts` para iOS
5. Deploy da edge function atualizada
