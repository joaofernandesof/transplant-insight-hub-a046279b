

# IA Multilingual: Responder no Idioma do Lead

## Resumo

Fazer a IA detectar automaticamente o idioma do lead e responder nesse idioma. A detecao sera feita a partir das mensagens do lead (sem necessidade de campo manual). A mudanca e segura e nao quebra o que ja funciona.

## Como funciona hoje

- A IA tem uma regra fixa: "Responda SEMPRE em Portugues Brasileiro"
- Follow-ups e lembretes usam templates escritos manualmente em portugues
- Nao existe nenhum campo de idioma na tabela de leads

## O que sera feito

### 1. Adicionar campo `language` na tabela `leads`
- Novo campo `language TEXT DEFAULT 'pt-BR'`
- Valor padrao portugues, garantindo que nada quebra para leads existentes

### 2. IA do Agente: detectar e responder no idioma do lead
- Remover a regra fixa de "sempre portugues"
- Substituir por: "Detecte o idioma do lead pelas mensagens e responda no MESMO idioma"
- Na primeira interacao, a IA detecta o idioma e salva no campo `language` do lead (via uma nova tool `set_lead_language`)
- Nas interacoes seguintes, o sistema ja carrega o idioma salvo e instrui a IA

### 3. Follow-ups: traduzir automaticamente
- Quando a IA gera/personaliza follow-ups, incluir no prompt: "Responda no idioma: {language}"
- Para templates fixos (sem IA), a traducao tambem sera feita via IA antes do envio, usando o idioma salvo do lead
- Fallback: se nao houver idioma salvo, manter portugues

### 4. Lembretes de consulta: traduzir automaticamente
- No `avivar-process-reminders`, antes de enviar, verificar o idioma do lead
- Se nao for pt-BR, usar IA para traduzir a mensagem do lembrete
- Operacao rapida (traducao simples) que nao impacta performance

## Riscos e seguranca

| Preocupacao | Solucao |
|---|---|
| Leads existentes sem idioma | Campo tem default `pt-BR`, nada muda |
| Templates em portugues para lead estrangeiro | IA traduz antes de enviar |
| Erro na traducao | Fallback: envia em portugues (comportamento atual) |
| Performance | Apenas 1 chamada extra de IA para traducao, so quando idioma != pt-BR |
| Agendamentos e ferramentas internas | Continuam funcionando normalmente, so a mensagem ao lead muda |

## Detalhes Tecnicos

### Migracao SQL
```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';
```

### Edge Function `avivar-ai-agent/index.ts`
- Na funcao `buildHybridSystemPrompt`: substituir bloco `<idioma_obrigatorio>` por instrucao dinamica baseada no campo `language` do lead
- Adicionar tool `set_lead_language` para a IA salvar o idioma detectado
- Carregar `language` do lead no inicio do fluxo e passar ao prompt

### Edge Function `avivar-process-followups/index.ts`
- Carregar `language` do lead junto com os dados existentes
- Se `language != 'pt-BR'` e mensagem esta em portugues, adicionar etapa de traducao via IA antes do envio
- Aplicar tanto para mensagens geradas por IA quanto para templates fixos

### Edge Function `avivar-process-reminders/index.ts`
- Carregar `language` do lead (via appointment -> lead)
- Se `language != 'pt-BR'`, traduzir mensagem do lembrete via IA antes do envio

### Fluxo de deteccao

```text
Lead envia mensagem
       |
       v
IA detecta idioma da mensagem
       |
       v
Salva idioma no campo leads.language
       |
       v
Responde no mesmo idioma
       |
       v
Follow-ups e lembretes futuros
usam o idioma salvo para traduzir
```

## Estimativa de impacto

- **3 arquivos** editados (agent, process-followups, process-reminders)
- **1 migracao** SQL (adicionar coluna)
- **Zero risco** para funcionalidades existentes (default pt-BR)
- Leads em portugues: comportamento identico ao atual
- Leads em outros idiomas: experiencia significativamente melhor

