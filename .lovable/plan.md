

## Corrigir envio de mensagem WhatsApp ao adquirir lead

### Problema
Quando o usuario clica em "Adquirir e abrir WhatsApp", a funcao `window.open(whatsappUrl, '_blank')` e bloqueada por popup blockers, especialmente em contextos de iframe e dispositivos moveis. A mensagem nunca chega ao paciente.

### Solucao
Substituir `window.open` por `window.location.href` para redirecionar diretamente ao WhatsApp (funciona em qualquer dispositivo/navegador sem ser bloqueado). Alem disso, adicionar um botao de fallback caso o redirecionamento nao funcione.

### Detalhes tecnicos

**Arquivo: `src/components/hotleads/LeadAcquireDialog.tsx`**

1. Apos o `onConfirm` retornar sucesso, em vez de fechar o dialog e chamar `window.open`:
   - Salvar a URL do WhatsApp em estado local
   - Mostrar uma tela de sucesso dentro do dialog com dois botoes:
     - "Abrir WhatsApp" que usa `window.location.href = whatsappUrl` (redirecionamento direto)
     - "Copiar mensagem" como fallback para copiar o texto manualmente
   - Auto-redirecionar apos 1.5 segundos usando `window.location.href`

2. O fluxo ficara:
   - Usuario clica "Adquirir e abrir WhatsApp"
   - Edge function faz o claim
   - Dialog mostra "Lead adquirido! Abrindo WhatsApp..."
   - Redireciona automaticamente via `window.location.href`
   - Se nao redirecionar, usuario pode clicar no botao manualmente

**Arquivo: `src/pages/HotLeads.tsx`**
- Nenhuma alteracao necessaria (o `handleAcquireConfirm` continua funcionando igual)

### Arquivos alterados
- `src/components/hotleads/LeadAcquireDialog.tsx` — substituir `window.open` por redirecionamento direto + fallback
