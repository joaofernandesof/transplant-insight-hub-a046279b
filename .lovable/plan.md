

## Permissionamento HotLeads + Reset de Senhas + Planilha XLSX

### Resumo
Configurar os 16 usuarios para acessar **apenas o HotLeads**, atualizar suas senhas para o padrao "Primeironome@2026!" e criar uma pagina para download da planilha XLSX com os dados.

### O que sera feito

**1. Atualizar `allowed_portals` no banco de dados**
- Atualizar a coluna `allowed_portals` dos 16 usuarios na tabela `neohub_users` para `["hotleads"]`
- Isso garante que ao fazer login, apenas o portal HotLeads estara acessivel

**2. Garantir perfil `licenciado` para todos**
- O portal HotLeads exige o perfil `licenciado` (conforme mapeamento em `permissions.ts`)
- Verificacao: Cintia de Andrade e Regia Debora so possuem perfil `aluno` - sera necessario adicionar o perfil `licenciado` para elas
- Os demais 14 usuarios ja possuem o perfil `licenciado`

**3. Garantir permissao do modulo `neolicense_hotleads`**
- O modulo `neolicense_hotleads` ja existe com permissao para o perfil `licenciado` (can_read = true)
- Nao e necessaria alteracao adicional na tabela de permissoes de modulo

**4. Reset de senhas via Edge Function**
- Usar a edge function `bulk-reset-passwords` ja existente para atualizar as senhas de todos os 16 usuarios
- Senhas no padrao "Primeironome@2026!":

| Nome | Email | Senha |
|------|-------|-------|
| Ana Flavia Pierazo Rodrigues | anapierazor@gmail.com | Ana@2026! |
| Andre Luis Chaves Valente | andrevalente1974@gmail.com | André@2026! |
| Cintia de Andrade | dracintia@outlook.com | Cíntia@2026! |
| Deibson Santos Lisboa | deibsonlisboa1995@gmail.com | Deibson@2026! |
| Eder Eiji Yanagitani | yanagitani@hotmail.com | Eder@2026! |
| Erika Alves Coimbra | erikaalvescoimbra@gmail.com | Erika@2026! |
| Fabio Branaro | fabiobranaro@hotmail.com | Fabio@2026! |
| Felipe Teles de Arruda | ftarruda@hotmail.com | Felipe@2026! |
| Flavio Henrique Nogueira Machado | flavioau@outlook.com | Flavio@2026! |
| Gleyldes Goncalves Guimaraes Leao | gleleao@gmail.com | Gleyldes@2026! |
| Jean Carlos Romao de Sousa | jeancarlosromaodesousa@gmail.com | Jean@2026! |
| Joselio Alves Sousa | joselio0611@gmail.com | Joselio@2026! |
| Livia Alana Silva de Souza Gomes | contato@draliviaalana.com.br | Livia@2026! |
| Paulo Batista da Costa Neto | paulob.costaneto@hotmail.com | Paulo@2026! |
| Regia Debora Cardoso da Silva Reis | regiareis103100@outlook.com | Régia@2026! |
| Robister Moreno de Oliveira Mac Cornick | mrobister@gmail.com | Robister@2026! |

**5. Gerar planilha XLSX para download**
criar um arquivo em /docs com o nome "loginhotleads"

### Detalhes Tecnicos

**Alteracoes no banco de dados:**
- UPDATE em `neohub_users` para definir `allowed_portals = ['hotleads']` nos 16 registros
- INSERT em `neohub_user_profiles` para adicionar perfil `licenciado` para Cintia de Andrade e Regia Debora (que so possuem `aluno`)

**Chamada a Edge Function:**
- Chamar `bulk-reset-passwords` com os 16 emails e senha individual para cada um (sera necessario chamar individualmente via `admin-reset-password` ou adaptar para enviar senha por usuario)
- Como a funcao `bulk-reset-passwords` aceita uma unica senha para todos, e as senhas sao diferentes por usuario, sera usado `admin-reset-password` individualmente para cada usuario

**Componente XLSX:**
- Criar um componente React simples usando a biblioteca `xlsx` (ja instalada) que gera e faz download automatico da planilha com os dados dos 16 usuarios

### Arquivos a serem modificados/criados
1. Banco de dados: 2 SQL updates (allowed_portals + perfis)
2. Edge function calls: 16 chamadas ao `admin-reset-password`
3. Novo componente: `src/pages/admin/HotleadsUserExport.tsx` - pagina com download XLSX
