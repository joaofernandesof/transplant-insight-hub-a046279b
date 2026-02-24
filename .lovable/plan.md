

## Zerar Tarefas - Limpar dados para comecar do zero

### O que sera feito

Deletar todas as 9 tarefas existentes na base de dados do modulo de tarefas (incluindo subtarefas relacionadas), para que voce possa comecar a lancar tarefas reais.

### Detalhes tecnicos

1. **Deletar subtarefas** da tabela `ipromed_legal_subtasks` (dependencia da tabela principal)
2. **Deletar todas as tarefas** da tabela `ipromed_legal_tasks` (9 registros: "teste", "Revisar TCLE Dra Cintia", "Protocolar recurso administrativo", etc.)

As tarefas removidas:
- teste (Dra. Larissa Guerreiro)
- teste (Eu)
- Revisar TCLE Dra Cintia
- Protocolar recurso administrativo - CRM/SP
- Elaborar parecer juridico sobre LGPD
- Revisar contrato de prestacao de servicos - Clinica Vida
- Responder notificacao extrajudicial - Caso Oliveira
- Atualizar modelo de termo de consentimento
- Agendar reuniao com Dr. Silva sobre caso trabalhista

Nenhuma alteracao de codigo sera necessaria -- apenas limpeza de dados.

