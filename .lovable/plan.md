

# Plano: Clonar Configurações do Avivar (Lucas → Cíntia)

## Resumo

Replicar todas as configurações da conta Avivar do **Lucas Araujo** (`lucasaraujo.neofolic@gmail.com`) para a conta da **Cíntia de Andrade** (`dracintia@outlook.com`). São apenas operações de dados — nenhuma alteração de código.

## Contas Identificadas

| | Lucas (origem) | Cíntia (destino) |
|---|---|---|
| **Account ID** | `a0000001-...0002` | `13766a5f-...136b` |
| **User ID** | `860ae553-...c15` | `9ac4f659-...462` |

## O que será clonado

### 1. Agente de IA
Criar um agente na conta da Cíntia com **todas** as configurações do agente do Lucas:
- Nome, empresa, profissional, nicho (saude)
- Identidade da IA, objetivo, instruções, restrições
- Tom de voz, modo de atendimento (humanized)
- Fluxo de atendimento completo (7 passos cronológicos)
- Serviços, tipo de consulta, duração, métodos de pagamento
- Horários (schedule), endereço, cidade, estado
- Target kanbans (mapeados para os IDs da Cíntia)

### 2. Regras de Follow-up (5 regras)
Clonar as 5 tentativas de follow-up, mapeando os IDs de colunas/kanbans:
- **Tentativa 1**: 10 min, texto
- **Tentativa 2**: 1 hora, texto
- **Tentativa 3**: 1 dia, texto
- **Tentativa 4**: 2 dias, texto + imagem
- **Tentativa 5**: 3 dias, áudio PTT

### 3. Regras de Lembrete (5 regras)
Clonar os 5 lembretes de consulta:
- D-7, 48h, 24h (D-1), 2h antes, 1h antes

### 4. Checklists de Coluna (5 campos)
Clonar os campos do checklist da coluna "Lead de Entrada":
- Nome do Lead, Email, Data e Hora, Tipo de Consulta, Link da Meet

### 5. Agenda
Criar agenda ativa idêntica (nome, endereço, cidade, telefone, profissional)

## Mapeamento de IDs (Kanban/Colunas)

```text
Lucas Kanban IDs         →  Cíntia Kanban IDs
Comercial: 105dae7e      →  b0027e8f
Pós-Venda: 3941f916      →  b993c07f

Colunas Comercial:
Lead Entrada: c3605c92    →  30bbee4b
Triagem:      09e022aa    →  532d3473
Tent.Agendar: adac8570    →  01bd1f5d
Reagendamento:164c7060    →  5ab4ecf0
Agendado:     3a066d55    →  ca2ea948
Follow Up:    427bec61    →  9901830e
Cliente:      8691bd29    →  1cc592e8
Desqualific.: 5870e650    →  1b41ecf2
```

## Passos de Execução

1. Inserir agente na `avivar_agents` com `account_id` e `user_id` da Cíntia
2. Inserir 5 follow-up rules na `avivar_followup_rules` com IDs mapeados
3. Inserir 5 reminder rules na `avivar_reminder_rules`
4. Inserir 5 column checklists na `avivar_column_checklists`
5. Inserir 1 agenda na `avivar_agendas`

Nenhuma alteração de código é necessária — tudo via inserção de dados no banco.

