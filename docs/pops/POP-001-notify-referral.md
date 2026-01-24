# POP-001: Sistema de Notificação por Email para Indicações

> Procedimento Operacional Padrão para o sistema de envio de emails de indicação.

**Versão:** 1.0  
**Data de Criação:** 2026-01-24  
**Módulo:** Academy / Referral  
**Responsável:** AI Agent

---

## 🎯 Objetivo

Automatizar o envio de emails de notificação quando um formulário de indicação é preenchido, enviando:
1. Email para o **administrador** com dados do indicado
2. Email de **confirmação** para a pessoa indicada

---

## 📋 Passo a Passo de Uso

### Cenário 1: Novo Formulário de Indicação

1. Usuário acessa a landing page de indicação (`/formacao-360/indicacao/:code`)
2. Preenche os dados: Nome, Email, Telefone, CRM (opcional)
3. Clica em "Garantir Desconto"
4. Sistema:
   - Salva os dados na tabela `student_referrals`
   - Invoca a Edge Function `notify-referral`
   - Envia 2 emails automaticamente

### Cenário 2: Reenvio Manual (Admin)

1. Admin acessa `/indique-e-ganhe`
2. Visualiza a lista de indicações
3. Clica no botão "Reenviar" na indicação desejada
4. Sistema reenvia os emails para admin e indicado

---

## 📧 Estrutura dos Emails

### Email para Admin
- **Assunto:** `🎓 Nova Indicação Formação 360: [Nome]`
- **Conteúdo:** 
  - Dados completos do indicado
  - Link para WhatsApp
  - Botão "Ver no Painel Admin"

### Email para Indicado
- **Assunto:** `🎓 Sua inscrição foi recebida - Formação 360° IBRAMEC`
- **Conteúdo:**
  - Confirmação de recebimento
  - Informações sobre o desconto
  - Próximos passos
  - Botão WhatsApp

---

## ⚙️ Configuração Técnica

### Edge Function
- **Nome:** `notify-referral`
- **Localização:** `supabase/functions/notify-referral/index.ts`

### Secrets Necessários
| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `RESEND_API_KEY` | API Key do Resend | ✅ |
| `ADMIN_NOTIFICATION_EMAIL` | Email do admin | ✅ |
| `RESEND_FROM_EMAIL` | Email remetente | ❌ (fallback: onboarding@resend.dev) |

### Payload Esperado
```typescript
interface ReferralData {
  name: string;        // Nome do indicado
  email: string;       // Email do indicado (DESTINO do email)
  phone: string;       // Telefone
  referrer_name?: string;
  referral_code?: string;
  type: 'student_referral' | 'referral_lead';
  has_crm?: boolean;
  crm?: string;
}
```

---

## ✅ Condições Esperadas de Funcionamento

| Condição | Comportamento Esperado |
|----------|------------------------|
| Formulário válido | Emails enviados para admin E indicado |
| Email inválido | Erro retornado, nenhum email enviado |
| Domínio não verificado | Fallback para `onboarding@resend.dev` |
| RESEND_API_KEY ausente | Função retorna sucesso mas pula envio |

---

## ⚠️ Restrições e Exceções

1. **Domínio não verificado no Resend:** O sistema usa fallback automático para `onboarding@resend.dev`
2. **Rate Limiting:** Resend tem limites de envio por minuto
3. **Emails em spam:** Emails enviados via `resend.dev` podem cair em spam

---

## 🧪 Testes

### Teste Manual
1. Preencher formulário com email válido
2. Verificar caixa de entrada do email preenchido
3. Verificar caixa do admin

### Teste via Edge Function
```bash
curl -X POST https://tubzywibnielhcjeswww.supabase.co/functions/v1/notify-referral \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","phone":"21999999999","type":"student_referral"}'
```

---

## 📝 Histórico de Alterações

| Data | Versão | Descrição |
|------|--------|-----------|
| 2026-01-24 | 1.0 | Criação inicial com envio dual (admin + indicado) |
