

## Preenchimento Automatico de Checklist pela IA

### Problema
Hoje a IA conversa com o lead, coleta informacoes (data da consulta, nome, procedimento, etc.), mas esses dados ficam apenas no historico do chat. Os campos do checklist no CRM precisam ser preenchidos manualmente pelo atendente.

### Solucao
Criar uma nova ferramenta (tool) chamada `preencher_checklist` que a IA pode chamar durante a conversa para gravar dados diretamente nos `custom_fields` do lead. A IA descobre quais campos existem dinamicamente, lendo a tabela `avivar_column_checklists` do kanban do lead.

### Como funciona para novos usuarios

O sistema e totalmente dinamico:
1. O usuario configura seus proprios campos de checklist no CRM (ex: "Data da Consulta", "Procedimento Desejado", "Valor Aprovado")
2. Quando a IA inicia uma conversa, a Edge Function carrega automaticamente todos os campos do checklist do kanban do lead
3. A IA recebe no prompt do sistema a lista de campos disponiveis com seus tipos e labels
4. Durante a conversa, quando o lead confirma uma informacao, a IA chama `preencher_checklist` com o `field_key` e o `valor`

### Fluxo tecnico

```text
Lead diz: "Quero agendar para 29/02 as 08:00"
         |
         v
IA cria agendamento (create_appointment)
         |
         v
IA chama preencher_checklist({
  campos: {
    "data_consulta": "2026-02-29",
    "horario_consulta": "08:00",
    "procedimento": "Avaliacao Capilar"
  }
})
         |
         v
Edge Function atualiza custom_fields do lead
         |
         v
Checklist no CRM aparece preenchido automaticamente
```

### Mudancas necessarias

**1. Edge Function `avivar-ai-agent/index.ts`**

- **Nova tool `preencher_checklist`**: Aceita um objeto `campos` (chave-valor) e atualiza os `custom_fields` do lead na tabela `avivar_kanban_leads`
  - Parametros: `campos` (objeto com field_key -> valor)
  - Faz merge com campos ja existentes (nao sobrescreve outros campos)

- **Nova funcao `loadChecklistFields`**: Carrega os campos de `avivar_column_checklists` para o kanban do lead (field_key, field_label, field_type, options)

- **Injecao no prompt do sistema**: Na funcao que monta o prompt dinamico, adicionar uma secao `<checklist_campos>` listando todos os campos disponiveis com tipo e label, para que a IA saiba o que pode preencher

- **Instrucoes no prompt**: Adicionar regras como:
  - "Quando o lead confirmar uma informacao que corresponde a um campo do checklist, preencha automaticamente usando `preencher_checklist`"
  - "Apos criar agendamento, preencha os campos de data/horario no checklist se existirem"
  - "Nao pergunte informacoes que ja foram preenchidas no checklist"

**2. Nenhuma mudanca no frontend**

O frontend ja exibe os `custom_fields` corretamente no componente `ChecklistFieldRenderer.tsx`. Quando a IA atualizar os `custom_fields` via Edge Function, os dados aparecerao automaticamente na interface do CRM na proxima consulta.

### Detalhes da implementacao da tool

```text
Tool: preencher_checklist
Descricao: "Preenche campos do checklist/ficha do lead com
            informacoes coletadas na conversa. Use sempre que
            o lead confirmar dados como: data, horario,
            procedimento, valor, etc."
Parametros:
  - campos: objeto { field_key: valor }
    Ex: { "data_consulta": "2026-02-29", "procedimento": "Capilar" }
```

Funcao no backend:
1. Busca o lead por telefone em `avivar_kanban_leads`
2. Le os `custom_fields` atuais
3. Faz merge com os novos valores
4. Salva de volta com `update`

### Secao dinamica no prompt

Quando a IA iniciar, o sistema carrega os campos e injeta:

```text
<checklist_campos>
Voce pode preencher os seguintes campos do checklist do lead
usando a ferramenta "preencher_checklist":

- data_consulta (date): "Data da Consulta"
- horario_consulta (text): "Horario"
- procedimento (select, opcoes: Capilar|Barba|Sobrancelha): "Procedimento Desejado"
- valor_aprovado (number): "Valor Aprovado"
- observacoes (text): "Observacoes"

REGRAS:
1. Sempre que o lead confirmar um dado que corresponde a um campo, preencha
2. Apos create_appointment, preencha automaticamente data e horario
3. Nao preencha campos com dados inventados - apenas dados confirmados pelo lead
</checklist_campos>
```

### Vantagens

- **Zero configuracao extra**: Funciona automaticamente com qualquer checklist que o usuario criar
- **Dinamico**: Novos campos adicionados ao checklist sao reconhecidos pela IA imediatamente
- **Seguro**: A IA so preenche campos que existem na configuracao, com dados confirmados na conversa
- **Compativel**: Nao quebra nada existente, apenas adiciona capacidade nova
