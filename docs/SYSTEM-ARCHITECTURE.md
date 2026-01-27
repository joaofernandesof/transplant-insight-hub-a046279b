# 📋 NeoHub - Arquitetura Completa do Sistema

> **Documento de Referência Técnica** - Atualizado em: 2026-01-27  
> **Versão:** 2.0.0

---

## 📑 Índice

1. [Visão Geral](#-visão-geral)
2. [Stack Tecnológica](#-stack-tecnológica)
3. [Estrutura de Portais](#-estrutura-de-portais)
4. [Sistema de Rotas](#-sistema-de-rotas)
5. [Sistema de Autenticação e RBAC](#-sistema-de-autenticação-e-rbac)
6. [Edge Functions (APIs)](#-edge-functions-apis)
7. [Banco de Dados](#-banco-de-dados)
8. [Storage (Armazenamento)](#-storage-armazenamento)
9. [Webhooks e Integrações](#-webhooks-e-integrações)
10. [Notificações](#-notificações)
11. [Hooks Personalizados](#-hooks-personalizados)
12. [Estrutura de Arquivos](#-estrutura-de-arquivos)

---

## 🎯 Visão Geral

O **NeoHub** é uma plataforma SaaS multi-portal unificada para gestão de clínicas de transplante capilar, educação médica e operações internas. A arquitetura segue o padrão de **portais de experiência** onde cada perfil de usuário acessa um conjunto específico de funcionalidades.

### Domínios Funcionais

| Domínio | Descrição | Público-Alvo |
|---------|-----------|--------------|
| **NeoCare** | Portal do Paciente | Pacientes |
| **NeoTeam** | Portal do Colaborador | Médicos, Atendentes |
| **Academy (IBRAMEC)** | Plataforma Educacional | Alunos do curso |
| **NeoLicense** | Portal do Licenciado | Franqueados |
| **Avivar** | Marketing & Crescimento | Clientes externos |
| **Admin** | Gestão Central | Administradores |

---

## 🛠 Stack Tecnológica

### Frontend
- **Framework:** React 18.3.1 + TypeScript
- **Build:** Vite
- **Estilização:** Tailwind CSS + shadcn/ui
- **Roteamento:** React Router DOM 6.30
- **Estado:** TanStack Query (React Query) 5.x
- **Formulários:** React Hook Form + Zod
- **Animações:** Framer Motion
- **Tema:** next-themes (dark/light)

### Backend
- **Plataforma:** Lovable Cloud (Supabase-based)
- **Banco de Dados:** PostgreSQL 15
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Edge Functions:** Deno Runtime
- **Realtime:** Supabase Realtime

### Integrações Externas
- **E-mail:** Resend (domínios: ibramec.com, neofolic.com.br)
- **WhatsApp:** Uazapi
- **Pagamentos:** Stripe
- **IA:** Google Gemini (via Lovable AI)

---

## 🚪 Estrutura de Portais

### Hierarquia de Perfis

```
┌─────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                    │
│              (Acesso Total - Bypass)                │
├─────────────────────────────────────────────────────┤
│  LICENCIADO  │  COLABORADOR  │  MÉDICO  │  ALUNO   │
│  (NeoLicense)│  (NeoTeam)    │ (NeoTeam)│ (Academy)│
├─────────────────────────────────────────────────────┤
│                      PACIENTE                       │
│                     (NeoCare)                       │
├─────────────────────────────────────────────────────┤
│                   CLIENTE_AVIVAR                    │
│                      (Avivar)                       │
└─────────────────────────────────────────────────────┘
```

### Mapeamento Perfil → Portal

| Perfil | Portal Padrão | Rota Base |
|--------|---------------|-----------|
| `administrador` | Admin Dashboard | `/admin-dashboard` |
| `licenciado` | NeoLicense | `/neolicense` |
| `colaborador` | NeoTeam | `/neoteam` |
| `medico` | NeoTeam (Visão Médico) | `/neoteam/doctor-view` |
| `aluno` | Academy | `/academy` |
| `paciente` | NeoCare | `/neocare` |
| `cliente_avivar` | Avivar | `/avivar` |

---

## 🗺 Sistema de Rotas

### Rotas Públicas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/login` | Login | Autenticação |
| `/reset-password` | ResetPassword | Recuperação de senha |
| `/indicacao/:code` | ReferralLanding | Landing de indicação geral |
| `/indicacao-formacao360/:code` | Formacao360ReferralLanding | Landing de indicação IBRAMEC |
| `/api-docs` | ApiDocs | Documentação de APIs |
| `/neocare-landing` | NeoCareLanding | Landing page NeoCare |
| `/neocare-protect` | NeoCareProductLanding | Landing produto NeoCare |
| `/privacy-policy` | PrivacyPolicy | Política de privacidade |
| `/terms` | TermsOfService | Termos de uso |
| `/audit-report` | AuditReportExport | Exportação de relatório |

### Rotas Protegidas - NeoCare (`/neocare/*`)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/neocare` | NeoCareHome | Dashboard do paciente |
| `/neocare/appointments` | NeoCareAppointments | Meus agendamentos |
| `/neocare/appointments/new` | NeoCareNewAppointment | Novo agendamento |
| `/neocare/settings` | NeoCareSettings | Configurações |
| `/neocare/my-records` | NeoCareDocuments | Meus documentos |
| `/neocare/orientations` | NeoCareOrientations | Orientações médicas |
| `/neocare/my-invoices` | (Placeholder) | Minhas faturas |

### Rotas Protegidas - NeoTeam (`/neoteam/*`)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/neoteam` | NeoTeamHome | Dashboard do colaborador |
| `/neoteam/schedule` | NeoTeamSchedule | Agenda |
| `/neoteam/waiting-room` | NeoTeamWaitingRoom | Sala de espera |
| `/neoteam/waiting-room/reports` | NeoTeamWaitingRoomReports | Relatórios de espera |
| `/neoteam/doctor-view` | NeoTeamDoctorView | Visão do médico |
| `/neoteam/patients` | NeoTeamPatients | Lista de pacientes |
| `/neoteam/patients/:id` | NeoTeamPatientDetail | Detalhe do paciente |
| `/neoteam/medical-records` | NeoTeamMedicalRecords | Prontuários |
| `/neoteam/documents` | NeoTeamDocuments | Documentos |
| `/neoteam/tasks` | NeoTeamTasks | Tarefas |
| `/neoteam/events` | NeoTeamEvents | Gestão de eventos |
| `/neoteam/galleries` | NeoTeamGalleries | Galerias de fotos |
| `/neoteam/anamnesis` | NeoTeamAnamnesis | Anamnese |
| `/neoteam/postvenda` | PostVendaHome | Pós-venda |
| `/neoteam/postvenda/chamados` | ChamadoListPage | Lista de chamados |
| `/neoteam/postvenda/chamados/:id` | ChamadoDetailPage | Detalhe do chamado |
| `/neoteam/postvenda/sla` | PostVendaSlaPage | Configuração SLA |
| `/neoteam/postvenda/nps` | PostVendaNpsPage | Relatórios NPS |
| `/neoteam/staff-roles` | NeoTeamStaffRoles | Cargos da equipe |
| `/neoteam/settings` | NeoTeamSettings | Configurações |

### Rotas Protegidas - Academy (`/academy/*`)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/academy` | AcademyHome | Dashboard do aluno |
| `/academy/courses` | AcademyCourses | Cursos disponíveis |
| `/academy/classes/:classId` | AcademyClassDetail | Detalhe da turma |
| `/academy/schedule` | AcademySchedule | Cronograma |
| `/academy/materials` | Materials | Materiais didáticos |
| `/academy/exams` | AcademyExams | Provas |
| `/academy/exams/:examId/take` | AcademyExamTaking | Realizar prova |
| `/academy/exams/:examId/results/:attemptId` | AcademyExamResults | Resultados |
| `/academy/certificates` | AcademyCertificates | Certificados |
| `/academy/community` | AcademyCommunity | Comunidade |
| `/academy/chat` | AcademyChat | Chat |
| `/academy/chat/:recipientId` | AcademyChat | Chat com usuário |
| `/academy/referral` | AcademyReferral | Programa de indicação |
| `/academy/profile` | AcademySettings | Configurações |
| `/academy/pesquisa-dia2/:classId` | Day2SurveyPage | Pesquisa Dia 2 |
| `/academy/admin/enrollments` | AcademyEnrollmentsAdmin | Admin: Matrículas |
| `/academy/admin/students` | AcademyStudentsAdmin | Admin: Alunos |
| `/academy/admin/surveys` | SurveyManagement | Admin: Pesquisas |

### Rotas Protegidas - NeoLicense (`/neolicense/*`)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/neolicense` | LicenseeHome | Dashboard do licenciado |
| `/neolicense/dashboard` | Dashboard | Indicadores |
| `/neolicense/university` | University | Universidade corporativa |
| `/neolicense/materials` | Materials | Materiais |
| `/neolicense/partners` | Partners | Parceiros |
| `/neolicense/surgery` | SurgerySchedule | Agenda de cirurgias |
| `/neolicense/achievements` | Achievements | Conquistas |
| `/neolicense/referral` | ReferralProgram | Indicações |
| `/neolicense/structure` | EstruturaNeo | Regularização |
| `/neolicense/profile` | Profile | Perfil |
| `/neolicense/hotleads` | HotLeads | HotLeads |
| `/neolicense/career` | Career | Carreira |
| `/neolicense/community` | Community | Comunidade |

### Rotas Protegidas - Admin

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/admin-dashboard` | AdminDashboard | Dashboard central |
| `/alunos` | LicenseesPanel | Gestão de alunos/licenciados |
| `/access-matrix` | AccessMatrix | Matriz de permissões |
| `/monitoring` | UserMonitoring | Monitoramento de usuários |
| `/system-metrics` | SystemMetrics | Métricas do sistema |
| `/admin/sentinel` | SystemSentinel | Central de alertas |
| `/admin/announcements` | AnnouncementsAdmin | Gestão de anúncios |
| `/admin/banners` | BannersAdmin | Gestão de banners |
| `/admin/module-overrides` | ModuleOverridesAdmin | Overrides de módulos |
| `/admin/referrals` | ReferralsAdmin | Gestão de indicações |
| `/admin/event-logs` | EventLogs | Logs de eventos |

### Rotas Protegidas - Marketplace

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/marketplace` | MarketplaceHome | Home do marketplace |
| `/marketplace/professionals` | MarketplaceProfessionals | Profissionais |
| `/marketplace/units` | MarketplaceUnits | Unidades |
| `/marketplace/leads` | MarketplaceLeads | Leads |
| `/marketplace/schedule` | MarketplaceSchedule | Agenda |
| `/marketplace/reviews` | MarketplaceReviews | Avaliações |
| `/marketplace/campaigns` | MarketplaceCampaigns | Campanhas |
| `/marketplace/dashboard` | MarketplaceDashboard | Dashboard |
| `/marketplace/discovery` | MarketplaceDiscovery | Descoberta |

### Rotas Legadas (Compatibilidade)

| Rota | Componente | Status |
|------|------------|--------|
| `/home` | LicenseeHome | Ativo |
| `/dashboard` | Dashboard | Ativo |
| `/comparison` | ClinicComparison | Ativo |
| `/university` | University | Ativo |
| `/university/trilha/:trackId` | TrackDetail | Ativo |
| `/university/exams` | ExamsList | Ativo |
| `/regularization` | Regularization | Ativo |
| `/materials` | Materials | Ativo |
| `/marketing` | Marketing | Ativo |
| `/store` | Store | Ativo |
| `/financial` | Financial | Ativo |
| `/mentorship` | Mentorship | Ativo |
| `/systems` | Systems | Ativo |
| `/career` | Career | Ativo |
| `/hotleads` | HotLeads | Ativo |
| `/community` | Community | Ativo |
| `/profile` | Profile | Ativo |
| `/admin` | AdminPanel | Ativo |
| `/certificates` | Certificates | Ativo |
| `/achievements` | Achievements | Ativo |
| `/partners` | Partners | Ativo |
| `/license-payments` | LicensePayments | Ativo |
| `/estrutura-neo` | EstruturaNeo | Ativo |
| `/indique-e-ganhe` | ReferralProgram | Ativo |
| `/weekly-reports` | WeeklyReports | Ativo |
| `/surgery-schedule` | SurgerySchedule | Ativo |
| `/sala-tecnica` | SalaTecnica | Ativo |
| `/consolidated-results` | ConsolidatedResults | Ativo |
| `/portal/*` | PortalApp | Legado |
| `/clinic/*` | ClinicApp | Legado |

---

## 🔐 Sistema de Autenticação e RBAC

### Fluxo de Autenticação

```
┌──────────────┐     ┌─────────────────┐     ┌───────────────────┐
│    Login     │────▶│ UnifiedAuth     │────▶│ get_user_context()│
│   (email/    │     │   Context       │     │     (RPC)         │
│   senha)     │     │                 │     │                   │
└──────────────┘     └─────────────────┘     └───────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  canAccessModule│
                     │   (frontend)    │
                     └─────────────────┘
```

### Funções RPC de Autorização

| Função | Descrição |
|--------|-----------|
| `get_user_context()` | Retorna contexto completo do usuário (perfis, permissões, módulos) |
| `is_neohub_admin(user_id)` | Verifica se é administrador |
| `has_neohub_profile(user_id, profile)` | Verifica perfil específico |
| `can_access_module(user_id, module_code)` | Verifica acesso a módulo |
| `can_access_module_with_action(user_id, module, action)` | Verifica ação específica |
| `user_has_permission(permission_key)` | Verifica permissão granular |
| `user_has_profile(profile_key)` | Verifica perfil |

### Estrutura de Permissões

```
Formato: module_code:action

Exemplo:
- academy_courses:read
- neoteam_patients:write
- admin_settings:delete
```

### Tabelas de Controle de Acesso

| Tabela | Função |
|--------|--------|
| `neohub_users` | Usuários do sistema |
| `neohub_user_profiles` | Perfis atribuídos a usuários |
| `neohub_module_permissions` | Permissões por perfil |
| `neohub_user_module_overrides` | Overrides manuais |
| `profile_definitions` | Definições de perfis |
| `permission_definitions` | Definições de permissões |
| `user_profile_assignments` | Atribuições de perfil com tenant/clinic |

---

## ⚡ Edge Functions (APIs)

### Notificações e Alertas

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `notify-lead-arrival` | POST | ❌ | Notifica chegada de lead |
| `notify-login` | POST | ❌ | Notifica login de usuário |
| `notify-user-login` | POST | ❌ | E-mail de login para admins |
| `notify-error-alert` | POST | ✅ | Alerta de erro para TI |
| `notify-hotlead-event` | POST | ✅ | Evento de HotLead |
| `notify-patient-called` | POST | ✅ | Notifica chamada de paciente |
| `notify-referral` | POST | ✅ | Notifica indicação |
| `notify-survey-completed` | POST | ✅ | Notifica pesquisa concluída |

### Gestão de Usuários

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `add-single-student` | POST | ✅ | Adiciona aluno individual |
| `send-student-credentials` | POST | ✅ | Envia credenciais por e-mail |
| `bulk-enroll-students` | POST | ✅ | Matrícula em lote |
| `bulk-reset-passwords` | POST | ✅ | Reset de senhas em lote |
| `admin-reset-password` | POST | ✅ | Reset admin de senha |
| `emergency-reset` | POST | ✅ | Reset de emergência |
| `create-test-user` | POST | ✅ | Cria usuário de teste |
| `setup-neohub-test-users` | POST | ✅ | Setup usuários de teste |

### Senha e Autenticação

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `request-password-reset` | POST | ❌ | Solicita reset de senha |
| `send-password-reset` | POST | ❌ | Envia e-mail de reset |
| `reset-password` | POST | ❌ | Executa reset de senha |

### Leads e CRM

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `receive-lead` | POST | ❌ | Webhook de recebimento de lead |
| `import-avivar-data` | POST | ✅ | Importa dados Avivar |

### IA e Análise

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `jon-jobs-chat` | POST | ❌ | Chat com IA (Jon Jobs) |
| `face-search` | POST | ✅ | Busca facial em fotos |
| `analyze-daily-metrics` | POST | ✅ | Análise de métricas |
| `analyze-day2-survey-insights` | POST | ✅ | Insights pesquisa Dia 2 |
| `analyze-survey-insights` | POST | ✅ | Insights de pesquisas |

### Importação de Dados

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `import-ibramec-students` | POST | ✅ | Importa alunos IBRAMEC |
| `import-patients` | POST | ✅ | Importa pacientes |
| `import-daily-metrics` | POST | ✅ | Importa métricas diárias |
| `import-staff-team` | POST | ✅ | Importa equipe |

### Pacientes

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `create-patient-account` | POST | ✅ | Cria conta de paciente |
| `create-test-patient` | POST | ✅ | Cria paciente de teste |
| `check-patient-orientations` | POST | ❌ | Verifica orientações |

### Monitoramento

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `check-inactive-users` | POST | ❌ | Verifica usuários inativos |
| `check-metric-alerts` | POST | ❌ | Verifica alertas de métricas |
| `sentinel-check` | POST | ✅ | Verificação do Sentinel |
| `sentinel-whatsapp` | POST | ✅ | WhatsApp do Sentinel |

### Relatórios e Agendamentos

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `send-weekly-reports` | POST | ❌ | Envia relatórios semanais |
| `send-appointment-notifications` | POST | ✅ | Notificações de agendamento |
| `send-day3-survey-notification` | POST | ✅ | Notifica pesquisa Dia 3 |
| `send-referral-notification` | POST | ✅ | Notifica indicações |

### Pagamentos

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `create-referral-checkout` | POST | ✅ | Cria checkout de indicação (Stripe) |

---

## 🗄 Banco de Dados

### Tabelas Principais

#### Core - Usuários e Autenticação

| Tabela | Descrição |
|--------|-----------|
| `neohub_users` | Usuários principais do sistema |
| `neohub_user_profiles` | Perfis atribuídos a usuários |
| `neohub_module_permissions` | Permissões por perfil/módulo |
| `neohub_user_module_overrides` | Overrides manuais de permissão |
| `profiles` | Perfis legados |
| `user_roles` | Roles legadas |
| `password_reset_tokens` | Tokens de reset de senha |

#### NeoTeam - Operações Clínicas

| Tabela | Descrição |
|--------|-----------|
| `neoteam_appointments` | Agendamentos |
| `neoteam_waiting_room` | Sala de espera |
| `neoteam_patients` | Pacientes (vinculados) |
| `neoteam_doctors` | Médicos |
| `neoteam_doctor_schedules` | Agendas dos médicos |
| `neoteam_schedule_blocks` | Bloqueios de agenda |
| `neoteam_branches` | Filiais |
| `neoteam_tasks` | Tarefas |
| `neoteam_patient_documents` | Documentos de pacientes |
| `neoteam_anamnesis` | Anamneses |
| `neoteam_settings` | Configurações |
| `neoteam_whatsapp_logs` | Logs de WhatsApp |

#### Clínica - Operações Cirúrgicas

| Tabela | Descrição |
|--------|-----------|
| `clinic_patients` | Base central de pacientes |
| `clinic_sales` | Vendas |
| `clinic_surgeries` | Cirurgias |
| `clinics` | Clínicas cadastradas |

#### Academy - Educação

| Tabela | Descrição |
|--------|-----------|
| `courses` | Cursos |
| `course_classes` | Turmas |
| `course_modules` | Módulos do curso |
| `class_enrollments` | Matrículas |
| `class_schedule` | Cronograma por dia |
| `class_schedule_items` | Itens do cronograma |
| `exams` | Provas |
| `exam_questions` | Questões |
| `exam_attempts` | Tentativas |
| `exam_answers` | Respostas |
| `course_galleries` | Galerias de fotos |
| `course_gallery_photos` | Fotos das galerias |
| `gallery_photo_analytics` | Analytics de fotos |
| `student_referrals` | Indicações de alunos |

#### Pesquisas de Satisfação

| Tabela | Descrição |
|--------|-----------|
| `day1_satisfaction_surveys` | Pesquisa Dia 1 (77 campos) |
| `day2_satisfaction_surveys` | Pesquisa Dia 2 (20 campos + scores) |
| `day3_satisfaction_surveys` | Pesquisa Dia 3 (16 campos) |
| `satisfaction_survey_responses` | Respostas gerais |
| `survey_ai_insights` | Insights de IA |

#### CRM e Leads

| Tabela | Descrição |
|--------|-----------|
| `leads` | Leads capturados |
| `lead_tasks` | Tarefas de follow-up |
| `crm_conversations` | Conversas do CRM |
| `crm_messages` | Mensagens do CRM |
| `referral_leads` | Leads de indicação |

#### Pós-Venda

| Tabela | Descrição |
|--------|-----------|
| `postvenda_chamados` | Chamados |
| `postvenda_chamado_historico` | Histórico |
| `postvenda_anexos` | Anexos |
| `postvenda_nps` | Avaliações NPS |
| `postvenda_sla_config` | Configuração SLA |

#### Portal (Legado)

| Tabela | Descrição |
|--------|-----------|
| `portal_users` | Usuários do portal |
| `portal_user_roles` | Roles do portal |
| `portal_appointments` | Agendamentos |
| `portal_patients` | Pacientes |
| `portal_doctors` | Médicos |
| `portal_medical_records` | Prontuários |
| `portal_inventory_items` | Itens de estoque |
| `portal_stock_movements` | Movimentações |
| `portal_suppliers` | Fornecedores |
| `portal_invoices` | Faturas |
| `portal_payments` | Pagamentos |

#### Monitoramento e Logs

| Tabela | Descrição |
|--------|-----------|
| `system_event_logs` | Logs de eventos |
| `system_alerts` | Alertas do sistema |
| `system_health_checks` | Verificações de saúde |
| `system_metrics_daily` | Métricas diárias |
| `admin_audit_log` | Log de auditoria |
| `user_sessions` | Sessões de usuários |

#### Gamificação

| Tabela | Descrição |
|--------|-----------|
| `achievements` | Conquistas disponíveis |
| `user_achievements` | Conquistas do usuário |
| `user_goals` | Metas do usuário |

#### Comunicação

| Tabela | Descrição |
|--------|-----------|
| `announcements` | Anúncios |
| `carousel_banners` | Banners do carrossel |
| `banner_clicks` | Cliques em banners |
| `notifications` | Notificações |
| `notification_recipients` | Destinatários |
| `community_messages` | Mensagens da comunidade |
| `chat_messages` | Mensagens de chat |
| `contact_requests` | Solicitações de contato |

#### Eventos e Checklists

| Tabela | Descrição |
|--------|-----------|
| `event_checklists` | Checklists de eventos |
| `event_checklist_items` | Itens do checklist |
| `sala_tecnica_meetings` | Reuniões técnicas |
| `sala_tecnica_confirmations` | Confirmações |

#### Staff (Equipe)

| Tabela | Descrição |
|--------|-----------|
| `staff_profiles` | Perfis de staff |
| `staff_roles` | Cargos |
| `staff_user_roles` | Atribuições de cargo |
| `staff_role_permissions` | Permissões por cargo |
| `staff_system_access` | Acesso a sistemas |

#### Métricas e Alertas

| Tabela | Descrição |
|--------|-----------|
| `daily_metrics` | Métricas diárias |
| `metric_alerts` | Configuração de alertas |
| `alert_history` | Histórico de alertas |
| `metric_history` | Histórico de métricas |
| `monitored_systems` | Sistemas monitorados |

### Views

| View | Descrição |
|------|-----------|
| `exam_questions_student` | Questões sem gabarito (aluno) |
| `gallery_stats` | Estatísticas de galerias |
| `gallery_photo_stats` | Estatísticas de fotos |

### Funções de Banco

| Função | Tipo | Descrição |
|--------|------|-----------|
| `get_user_context()` | RPC | Contexto completo do usuário |
| `is_neohub_admin(uuid)` | Helper | Verifica admin |
| `has_neohub_profile(uuid, profile)` | Helper | Verifica perfil |
| `can_access_module(uuid, module)` | Helper | Verifica acesso |
| `calculate_day2_scores()` | Trigger | Calcula scores da pesquisa Dia 2 |
| `validate_exam_answer(...)` | RPC | Valida resposta de prova |
| `get_exam_results_with_answers(...)` | RPC | Retorna resultados com respostas |
| `increment_banner_click(uuid)` | RPC | Incrementa clique em banner |
| `update_gallery_photo_count()` | Trigger | Atualiza contagem de fotos |

---

## 📦 Storage (Armazenamento)

### Buckets Configurados

| Bucket | Público | Uso |
|--------|---------|-----|
| `avatars` | ✅ | Fotos de perfil |
| `materials` | ✅ | Materiais didáticos |
| `clinic-logos` | ✅ | Logos das clínicas |
| `surgery-photos` | ✅ | Fotos de cirurgias |
| `patient-documents` | ❌ | Documentos de pacientes |
| `videos` | ✅ | Vídeos educacionais |
| `banners` | ✅ | Banners do carrossel |
| `course-galleries` | ✅ | Galerias de turmas |
| `email-assets` | ✅ | Assets para e-mails |

---

## 🔗 Webhooks e Integrações

### Webhooks de Entrada

| Endpoint | Origem | Descrição |
|----------|--------|-----------|
| `/functions/v1/receive-lead` | Landing Pages | Captura de leads |
| `/functions/v1/notify-lead-arrival` | WhatsApp | Notificação de chegada |

### Integrações Externas

#### Resend (E-mail)

| Domínio | Uso |
|---------|-----|
| `ibramec.com` | E-mails Academy/IBRAMEC |
| `neofolic.com.br` | E-mails corporativos |
| `adm@ibramec.com` | Remetente padrão IBRAMEC |
| `ti@neofolic.com.br` | Alertas de erro |

#### Uazapi (WhatsApp)

| Uso | Descrição |
|-----|-----------|
| Alertas críticos | System Sentinel |
| Notificações | Leads, pacientes |

#### Stripe (Pagamentos)

| Produto | Descrição |
|---------|-----------|
| Checkout Sessions | Indicações IBRAMEC |
| Payment Links | Pagamentos de cursos |

---

## 🔔 Notificações

### Templates de E-mail

| Template | Evento | Destinatário |
|----------|--------|--------------|
| Credenciais IBRAMEC | Cadastro de aluno | Aluno |
| Reset de Senha | Solicitação de reset | Usuário |
| Login Detectado | Login no sistema | Administradores |
| Alerta de Erro | Erro no sistema | TI |
| Pesquisa Concluída | Envio de pesquisa | Administradores |
| Nova Indicação | Cadastro de indicação | Indicador + Admin |

### Notificações WhatsApp

| Tipo | Trigger | Destinatário |
|------|---------|--------------|
| Alerta Crítico | Sentinel | Admins configurados |
| Inatividade | Cron | Gestão |

---

## 🪝 Hooks Personalizados

### Autenticação e Permissões

| Hook | Descrição |
|------|-----------|
| `useUnifiedAuth` | Contexto de autenticação unificado |
| `usePermissions` | Verificação de permissões |
| `useModulePermissions` | Permissões por módulo |
| `useAccessMatrix` | Matriz de acesso |

### Dados e Estado

| Hook | Descrição |
|------|-----------|
| `useLeads` | Gestão de leads |
| `useSales` | Gestão de vendas |
| `useMaterials` | Materiais didáticos |
| `useExams` | Provas e questões |
| `useAchievements` | Conquistas |
| `useAnnouncements` | Anúncios |
| `useBanners` | Banners do carrossel |

### Métricas e Monitoramento

| Hook | Descrição |
|------|-----------|
| `useDailyMetrics` | Métricas diárias |
| `useClinicMetrics` | Métricas por clínica |
| `useSystemMetrics` | Métricas do sistema |
| `useMetricAlerts` | Alertas de métricas |
| `useMetricHistory` | Histórico de métricas |
| `useSystemSentinel` | Central Sentinel |
| `useEventLogs` | Logs de eventos |

### CRM

| Hook | Descrição |
|------|-----------|
| `useCrmConversations` | Conversas do CRM |
| `useCrmMetrics` | Métricas do CRM |
| `useCrmTasks` | Tarefas do CRM |

### Outros

| Hook | Descrição |
|------|-----------|
| `useUniversity` | Universidade corporativa |
| `useSurgerySchedule` | Agenda de cirurgias |
| `useSalaTecnica` | Sala técnica |
| `useVideos` | Vídeos |
| `useUserPresence` | Presença online |
| `useDeepLinks` | Deep links (mobile) |
| `usePushNotifications` | Push notifications |
| `useRealtimeNotifications` | Notificações realtime |
| `useEventLogger` | Logger de eventos |
| `useOnboarding` | Onboarding |
| `useFirstSteps` | Primeiros passos |
| `useModuleOverrides` | Overrides de módulos |
| `useUsageStats` | Estatísticas de uso |

---

## 📁 Estrutura de Arquivos

```
src/
├── academy/                    # Módulo Academy/IBRAMEC
│   ├── components/             # Componentes específicos
│   │   └── surveys/            # Pesquisas de satisfação
│   ├── hooks/                  # Hooks específicos
│   ├── pages/                  # Páginas do Academy
│   └── index.ts                # Exports
│
├── clinic/                     # Módulo Clínica (legado)
│   └── ClinicApp.tsx
│
├── components/                 # Componentes globais
│   ├── ui/                     # shadcn/ui components
│   ├── guards/                 # Route guards
│   ├── EventTracker.tsx        # Rastreamento de eventos
│   ├── SupportChat.tsx         # Chat de suporte
│   └── UnifiedSidebar.tsx      # Sidebar unificada
│
├── contexts/                   # Contextos React
│   ├── UnifiedAuthContext.tsx  # Auth principal
│   ├── DataContext.tsx         # Dados globais
│   └── DashboardPeriodContext.tsx
│
├── hooks/                      # Hooks globais
│
├── integrations/               # Integrações
│   └── supabase/
│       ├── client.ts           # Cliente Supabase
│       └── types.ts            # Tipos gerados
│
├── lib/                        # Utilitários
│   └── queryClient.ts
│
├── marketplace/                # Módulo Marketplace
│   └── pages/
│
├── neohub/                     # Core NeoHub
│   ├── components/             # Componentes NeoHub
│   ├── contexts/               # Contextos NeoHub
│   ├── lib/
│   │   └── permissions.ts      # Sistema de permissões
│   └── pages/
│       ├── neocare/            # Páginas NeoCare
│       └── neoteam/            # Páginas NeoTeam
│
├── pages/                      # Páginas globais/legadas
│   └── admin/                  # Páginas administrativas
│
├── portal/                     # Portal legado
│
├── postvenda/                  # Módulo Pós-Venda
│   └── pages/
│
├── utils/                      # Utilitários
│
├── App.tsx                     # Entry point
├── main.tsx                    # Bootstrap
└── index.css                   # Estilos globais

supabase/
├── functions/                  # Edge Functions
│   ├── add-single-student/
│   ├── notify-user-login/
│   ├── receive-lead/
│   └── ...
├── templates/
│   └── recovery.html           # Template de e-mail
└── config.toml                 # Configuração Supabase

docs/
├── SYSTEM-ARCHITECTURE.md      # Este documento
├── ROADMAP.md                  # Roadmap do projeto
├── QA.md                       # Registro de QA
└── pops/                       # Procedimentos operacionais
    └── ...
```

---

## 📝 Observações Finais

### Convenções de Código

- **Prefixos de tabelas:** `neoteam_`, `portal_`, `postvenda_`, `clinic_`
- **Perfis NeoHub:** Enum `neohub_profile`
- **Módulos:** Formato `portal_modulo` (ex: `academy_courses`)
- **Permissões:** Formato `module:action` (ex: `academy_courses:read`)

### Segurança

- Todas as tabelas com dados sensíveis possuem RLS ativo
- Views analíticas usam `security_invoker = true`
- Edge Functions públicas validam origem
- DOMPurify para sanitização de HTML

### Monitoramento

- EventTracker captura navegação e ações
- System Sentinel monitora saúde do sistema
- Logs de login notificam administradores

---

> **Mantido por:** Equipe de Desenvolvimento NeoHub  
> **Última revisão:** 2026-01-27
