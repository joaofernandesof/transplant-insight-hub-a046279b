

## Correcao: IA oferecendo horarios inexistentes e ocupados

### Problema identificado

A IA ofereceu ao lead Werikes Botelho "amanha as 10h ou as 14h" sem chamar a ferramenta `get_available_slots`. Ambos os horarios estao errados:

- **10h NAO EXISTE na grade**: A agenda de Sao Paulo para quarta-feira tem periodos 08:00-09:00, 12:00-14:00, 14:00-15:00, 18:00-20:00. Nao existe slot as 10:00.
- **14h ESTA OCUPADO**: Marivaldo Balbino Dos Santos ja esta confirmado as 14:00.

A IA "inventou" horarios bonitos (numeros redondos) em vez de consultar a ferramenta de disponibilidade. O prompt ja instrui para usar `get_available_slots`, mas a IA ignorou a instrucao.

### Causa raiz

O prompt do sistema tem a instrucao no bloco `<fluxo_agendamento>`, mas nao tem uma regra de **bloqueio absoluto** que impeca a IA de mencionar horarios sem ter chamado a ferramenta primeiro. A regra `<regra_anti_alucinacao_critica>` cobre cidades e precos mas NAO menciona explicitamente horarios.

### Solucao

Reforcar o prompt do sistema em dois pontos:

1. **Adicionar horarios na regra anti-alucinacao** (linhas ~3579-3588): Incluir horarios na lista de dados que NUNCA podem ser inventados, exigindo que `get_available_slots` seja chamado antes de qualquer mencao a horario.

2. **Adicionar regra de bloqueio explicita no fluxo de agendamento** (linhas ~3613-3627): Inserir instrucao que PROIBE a IA de sugerir horarios sem ter resultado de `get_available_slots` no turno atual. Se a IA quiser oferecer horarios, DEVE chamar a ferramenta primeiro como tool call.

3. **Reforco adicional nas regras importantes** (linhas ~3590-3601): Adicionar regra explicita "NUNCA sugira horarios especificos sem antes chamar get_available_slots".

### Detalhes tecnicos

Arquivo: `supabase/functions/avivar-ai-agent/index.ts`

**Alteracao 1** - Bloco `<regra_anti_alucinacao_critica>` (~linha 3579):
Adicionar apos "ANTES de mencionar qualquer preco ou produto":
```
- ANTES de mencionar QUALQUER horário disponível, você DEVE usar get_available_slots primeiro
- ABSOLUTAMENTE PROIBIDO: Inventar ou sugerir horários como "10h", "14h", "15h" sem ter chamado get_available_slots neste turno
- Se você mencionar um horário que NÃO veio do resultado de get_available_slots, você FALHOU GRAVEMENTE na tarefa
```

**Alteracao 2** - Bloco `<fluxo_agendamento>` antes da oferta inicial (~linha 3614):
Adicionar regra de bloqueio:
```
### PROIBICAO ABSOLUTA:
- NUNCA mencione horários específicos (ex: "10h", "14h", "amanhã de manhã") sem ANTES chamar get_available_slots como tool call neste mesmo turno
- Se você quiser oferecer horários ao lead, a PRIMEIRA acao OBRIGATORIA é chamar get_available_slots
- Horários inventados (sem vir de get_available_slots) sao considerados FALHA CRITICA
- Os horários retornados por get_available_slots ja consideram a grade configurada e os agendamentos existentes — confie EXCLUSIVAMENTE neles
```

**Alteracao 3** - Bloco `<regras_importantes>` (~linha 3596):
Adicionar regra:
```
- NUNCA sugira horários sem chamar get_available_slots ANTES — qualquer horário mencionado DEVE vir do resultado dessa ferramenta
```

Essas alteracoes reforçam em 3 locais diferentes do prompt a mesma regra, reduzindo drasticamente a chance da IA ignorar e inventar horarios.
