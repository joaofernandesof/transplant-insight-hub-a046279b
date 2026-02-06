
# Plano: Corrigir erro de salvamento do agente de IA em producao

## Diagnostico

Apos analise completa, o erro "new row violates row-level security policy for table avivar_agents" esta sendo causado pela **versao publicada do frontend estar desatualizada** em relacao ao codigo atual.

### Evidencias

1. **O codigo no preview esta correto**: Ambos os fluxos de criacao de agente (`AvivarSimpleWizard.tsx` e `AvivarKnowledge.tsx`) ja incluem a busca do `account_id` via `avivar_account_members` e o passam no payload de insert.

2. **A RLS esta correta**: A policy `acct_i` exige `WITH CHECK (account_id = get_user_avivar_account_id(auth.uid()))`. A funcao retorna `a0000001-0000-0000-0000-000000000003` para `ti@neofolic.com.br` - tudo ok.

3. **O banco esta correto**: A coluna `account_id` e NOT NULL e a funcao de resolucao funciona.

4. **O erro e do PostgREST** (frontend), nao de uma edge function - confirma que e o site publicado enviando dados incompletos.

5. **Possivel causa do deploy nao atualizar**: Com 70+ edge functions, cada publicacao demora para propagar. Alem disso, o dominio customizado `neohub.ibramec.com` pode ter **cache de CDN** que impede o JavaScript novo de ser servido.

## Acoes

### 1. Republicar o projeto
Republicar o projeto para forcar um novo build do frontend com o codigo atualizado.

### 2. Adicionar tratamento de erro especifico
Melhorar a mensagem de erro no `AvivarSimpleWizard.tsx` para que, se o INSERT falhar por RLS, o usuario veja uma mensagem clara em vez de um erro generico. Isso ajuda a diagnosticar se o problema persiste.

### 3. Adicionar logging no payload
Incluir `console.log` temporario no fluxo de salvamento para confirmar que o `account_id` esta sendo enviado corretamente pelo frontend publicado. Isso permite verificar se o build publicado contem o codigo atualizado.

## Secao Tecnica

### Arquivo: `src/pages/avivar/config/AvivarSimpleWizard.tsx`

Adicionar log de debug antes do insert/update:

```text
// Antes do insert (linha ~315)
console.log('[AgentSave] Payload:', { 
  user_id: agentPayload.user_id, 
  account_id: agentPayload.account_id,
  name: agentPayload.name 
});
```

Melhorar tratamento de erro:

```text
// No catch do insert (linha ~321)
if (error) {
  console.error('[AgentSave] Error:', error);
  if (error.message?.includes('row-level security')) {
    throw new Error('Erro de permissao: sua conta pode nao estar configurada corretamente. Tente fazer logout e login novamente.');
  }
  throw error;
}
```

### Arquivo: `src/pages/avivar/config/AvivarKnowledge.tsx`

Aplicar o mesmo tratamento de erro e logging (linhas ~240-256).

### Teste de validacao

Apos publicar:
1. Limpar cache do navegador em `neohub.ibramec.com`
2. Fazer logout e login novamente com `ti@neofolic.com.br`
3. Tentar criar um agente novo
4. Verificar no console do navegador se o log `[AgentSave] Payload:` aparece com `account_id` preenchido
