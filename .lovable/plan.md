

## Bug: IA encontra FAQ com PDF/mídia mas não consegue enviar ao lead

### Causa Raiz

O FAQ exportado para a base de conhecimento contém URLs de mídia no formato markdown:
```text
[Mídia: Vídeo - https://...fluxo-media/1772200184691.mp4]
[Mídia: Imagem - https://...fluxo-media/1772199936744.jpeg]
```

Quando a IA chama `search_knowledge_base`, ela encontra esse conteúdo e VÊ as URLs. Porém, as ferramentas existentes **não aceitam URLs arbitrárias**:
- `send_image` → busca apenas na galeria `avivar_agent_images`
- `send_video` → busca apenas na galeria `avivar_agent_videos`  
- `send_fluxo_media` → envia apenas mídia de passos do fluxo

A IA não tem ferramenta para enviar uma mídia por URL direta → responde dizendo "não tenho o arquivo configurado".

### Solução

Criar uma nova tool `send_knowledge_media` que aceita uma URL direta e envia via WhatsApp (UazAPI).

**Arquivo: `supabase/functions/avivar-ai-agent/index.ts`**

**1. Nova tool definition** (junto com as outras tools):
```typescript
{
  type: "function",
  function: {
    name: "send_knowledge_media",
    description: "Envia uma mídia (imagem, vídeo, documento/PDF, áudio) encontrada na base de conhecimento ou FAQ diretamente para o lead via WhatsApp. Use quando search_knowledge_base retornar conteúdo com [Mídia: ...] contendo uma URL.",
    parameters: {
      type: "object",
      properties: {
        media_url: { type: "string", description: "URL completa da mídia" },
        media_type: { type: "string", enum: ["image","video","document","audio"], description: "Tipo da mídia" },
        caption: { type: "string", description: "Legenda opcional" }
      },
      required: ["media_url", "media_type"]
    }
  }
}
```

**2. Nova função `sendKnowledgeMedia`**: Reutiliza a mesma lógica de envio via UazAPI (`/send/media`) já usada em `send_image`/`send_video`, mas aceitando URL direta ao invés de buscar na galeria.

**3. Registrar no switch de tools** (`case "send_knowledge_media"`).

**4. Instrução no prompt**: Adicionar regra informando a IA que quando `search_knowledge_base` retornar conteúdo com `[Mídia: Tipo - URL]`, ela deve usar `send_knowledge_media` para enviar o arquivo ao lead, seguindo a mesma regra silenciosa das outras mídias.

### Arquivos alterados
- `supabase/functions/avivar-ai-agent/index.ts` — nova tool + função + instrução no prompt

