

# Plano: Clonar Configuração CRM de Lucas Araujo → Mario Cezar da Motta

## Contas Identificadas

| | Lucas Araujo (origem) | Mario Cezar da Motta (destino) |
|---|---|---|
| **Account ID** | `a0000001-...0002` | `fb81072b-...` |
| **User ID** | `860ae553-...` | `2adaf727-...` |
| **Agent** | Ana (ID: `10234867-...`) | Ana (ID: `978eac9e-...`) |

## O que será copiado

### 1. Agente de IA (prompts, fluxo, configurações)
Copiar do agente de Lucas para o agente de Mario:
- `ai_identity`, `ai_objective`, `ai_instructions`, `ai_restrictions`
- `tone_of_voice`, `attendance_mode`
- `fluxo_atendimento` (passos cronológicos completos)
- `services`, `payment_methods`, `consultation_type`, `consultation_duration`
- `schedule`, `chatbot_flows`, `business_units`
- `image_gallery`, `before_after_images`

**Nota**: Campos específicos do negócio (company_name, address, city, professional_name, crm, instagram) **não** serão sobrescritos, pois são dados próprios da clínica do Mario.

### 2. Kanbans e Colunas
Lucas tem 2 kanbans (Comercial + Pós-Venda) com 11 colunas. Mario já tem 3 kanbans (Comercial + Pós-Venda + Pacientes) com 11 colunas. A estrutura é idêntica nos 2 kanbans em comum.

**Ação**: Replicar as `ai_instruction` das colunas (atualmente `null` em ambos, então nada a fazer).

### 3. Réguas de Follow-up
Lucas tem 4 réguas de follow-up. Mario tem 2. Vou:
- Deletar as 2 réguas existentes do Mario
- Inserir as 4 réguas de Lucas adaptadas com os IDs de coluna do Mario

**Mapeamento de colunas** (Lucas → Mario):
- Lead de Entrada: `c3605c92` → `5fae0089`
- Triagem: `09e022aa` → `0f277871`
- Tentando Agendar: `adac8570` → `9d78014e`
- Reagendamento: `164c7060` → `01146388`
- Agendado: `3a066d55` → `c385b9c3`
- Follow Up: `427bec61` → `34238dd9`
- Cliente: `8691bd29` → `4940f69c`
- Desqualificados: `5870e650` → `499b2c9b`

**Mapeamento de kanbans** (Lucas → Mario):
- Comercial: `105dae7e` → `356323e1`
- Pós-Venda: `3941f916` → `baa5a543`

### 4. Lembretes de Consulta
Lucas tem 5 lembretes. Mario tem 0. Vou inserir os 5 lembretes adaptados.

### 5. Checklists de Coluna
Lucas tem 5 checklists (sistema) na coluna "Lead de Entrada". Mario já tem 5 checklists. Vou manter os existentes (são os mesmos campos de sistema).

### 6. Base de Conhecimento
Lucas tem múltiplos documentos (FAQ, RAG completo). Mario tem 1 documento. **Não** vou copiar os documentos de conhecimento pois são específicos de cada clínica (Lucas = Neofolic, Mario = Desiree Hickmann).

### 7. Target Kanbans/Stages do Agente
Atualizar o `target_kanbans` e `target_stages` do agente do Mario para apontar para seus próprios kanbans/colunas (mapeando dos de Lucas).

## Etapas de Execução

1. **UPDATE** agente do Mario com prompts/config do Lucas (preservando dados do negócio)
2. **DELETE** follow-up rules existentes do Mario
3. **INSERT** follow-up rules de Lucas com UUIDs mapeados
4. **INSERT** reminder rules de Lucas adaptadas para Mario
5. **UPDATE** target_kanbans/target_stages do agente

## Observação
- Dados específicos do negócio do Mario (nome da clínica, endereço, CRM, fluxo de atendimento com menções ao Dr. Mario Farinazzo) serão **preservados**
- Apenas a estrutura de prompts genéricos, regras de follow-up e lembretes serão copiados

