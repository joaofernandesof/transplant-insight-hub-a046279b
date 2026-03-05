

# Replicar configurações da conta Lucas para todas as contas Avivar (exceto Karine)

## Contexto

**Conta modelo**: `a0000001-0000-0000-0000-000000000002` (Lucas Araujo, `lucasaraujo.neofolic@gmail.com`)
**Contas destino**:
- `a0000001-0000-0000-0000-000000000001` (ByNeofolic, owner: `00294ac4...` / `adm@neofolic.com.br`)
- `a0000001-0000-0000-0000-000000000003` (TI Neo Folic, owner: `1b58da47...` / `ti@neofolic.com.br`)

**Excluída**: `b0317d67-fda3-46dd-8dbc-c69bf3821938` (Karine Mendes)

## Dados a replicar (da conta Lucas)

| Tabela | Registros | Ação |
|--------|-----------|------|
| `avivar_agents` | 1 (Iza) | Atualizar agentes existentes (Mel, Nia) com mesmas configs de IA, fluxo, prompts, serviços, etc. |
| `avivar_kanbans` | 2 (Comercial, Pós-Venda) | Limpar existentes e recriar com mesma estrutura |
| `avivar_kanban_columns` | 11 colunas | Recriar vinculadas aos novos kanbans |
| `avivar_column_checklists` | 5 campos | Recriar vinculados às novas colunas |
| `avivar_reminder_rules` | 5 regras | Limpar existentes e recriar idênticas |
| `avivar_followup_rules` | ~4 regras | Limpar existentes e recriar (ajustando `applicable_kanban_ids` e `applicable_column_ids` para novos IDs) |
| `avivar_knowledge_documents` | 2 docs + 27 chunks | Limpar existentes e recriar docs + chunks |
| `avivar_onboarding_progress` | 1 registro | Upsert com mesmos steps |

## Processo (passo a passo)

Para **cada conta destino**, executar via SQL (insert tool):

1. **Agente IA**: UPDATE do agente existente com todos os campos de configuração do agente Iza (ai_identity, ai_objective, ai_instructions, ai_restrictions, fluxo_atendimento, tone_of_voice, services, consultation_type, consultation_duration, payment_methods, nicho, subnicho, schedule, knowledge_files, image_gallery, before_after_images, crm, address, city, state, company_name, professional_name)

2. **Kanbans + Colunas**: DELETE existentes, INSERT novos kanbans (novos UUIDs), INSERT novas colunas (novos UUIDs) com mesmos nomes, cores, order_index. Guardar mapeamento de IDs antigos→novos para referências cruzadas.

3. **Checklists**: DELETE existentes, INSERT novos vinculados às novas column IDs

4. **Reminder Rules**: DELETE existentes, INSERT novos com mesmos templates e configurações

5. **Follow-up Rules**: DELETE existentes, INSERT novos com `applicable_kanban_ids` e `applicable_column_ids` apontando para os novos IDs de kanban/coluna

6. **Knowledge Base**: DELETE chunks e docs existentes, INSERT docs e chunks com conteúdo idêntico (vinculados ao agent_id da conta destino)

7. **Onboarding Progress**: UPSERT com mesmos flags

## Observações importantes

- Cada conta destino manterá seu próprio `user_id` (owner) nos registros
- Dados transacionais (leads, appointments, messages, contacts) NÃO serão tocados
- WhatsApp instances (`avivar_uazapi_instances`) NÃO serão copiadas (são específicas por conta/dispositivo)
- API tokens e webhooks NÃO serão copiados (Lucas não tem nenhum configurado)
- Os novos kanbans/colunas receberão UUIDs novos gerados via `gen_random_uuid()`
- Follow-up rules que referenciam kanban/column IDs serão ajustadas para os novos IDs correspondentes

