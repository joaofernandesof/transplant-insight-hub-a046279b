

## Correção do redirecionamento WhatsApp ao adquirir HotLead

### Problema Identificado

Ao adquirir um lead, o sistema abre `https://wa.me/{telefone}?text=...` que redireciona para `api.whatsapp.com/send/...`. Esse dominio esta sendo bloqueado pelo navegador (ERR_BLOCKED_BY_RESPONSE), provavelmente porque a abertura vem de dentro do iframe de preview do Lovable.

O numero do telefone **ja e dinamico** no codigo (`lead.phone`). O problema e exclusivamente o bloqueio do redirecionamento.

### Solucao

1. **Trocar o dominio do link** de `https://wa.me/` para `https://web.whatsapp.com/send/` que tende a funcionar melhor em navegadores desktop
2. **Adicionar fallback**: se o `window.open` falhar ou for bloqueado, copiar o link para a area de transferencia e mostrar um toast com instrucoes para o usuario abrir manualmente

### Detalhes Tecnicos

**Arquivo**: `src/hooks/useHotLeadsSettings.ts` (linha 77)

- Mudar a URL de `https://wa.me/${fullPhone}?text=...` para `https://api.whatsapp.com/send?phone=${fullPhone}&text=...` -- na verdade, usar `https://wa.me/` mesmo, pois e o formato oficial e mais compativel
- O problema real e que o preview iframe bloqueia popups. A solucao e detectar quando o `window.open` retorna `null` (bloqueado) e oferecer alternativa

**Arquivo**: `src/components/hotleads/LeadAcquireDialog.tsx` (linhas 40-47)

- Adicionar tratamento para quando `window.open` retorna `null` (popup bloqueado)
- Mostrar toast com o link copiado para clipboard como fallback
- Manter o formato `wa.me/` que e o padrao oficial do WhatsApp

### Mudancas

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/hotleads/LeadAcquireDialog.tsx` | Adicionar fallback quando popup e bloqueado: copiar link + toast informativo |
| `src/hooks/useHotLeadsSettings.ts` | Nenhuma mudanca necessaria - URL ja esta correta com `wa.me/` |

### Resultado Esperado

- Se o navegador permitir, abre WhatsApp normalmente com telefone e mensagem pre-preenchidos
- Se for bloqueado (como no preview), copia o link para clipboard e mostra mensagem orientando o usuario a colar no navegador

