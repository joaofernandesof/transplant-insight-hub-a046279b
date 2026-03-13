

# Plano: Limpeza de Duplicatas + Validação Anti-Duplicata

## 1. Limpeza de Dados (4 registros)

Deletar os seguintes registros da tabela `clinic_surgeries` usando o insert tool (DELETE):

| Paciente | ID a remover | Motivo |
|---|---|---|
| CAIO CAVALCANTI LACERDA DE SOUSA | `81ce6061...` | Duplicata sem data (manter agenda 11/07) |
| CAIO CAVALCANTI LACERDA DE SOUSA | `a5f24ddc...` | Duplicata sem data (manter agenda 11/07) |
| DOUGLAS DE OLIVEIRA COSMO | `410f6199...` | Duplicata sem data (manter agenda 03/08) |
| RAUL CEZAR DE ABREU JUNIOR | `cd0ccd9c...` | Duplicata sem data (manter agenda 28/03) |

Cada deleção será confirmada individualmente antes de executar.

## 2. Validação Anti-Duplicata

Criar um hook utilitário `useDuplicateCheck` que consulta `clinic_surgeries` por `patient_id` com `schedule_status` em (`agendado`, `confirmado`, `sem_data`) e retorna se já existe registro ativo para o mesmo procedimento (exceto Retouching).

**Lógica de bloqueio:**
- Bloqueia se: mesmo `patient_id` + mesmo `procedure` + categoria diferente de `RETOUCHING`
- Permite se: procedimento diferente OU categoria = `RETOUCHING`

**Mensagem de bloqueio:** *"Este paciente já possui uma cirurgia agendada ou aguardando data para este procedimento."*

### Pontos de integração:

1. **`AddSurgeryDialog.tsx`** — No `handleSubmit`, após resolver o `patientId`, consultar duplicatas antes de chamar `createSurgery.mutate`. Se bloqueado, exibir `toast.error` e retornar.

2. **`ScheduleSurgeryDialog.tsx`** — No `handleSubmit`, antes de chamar `createSurgery.mutate`, mesma verificação usando `patient.patientId` e `patient.procedure`.

3. **`NoDateTab.tsx`** — No `handleConfirmDate`, antes de criar a cirurgia, verificar se o paciente já tem registro agendado para o mesmo procedimento (evitar mover de "sem data" para "agendado" quando já existe agendamento).

### Arquivos modificados:
- **Novo:** `src/clinic/hooks/useDuplicateCheck.ts`
- **Editados:** `AddSurgeryDialog.tsx`, `ScheduleSurgeryDialog.tsx`, `NoDateTab.tsx`

