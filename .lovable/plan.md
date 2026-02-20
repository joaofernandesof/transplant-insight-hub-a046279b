

## Correcao definitiva do redirecionamento WhatsApp

### Problema Real

O `window.open` abre a nova aba com sucesso (retorna um objeto, nao `null`), porem a pagina `wa.me` redireciona para `api.whatsapp.com` que responde com headers que bloqueiam a exibicao quando a origem e um iframe (ERR_BLOCKED_BY_RESPONSE). O fallback atual so atua quando `popup === null`, entao nao cobre esse cenario.

### Solucao

Mudar a estrategia: em vez de tentar abrir e depois fazer fallback, **sempre copiar o link para o clipboard** e mostrar um toast com um botao/link clicavel para o usuario abrir manualmente. Isso garante funcionamento em qualquer ambiente.

### Mudancas

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/hotleads/LeadAcquireDialog.tsx` | Remover `window.open`. Sempre copiar URL para clipboard + exibir toast com link clicavel |

### Detalhes Tecnicos

**Arquivo**: `src/components/hotleads/LeadAcquireDialog.tsx`

Na funcao `handleConfirm`, apos gerar a `whatsappUrl`:

1. Copiar automaticamente para o clipboard com `navigator.clipboard.writeText`
2. Exibir um toast de sucesso com a instrucao "Link copiado! Clique aqui ou cole no navegador"
3. Incluir no toast um botao/action que faz `window.open` (caso o usuario esteja fora do iframe, funcionara)
4. Remover a tentativa direta de `window.open` que causa o erro visivel ao usuario

Isso elimina completamente o cenario onde o usuario ve a pagina de erro do `api.whatsapp.com`.

