# Mapa de Rotas e Permissões - NeoHub

## Rotas Públicas (sem autenticação)

| Rota | Descrição | Permissão |
|------|-----------|-----------|
| `/` | Landing Page / Home Router | Público (redireciona se logado) |
| `/login` | Página de login | Público |
| `/reset-password` | Recuperação de senha | Público |
| `/indicacao/:code` | Landing de indicação | Público |
| `/indicacao-formacao360/:code` | Landing indicação Formação 360 | Público |
| `/api-docs` | Documentação da API | Público |
| `/unauthorized` | Página de acesso negado | Público |
| `/neocare-landing` | Landing NeoCare | Público |
| `/neocare-protect` | Landing produto NeoCare | Público |
| `/audit-report` | Exportação relatório auditoria | Público |
| `/privacy-policy` | Política de privacidade | Público |
| `/privacy` | Redirect → `/privacy-policy` | Público |
| `/terms` | Termos de serviço | Público |
| `/public/dashboard/:token` | Dashboard público com token | Público |
| `/neohub` | Página de vendas NeoHub | Público |
| `/docs/architecture` | Download arquitetura | Público |
| `/docs/flow-do` | Plano arquitetura Flow.do | Público |
| `/hotleads-vendas` | Landing HotLeads vendas | Público |
| `/transplante-capilar` | Landing Transplante Capilar | Público |
| `/avivar-capilar` | Landing Avivar Capilar | Público |
| `/neohair-landing` | Landing NeoHair | Público |

---

## Rotas Protegidas - Seleção de Perfil

| Rota | Descrição | Permissão |
|------|-----------|-----------|
| `/select-profile` | Seletor de perfil | Autenticado |
| `/portal-selector` | Seletor de portal | Autenticado |

---

## Portal NeoCare (Paciente)

**Perfis permitidos:** `paciente`, `administrador`

| Rota | Descrição |
|------|-----------|
| `/neocare` | Home do paciente |
| `/neocare/appointments` | Agendamentos |
| `/neocare/appointments/new` | Novo agendamento |
| `/neocare/settings` | Configurações |
| `/neocare/my-records` | Documentos/prontuário |
| `/neocare/my-invoices` | Faturas |
| `/neocare/orientations` | Orientações |
| `/neocare/news` | Notícias |

---

## Portal NeoTeam (Colaborador)

**Perfis permitidos:** `colaborador`, `medico`, `administrador`

| Rota | Descrição |
|------|-----------|
| `/neoteam` | Home do colaborador |
| `/neoteam/schedule` | Agenda |
| `/neoteam/waiting-room` | Sala de espera |
| `/neoteam/waiting-room/reports` | Relatórios sala de espera |
| `/neoteam/doctor-view` | Visão do médico |
| `/neoteam/patients` | Lista de pacientes |
| `/neoteam/patients/:id` | Detalhe do paciente |
| `/neoteam/medical-records` | Prontuários |
| `/neoteam/documents` | Documentos |
| `/neoteam/tasks` | Tarefas |
| `/neoteam/events` | Eventos |
| `/neoteam/galleries` | Galerias |
| `/neoteam/anamnesis` | Anamnese |
| `/neoteam/legal-dashboard` | Dashboard jurídico |
| `/neoteam/contracts-import` | Importar contratos |
| `/neoteam/procedures` | Procedimentos |
| `/neoteam/inventory` | Inventário |
| `/neoteam/contract-review` | Revisão de contratos |
| `/neoteam/postvenda` | Pós-venda home |
| `/neoteam/postvenda/chamados` | Lista chamados |
| `/neoteam/postvenda/chamados/:id` | Detalhe chamado |
| `/neoteam/postvenda/sla` | SLA |
| `/neoteam/postvenda/nps` | NPS |
| `/neoteam/postvenda/distrato` | Redirect filtro distrato |
| `/neoteam/staff-roles` | Papéis da equipe |
| `/neoteam/settings` | Configurações |

---

## Portal Academy (Aluno - IBRAMEC)

**Perfis permitidos:** `aluno`, `administrador`

| Rota | Descrição |
|------|-----------|
| `/academy` | Home do aluno |
| `/academy/courses` | Cursos |
| `/academy/classes/:classId` | Detalhe da turma |
| `/academy/schedule` | Calendário |
| `/academy/materials` | Materiais |
| `/academy/exams` | Provas |
| `/academy/exams/:examId/take` | Realizar prova |
| `/academy/exams/:examId/results/:attemptId` | Resultado prova |
| `/academy/certificates` | Certificados |
| `/academy/community` | Comunidade |
| `/academy/chat` | Chat |
| `/academy/chat/:recipientId` | Chat direto |
| `/academy/career` | Plano de carreira |
| `/academy/referral` | Programa indicação |
| `/academy/profile` | Perfil/Configurações |
| `/academy/admin/enrollments` | Admin: matrículas |
| `/academy/admin/students` | Admin: alunos |
| `/academy/admin/surveys` | Admin: pesquisas |
| `/academy/pesquisa-dia2/:classId` | Pesquisa dia 2 (sem sidebar) |

---

## Portal NeoLicense (Licenciado)

**Perfis permitidos:** `licenciado`

| Rota | Descrição |
|------|-----------|
| `/neolicense` | Home do licenciado |
| `/neolicense/dashboard` | Dashboard |
| `/neolicense/university` | Universidade |
| `/neolicense/university/trilha/:trackId` | Trilha de aprendizado |
| `/neolicense/university/exams` | Provas |
| `/neolicense/university/exams/:examId/take` | Realizar prova |
| `/neolicense/university/exams/:examId/results/:attemptId` | Resultado prova |
| `/neolicense/university/exams/admin` | Admin provas |
| `/neolicense/materials` | Materiais |
| `/neolicense/partners` | Parceiros |
| `/neolicense/surgery` | Agenda cirurgias |
| `/neolicense/achievements` | Conquistas |
| `/neolicense/referral` | Programa indicação |
| `/neolicense/structure` | Estrutura NEO |
| `/neolicense/profile` | Perfil |
| `/neolicense/hotleads` | HotLeads |
| `/neolicense/career` | Carreira |
| `/neolicense/community` | Comunidade |

---

## Portal Avivar (CRM + IA)

**Perfis permitidos:** `cliente_avivar`, `administrador`

| Rota | Descrição |
|------|-----------|
| `/avivar` | Dashboard Avivar |
| `/avivar/dashboard` | Dashboard |
| `/avivar/comercial` | Comercial |
| `/avivar/posvenda` | Pós-venda |
| `/avivar/inbox` | Caixa de entrada |
| `/avivar/tasks` | Tarefas |
| `/avivar/contacts` | Contatos |
| `/avivar/leads` | Seletor de leads |
| `/avivar/kanban/:kanbanId` | Kanban específico |
| `/avivar/analytics` | Analytics |
| `/avivar/followup` | Follow-up |
| `/avivar/catalog` | Catálogo |
| `/avivar/productivity` | Produtividade |
| `/avivar/hotleads` | HotLeads |
| `/avivar/traffic` | Indicadores tráfego |
| `/avivar/marketing` | Central marketing |
| `/avivar/tutorials` | Tutoriais |
| `/avivar/agenda` | Agenda |
| `/avivar/agenda/settings` | Config agenda |
| `/avivar/integrations` | Integrações |
| `/avivar/voip` | VoIP |
| `/avivar/config` | Configuração IA |
| `/avivar/config/new` | Novo agente |
| `/avivar/config/edit/:agentId` | Editar agente |
| `/avivar/config/knowledge` | Base conhecimento |
| `/avivar/config/preview` | Preview prompt |
| `/avivar/agents` | Lista agentes |
| `/avivar/agents/routing/:agentId` | Roteamento agente |
| `/avivar/team` | Equipe |
| `/avivar/team/permissions` | Matriz permissões |
| `/avivar/settings` | Configurações |
| `/avivar/profile` | Perfil |

---

## Portal IPROMED (Instituto Proteção Médica)

**Perfis permitidos:** `ipromed`, `administrador`

| Rota | Descrição |
|------|-----------|
| `/ipromed` | Home IPROMED |
| `/ipromed/dashboard` | Dashboard |
| `/ipromed/students` | Alunos |
| `/ipromed/exams` | Provas |
| `/ipromed/mentors` | Mentores |
| `/ipromed/surveys` | Pesquisas |
| `/ipromed/leads` | Leads |
| `/ipromed/clients` | Clientes |
| `/ipromed/clients/:id` | Detalhe cliente |
| `/ipromed/journey` | Jornada |
| `/ipromed/sales-funnel` | Funil vendas |
| `/ipromed/contracts` | Contratos |
| `/ipromed/contracts/:id` | Detalhe contrato |
| `/ipromed/legal` | Hub jurídico |
| `/ipromed/university` | Universidade |
| `/ipromed/financial` | Financeiro |
| `/ipromed/push-juridico` | Push jurídico |
| `/ipromed/logs` | Logs atividade |
| `/ipromed/tasks` | Tarefas |

---

## Portal Admin

**Perfis permitidos:** `administrador` (isAdmin = true)

| Rota | Descrição |
|------|-----------|
| `/admin-portal` | Home admin |
| `/admin-portal/*` | Todas sub-rotas admin |
| `/admin` | Painel admin legado |
| `/access-matrix` | Matriz de acesso |
| `/system-metrics` | Métricas sistema |
| `/admin/sentinel` | System Sentinel |
| `/admin/announcements` | Anúncios |
| `/admin/banners` | Banners |
| `/admin/module-overrides` | Overrides módulos |
| `/admin/referrals` | Indicações |
| `/admin/event-logs` | Logs eventos |
| `/admin/code-assistant` | Assistente código |
| `/admin/surgery-schedule` | Agenda cirurgias |
| `/admin/licensee-onboarding` | Onboarding licenciados |
| `/admin/sales-urgency` | Urgência vendas |

---

## NeoPay (Gateway Pagamentos)

**Acesso:** Apenas Admin

| Rota | Descrição |
|------|-----------|
| `/neopay` | Dashboard |
| `/neopay/products` | Produtos |
| `/neopay/charges` | Cobranças |
| `/neopay/transactions` | Transações |
| `/neopay/split` | Split |
| `/neopay/subscriptions` | Assinaturas |
| `/neopay/delinquency` | Inadimplência |
| `/neopay/refunds` | Reembolsos |
| `/neopay/chargebacks` | Chargebacks |
| `/neopay/automations` | Automações |
| `/neopay/settings` | Configurações |

---

## NeoHair (Tratamento Capilar)

| Rota | Permissão | Descrição |
|------|-----------|-----------|
| `/neohair` | Autenticado | Home |
| `/neohair/avaliacao` | Autenticado | Avaliação |
| `/neohair/loja` | Autenticado | Loja |
| `/neohair/profissional` | Autenticado | Dashboard profissional |
| `/neohair/admin` | Admin | Dashboard admin |

---

## Vision (Diagnóstico Capilar IA)

| Rota | Permissão |
|------|-----------|
| `/vision` | Autenticado |
| `/vision/*` | Autenticado |

---

## Flow.do (Gestão Operacional)

| Rota | Permissão | Descrição |
|------|-----------|-----------|
| `/flow` | Autenticado | Portal Flow |
| `/flow/projects` | Autenticado | Projetos |
| `/flow/projects/:projectId` | Autenticado | Detalhe projeto |
| `/flow/my-tasks` | Autenticado | Minhas tarefas |
| `/flow/calendar` | Autenticado | Calendário |
| `/flow/workflows` | Autenticado | Automações |
| `/flow/settings` | Autenticado | Configurações |

---

## Marketplace

| Rota | Descrição |
|------|-----------|
| `/marketplace` | Home |
| `/marketplace/professionals` | Profissionais |
| `/marketplace/units` | Unidades |
| `/marketplace/leads` | Leads |
| `/marketplace/schedule` | Agenda |
| `/marketplace/reviews` | Avaliações |
| `/marketplace/campaigns` | Campanhas |
| `/marketplace/dashboard` | Dashboard |
| `/marketplace/discovery` | Descoberta |

**Permissão:** Autenticado

---

## Rotas Legadas (Redirects)

| Rota antiga | Redireciona para |
|-------------|------------------|
| `/university` | `/neolicense/university` |
| `/university/*` | `/neolicense/university` |
| `/materials` | `/neolicense/materials` |
| `/partners` | `/neolicense/partners` |
| `/achievements` | `/neolicense/achievements` |
| `/indique-e-ganhe` | `/neolicense/referral` |
| `/profile` | `/neolicense/profile` |
| `/career` | `/neolicense/career` |
| `/community` | `/neolicense/community` |
| `/hotleads` | `/avivar/hotleads` |
| `/neocrm/*` | `/avivar` |
| `/surgery-schedule` | `/neolicense/surgery` |
| `/estrutura-neo` | `/neolicense/structure` |
| `/home` | `/` |
| `/admin-dashboard` | `/admin-portal` |
| `/postvenda` | `/neoteam/postvenda` |
| `/postvenda/*` | `/neoteam/postvenda` |
| `/neohairscan` | `/vision` |

---

## Apps Externos (temporários)

| Rota | Descrição |
|------|-----------|
| `/portal/*` | Portal App legado |
| `/clinic/*` | Clinic App legado |
