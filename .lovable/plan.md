

## Plan: Add Media Support to FAQ Answers

### Current State
- FAQ items have `{ id, pergunta, resposta }` — text only
- `FluxoStepMediaPicker` already exists with full media upload support (audio ptt/file, image, video, document) with forwarded toggle, using `avivar-media` storage bucket
- The `FluxoStepMedia` type from `types.ts` already defines `{ type, url, name, audio_type?, audio_forward? }`

### Changes

#### 1. Extend FAQ Item type to support media
Update `FAQItem` interface in both `StepFAQGenerator.tsx` and `AvivarSimpleWizard.tsx` to add optional media fields:
```typescript
interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
  media?: FluxoStepMedia;       // attached media (image/audio/video)
  isEditing?: boolean;
}
```

#### 2. Update `StepFAQGenerator.tsx` — Add media picker to answer form
- Import `FluxoStepMediaPicker` component
- In the "add new FAQ" form: after the Resposta textarea, add the `FluxoStepMediaPicker` with state for `newMedia`
- In the "edit FAQ" form: same media picker bound to `editingItem.media`
- In the FAQ list display: show a media badge/preview below the answer text when media is attached
- The media picker already handles: type selection (audio/image/video/document), file upload to `avivar-media` bucket, audio PTT vs file mode, and the "Encaminhada" (forwarded) toggle

#### 3. Update knowledge base export format
- When FAQ is copied to knowledge base via `onCopyToKnowledge`, include media URLs in the formatted content so the AI agent knows what media to send with each answer
- Format: `**1. Pergunta**\nResposta\n[Mídia: tipo - url]`

#### 4. Update auto-save in `AvivarSimpleWizard.tsx`
- The FAQ data with media is already serializable (URLs are strings), so auto-save of knowledge files will naturally include it — no schema changes needed since media URLs are part of the FAQ content string saved to `knowledge_files`

### Technical Details
- No database migration needed — media is stored in existing `avivar-media` bucket, and FAQ content is serialized into `knowledge_files` JSON
- Reuses existing `FluxoStepMediaPicker` component and `FluxoStepMedia` type — no new upload logic needed
- The forwarded toggle is already built into the media picker's audio config panel

