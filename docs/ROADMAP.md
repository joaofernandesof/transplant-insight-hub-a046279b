# 🗺️ Roadmap do Projeto NeoHub

> Documento técnico de arquitetura e funcionalidades existentes no sistema SaaS NeoHub.

**Última atualização:** 2026-01-28  
**Versão:** 2.0.0

---

## 📊 Visão Geral do Projeto

| Métrica | Valor |
|---------|-------|
| Portais Ativos | 7 (Academy, NeoCare, NeoTeam, NeoLicense, Avivar, IPROMED, NeoHairScan) |
| Edge Functions | 52 |
| Tabelas Principais | 80+ |
| Perfis de Acesso | 7 (administrador, colaborador, medico, paciente, aluno, licenciado, ipromed, cliente_avivar) |
| Hooks Personalizados | 39 |
| Framework | React 18 + Vite + Tailwind + TypeScript |
| Backend | Supabase (Lovable Cloud) |

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Estado | TanStack Query, Zustand (contextos) |
| Roteamento | React Router DOM v6 |
| UI Components | shadcn/ui, Radix UI |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Autenticação | Supabase Auth + RBAC customizado |
| E-mail | Resend |
| WhatsApp | Uazapi |
| IA | Lovable AI Gateway (Gemini/GPT) |
| Pagamentos | Stripe |
| Mobile | Capacitor (iOS/Android) |

### Modelo de Permissões (RBAC)

O sistema utiliza um modelo RBAC (Role-Based Access Control) unificado:

- **Tabela `neohub_users`**: Usuários base do sistema
- **Tabela `neohub_user_profiles`**: Perfis atribuídos aos usuários
- **Tabela `neohub_module_permissions`**: Matriz de permissões por perfil/módulo
- **Tabela `neohub_user_module_overrides`**: Overrides manuais de permissão
- **RPC `get_user_context()`**: Função principal que retorna contexto completo do usuário

---

## 🌐 Módulos do Sistema

### 1. Academy (Portal do Aluno - IBRAMEC)

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Gestão educacional para alunos de cursos presenciais de formação capilar |
| **Perfis de Acesso** | aluno, administrador |
| **Rota Base** | `/academy` |
| **Status** | ✅ Ativo |

#### Funcionalidades

| Funcionalidade | Descrição | Rota/Componente | Status |
|----------------|-----------|-----------------|--------|
| Home do Aluno | Dashboard com anúncios, progresso e acesso rápido | `/academy` | ✅ Concluída |
| Lista de Cursos | Catálogo de cursos e turmas | `/academy/courses` | ✅ Concluída |
| Detalhes da Turma | Cronograma visual, materiais e galerias | `/academy/classes/:classId` | ✅ Concluída |
| Cronograma Visual | Timeline de atividades do curso | `/academy/schedule` | ✅ Concluída |
| Sistema de Provas | Realização de provas com timer e validação | `/academy/exams/:examId/take` | ✅ Concluída |
| Resultados de Provas | Visualização de respostas e explicações | `/academy/exams/:examId/results/:attemptId` | ✅ Concluída |
| Certificados | Emissão e download de certificados PDF | `/academy/certificates` | ✅ Concluída |
| Comunidade | Networking entre alunos com filtros | `/academy/community` | ✅ Concluída |
| Chat Interno | Mensagens diretas entre alunos | `/academy/chat` | ✅ Concluída |
| Programa de Indicação | Sistema de referral com comissões | `/academy/referral` | ✅ Concluída |
| Perfil/Configurações | Edição de dados pessoais e avatar | `/academy/profile` | ✅ Concluída |
| Gestão de Matrículas (Admin) | CRUD de matrículas por turma | `/academy/admin/enrollments` | ✅ Concluída |
| Gestão de Alunos (Admin) | Lista e importação de alunos | `/academy/admin/students` | ✅ Concluída |
| Gestão de Pesquisas (Admin) | Dashboards Dia 1, 2 e 3 com analytics | `/academy/admin/surveys` | ✅ Concluída |
| Pesquisa Dia 2 | Formulário de satisfação e scoring de leads | `/academy/pesquisa-dia2/:classId` | ✅ Concluída |
| Landing de Indicação | Página pública para captação de indicados | `/indicacao/:code`, `/indicacao-formacao360/:code` | ✅ Concluída |

---

### 2. NeoCare (Portal do Paciente)

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Jornada digital do paciente pré e pós-operatório |
| **Perfis de Acesso** | paciente, administrador |
| **Rota Base** | `/neocare` |
| **Status** | ✅ Ativo |

#### Funcionalidades

| Funcionalidade | Descrição | Rota/Componente | Status |
|----------------|-----------|-----------------|--------|
| Home do Paciente | Dashboard com próximas etapas e status | `/neocare` | ✅ Concluída |
| Agendamentos | Lista e histórico de consultas | `/neocare/appointments` | ✅ Concluída |
| Novo Agendamento | Fluxo de solicitação de consulta | `/neocare/appointments/new` | ✅ Concluída |
| Meus Documentos | Acesso a exames e documentos | `/neocare/my-records` | ✅ Concluída |
| Orientações Pré/Pós-op | Checklists por fase cirúrgica | `/neocare/orientations` | ✅ Concluída |
| Configurações | Preferências e dados pessoais | `/neocare/settings` | ✅ Concluída |
| Landing Page | Página pública de apresentação | `/neocare-landing` | ✅ Concluída |
| Landing Produto | Página de venda do serviço | `/neocare-protect` | ✅ Concluída |

---

### 3. NeoTeam (Portal do Colaborador)

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Operação clínica, gestão de pacientes e equipe médica |
| **Perfis de Acesso** | colaborador, medico, administrador |
| **Rota Base** | `/neoteam` |
| **Status** | ✅ Ativo |

#### Funcionalidades

| Funcionalidade | Descrição | Rota/Componente | Status |
|----------------|-----------|-----------------|--------|
| Home do Colaborador | Dashboard operacional | `/neoteam` | ✅ Concluída |
| Agenda | Calendário de atendimentos | `/neoteam/schedule` | ✅ Concluída |
| Sala de Espera | Fila de pacientes com chamada | `/neoteam/waiting-room` | ✅ Concluída |
| Relatórios Sala de Espera | Analytics de tempo de espera | `/neoteam/waiting-room/reports` | ✅ Concluída |
| Visão do Médico | Dashboard clínico para médicos | `/neoteam/doctor-view` | ✅ Concluída |
| Lista de Pacientes | CRUD de pacientes da clínica | `/neoteam/patients` | ✅ Concluída |
| Detalhe do Paciente | Perfil completo com abas | `/neoteam/patients/:id` | ✅ Concluída |
| Prontuário Médico | Evolução clínica e histórico | `/neoteam/medical-records` | ✅ Concluída |
| Documentos | Gestão de arquivos clínicos | `/neoteam/documents` | ✅ Concluída |
| Tarefas | Kanban de tarefas da equipe | `/neoteam/tasks` | ✅ Concluída |
| Eventos/Checklists | Gestão de cursos e checklists | `/neoteam/events` | ✅ Concluída |
| Galerias de Fotos | Upload e gestão de fotos de turmas | `/neoteam/galleries` | ✅ Concluída |
| Anamnese | Formulário de avaliação capilar | `/neoteam/anamnesis` | ✅ Concluída |
| Dashboard Jurídico | Analytics de pesquisas jurídicas | `/neoteam/legal-dashboard` | ✅ Concluída |
| Pós-Venda | Gestão de chamados | `/neoteam/postvenda` | ✅ Concluída |
| Lista de Chamados | Tabela de demandas | `/neoteam/postvenda/chamados` | ✅ Concluída |
| Detalhe do Chamado | Histórico e resolução | `/neoteam/postvenda/chamados/:id` | ✅ Concluída |
| Configuração SLA | Regras de prazos | `/neoteam/postvenda/sla` | ✅ Concluída |
| Relatórios NPS | Métricas de satisfação | `/neoteam/postvenda/nps` | ✅ Concluída |
| Gestão de Cargos | Departamentos e funções | `/neoteam/staff-roles` | ✅ Concluída |
| Configurações | Preferências do portal | `/neoteam/settings` | ✅ Concluída |

---

### 4. NeoLicense (Portal do Licenciado)

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Acompanhamento de clínicas licenciadas da rede |
| **Perfis de Acesso** | licenciado |
| **Rota Base** | `/neolicense` |
| **Status** | ✅ Ativo |

#### Funcionalidades

| Funcionalidade | Descrição | Rota/Componente | Status |
|----------------|-----------|-----------------|--------|
| Home do Licenciado | Hub com acesso rápido aos módulos | `/neolicense` | ✅ Concluída |
| Dashboard de Métricas | KPIs da clínica | `/neolicense/dashboard` | ✅ Concluída |
| Universidade | Trilhas de aprendizado | `/neolicense/university` | ✅ Concluída |
| Detalhe da Trilha | Aulas e materiais | `/neolicense/university/trilha/:trackId` | ✅ Concluída |
| Provas | Sistema de avaliação | `/neolicense/university/exams` | ✅ Concluída |
| Central de Materiais | Downloads e recursos | `/neolicense/materials` | ✅ Concluída |
| Vitrine de Parceiros | Diretório de fornecedores | `/neolicense/partners` | ✅ Concluída |
| Agenda de Cirurgias | Calendário cirúrgico | `/neolicense/surgery` | ✅ Concluída |
| Conquistas | Gamificação e badges | `/neolicense/achievements` | ✅ Concluída |
| Indique e Ganhe | Programa de indicação | `/neolicense/referral` | ✅ Concluída |
| Estrutura NEO | Organograma da rede | `/neolicense/structure` | ✅ Concluída |
| Perfil | Dados do licenciado | `/neolicense/profile` | ✅ Concluída |
| Hot Leads | Gestão de leads quentes | `/neolicense/hotleads` | ✅ Concluída |
| Carreira | Plano de evolução | `/neolicense/career` | ✅ Concluída |
| Comunidade | Networking entre licenciados | `/neolicense/community` | ✅ Concluída |

---

### 5. Avivar (Portal Cliente Avivar)

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Dashboard de marketing e crescimento para clientes Avivar |
| **Perfis de Acesso** | cliente_avivar, administrador |
| **Rota Base** | `/avivar` |
| **Status** | ⚠️ Parcial |

#### Funcionalidades

| Funcionalidade | Descrição | Rota/Componente | Status |
|----------------|-----------|-----------------|--------|
| Home Avivar | Dashboard principal | `/avivar` | ⚠️ Placeholder |
| Dashboard Marketing | Métricas de campanhas | `/avivar/dashboard` | ⚠️ Placeholder |
| Hot Leads | Gestão de leads | `/avivar/hotleads` | ✅ Concluída |
| Tráfego | Indicadores de ads | `/avivar/traffic` | ⚠️ Placeholder |
| Central Marketing | Materiais e templates | `/avivar/marketing` | ⚠️ Placeholder |
| Mentoria | Sessões de mentoria | `/avivar/mentorship` | ⚠️ Placeholder |

---

### 6. IPROMED (Instituto de Proteção Médica)

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Gestão jurídica preventiva para médicos |
| **Perfis de Acesso** | ipromed, administrador |
| **Rota Base** | `/ipromed` |
| **Status** | ✅ Ativo |

#### Funcionalidades

| Funcionalidade | Descrição | Rota/Componente | Status |
|----------------|-----------|-----------------|--------|
| Home IPROMED | Dashboard com widgets Astrea | `/ipromed` | ✅ Concluída |
| Dashboard Operacional | KPIs e alertas | `/ipromed/dashboard` | ✅ Concluída |
| Alunos Direito Médico | Lista de alunos do curso | `/ipromed/students` | ✅ Concluída |
| Provas | Avaliações jurídicas | `/ipromed/exams` | ✅ Concluída |
| Mentoras | Perfis das advogadas | `/ipromed/mentors` | ✅ Concluída |
| Pesquisas | Dashboards de satisfação | `/ipromed/surveys` | ✅ Concluída |
| Leads Jurídicos | Pipeline de prospects | `/ipromed/leads` | ✅ Concluída |
| Clientes | Gestão de clientes ativos | `/ipromed/clients` | ✅ Concluída |
| Detalhe do Cliente | Perfil completo com jornada | `/ipromed/clients/:id` | ✅ Concluída |
| Jornada do Cliente | Framework 17 entregáveis D0-D30 | `/ipromed/journey` | ✅ Concluída |
| Contratos | CRUD de contratos legais | `/ipromed/contracts` | ✅ Concluída |
| Legal Hub | Processos e casos | `/ipromed/legal` | ✅ Concluída |

---

### 7. NeoHairScan (Diagnóstico Capilar IA)

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Análise capilar com IA para simulação de progressão e transplante |
| **Perfis de Acesso** | Todos (autenticados) |
| **Rota Base** | `/neohairscan` |
| **Status** | ✅ Ativo |

#### Funcionalidades

| Funcionalidade | Descrição | Rota/Componente | Status |
|----------------|-----------|-----------------|--------|
| Home Scanner | Interface principal de análise | `/neohairscan` | ✅ Concluída |
| Captura de Selfie | Câmera com validação de rosto | `SelfieCaptureDialog` | ✅ Concluída |
| Progressão de Calvície | Simulação de 1-10 anos | `hair-scan-analysis` (action: progression) | ✅ Concluída |
| Scan de Densidade | Visualização tipo raio-X | `hair-scan-analysis` (action: scan) | ✅ Concluída |
| New Version | 12 variações pós-transplante | `hair-scan-analysis` (action: newversion) | ✅ Concluída |
| Sistema de Créditos | Planos Free/Starter/Pro/Unlimited | `user_scan_credits` table | ✅ Concluída |
| Checkout Stripe | Upgrade de plano | `scan-create-checkout` | ✅ Concluída |
| Portal do Cliente | Gestão de assinatura | `scan-customer-portal` | ✅ Concluída |

---

### 8. Marketplace

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Plataforma de descoberta de profissionais e unidades |
| **Perfis de Acesso** | Todos (autenticados) |
| **Rota Base** | `/marketplace` |
| **Status** | ⚠️ Parcial |

#### Funcionalidades

| Funcionalidade | Descrição | Rota/Componente | Status |
|----------------|-----------|-----------------|--------|
| Home Marketplace | Visão geral | `/marketplace` | ✅ Concluída |
| Profissionais | Diretório de especialistas | `/marketplace/professionals` | ✅ Concluída |
| Unidades | Mapa de clínicas | `/marketplace/units` | ✅ Concluída |
| Leads | Gestão de oportunidades | `/marketplace/leads` | ✅ Concluída |
| Agenda | Disponibilidade | `/marketplace/schedule` | ✅ Concluída |
| Avaliações | Reviews de pacientes | `/marketplace/reviews` | ✅ Concluída |
| Campanhas | Promoções ativas | `/marketplace/campaigns` | ✅ Concluída |
| Dashboard | Métricas do marketplace | `/marketplace/dashboard` | ✅ Concluída |
| Descoberta | Busca avançada | `/marketplace/discovery` | ✅ Concluída |

---

### 9. Administração Global

| Atributo | Valor |
|----------|-------|
| **Objetivo** | Gestão centralizada do ecossistema NeoHub |
| **Perfis de Acesso** | administrador |
| **Rota Base** | `/admin-*`, `/admin/*` |
| **Status** | ✅ Ativo |

#### Funcionalidades

| Funcionalidade | Descrição | Rota | Status |
|----------------|-----------|------|--------|
| Dashboard Admin | Visão executiva | `/admin-dashboard` | ✅ Concluída |
| Dashboard Métricas | KPIs de clínicas | `/dashboard` | ✅ Concluída |
| Gestão de Alunos | CRUD de licenciados | `/alunos` | ✅ Concluída |
| Comparativo Clínicas | Benchmarking | `/comparison` | ✅ Concluída |
| Regularização | Pendências financeiras | `/regularization` | ✅ Concluída |
| Marketing | Central de campanhas | `/marketing` | ✅ Concluída |
| Loja | Gestão de produtos | `/store` | ✅ Concluída |
| Financeiro | Relatórios financeiros | `/financial` | ✅ Concluída |
| Mentoria | Gestão de mentorias | `/mentorship` | ✅ Concluída |
| Sistemas | Integrações externas | `/systems` | ✅ Concluída |
| Painel Admin | Configurações gerais | `/admin` | ✅ Concluída |
| Matriz de Acesso | Visualização RBAC | `/access-matrix` | ✅ Concluída |
| Certificados | Gestão de certificados | `/certificates` | ✅ Concluída |
| Pagamentos Licença | Controle financeiro | `/license-payments` | ✅ Concluída |
| Monitoramento | Usuários online/atividade | `/monitoring` | ✅ Concluída |
| Métricas Sistema | Saúde da plataforma | `/system-metrics` | ✅ Concluída |
| System Sentinel | Alertas automáticos | `/admin/sentinel` | ✅ Concluída |
| Anúncios | CRUD de announcements | `/admin/announcements` | ✅ Concluída |
| Banners | Carrossel da home | `/admin/banners` | ✅ Concluída |
| Module Overrides | Permissões manuais | `/admin/module-overrides` | ✅ Concluída |
| Indicações | Gestão de referrals | `/admin/referrals` | ✅ Concluída |
| Event Logs | Auditoria de eventos | `/admin/event-logs` | ✅ Concluída |
| Code Assistant | Chat com IA dev | `/admin/code-assistant` | ✅ Concluída |
| Agenda Cirurgias | Visão admin | `/admin/surgery-schedule` | ✅ Concluída |
| Relatórios Semanais | Envio de reports | `/weekly-reports` | ✅ Concluída |
| Sala Técnica | Suporte técnico | `/sala-tecnica` | ✅ Concluída |
| Resultados Consolidados | Métricas globais | `/consolidated-results` | ✅ Concluída |

---

## ⚡ Edge Functions (APIs)

### Autenticação e Usuários

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `admin-reset-password` | `/functions/v1/admin-reset-password` | ✅ | Reset de senha por admin |
| `request-password-reset` | `/functions/v1/request-password-reset` | ❌ | Solicita email de reset |
| `reset-password` | `/functions/v1/reset-password` | ❌ | Executa reset via token |
| `emergency-reset` | `/functions/v1/emergency-reset` | ❌ | Reset emergencial |
| `create-test-user` | `/functions/v1/create-test-user` | ✅ | Cria usuário de teste |
| `setup-neohub-test-users` | `/functions/v1/setup-neohub-test-users` | ✅ | Setup users de QA |
| `setup-mobile-test-users` | `/functions/v1/setup-mobile-test-users` | ✅ | Setup users mobile |

### Academy / IBRAMEC

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `add-single-student` | `/functions/v1/add-single-student` | ✅ | Adiciona aluno individual |
| `bulk-enroll-students` | `/functions/v1/bulk-enroll-students` | ✅ | Matrícula em lote |
| `bulk-reset-passwords` | `/functions/v1/bulk-reset-passwords` | ✅ | Reset de senhas em lote |
| `import-ibramec-students` | `/functions/v1/import-ibramec-students` | ✅ | Importação via Excel |
| `send-student-credentials` | `/functions/v1/send-student-credentials` | ✅ | Envia credenciais por email |
| `analyze-survey-insights` | `/functions/v1/analyze-survey-insights` | ✅ | IA analisa Pesquisa Dia 1 |
| `analyze-day2-survey-insights` | `/functions/v1/analyze-day2-survey-insights` | ✅ | IA analisa Pesquisa Dia 2 |
| `send-day3-survey-notification` | `/functions/v1/send-day3-survey-notification` | ✅ | Notifica pesquisa final |
| `notify-survey-completed` | `/functions/v1/notify-survey-completed` | ✅ | Email com respostas |
| `face-search` | `/functions/v1/face-search` | ✅ | Busca por selfie nas galerias |

### Clínica / Pacientes

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `create-patient-account` | `/functions/v1/create-patient-account` | ✅ | Cria conta de paciente |
| `create-test-patient` | `/functions/v1/create-test-patient` | ✅ | Paciente de teste |
| `import-patients` | `/functions/v1/import-patients` | ✅ | Importação em lote |
| `notify-patient-called` | `/functions/v1/notify-patient-called` | ✅ | WhatsApp sala de espera |
| `check-patient-orientations` | `/functions/v1/check-patient-orientations` | ✅ | Verifica tarefas atrasadas |
| `send-appointment-notifications` | `/functions/v1/send-appointment-notifications` | ✅ | Lembretes de consulta |

### CRM / Leads

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `receive-lead` | `/functions/v1/receive-lead` | ❌ | Webhook de captação |
| `notify-lead-arrival` | `/functions/v1/notify-lead-arrival` | ✅ | Alerta novo lead |
| `notify-hotlead-event` | `/functions/v1/notify-hotlead-event` | ✅ | Eventos de lead quente |

### Indicações / Referral

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `notify-referral` | `/functions/v1/notify-referral` | ✅ | Email de nova indicação |
| `send-referral-notification` | `/functions/v1/send-referral-notification` | ✅ | Notificação ao indicador |
| `create-referral-checkout` | `/functions/v1/create-referral-checkout` | ✅ | Checkout Stripe |
| `notify-pix-request` | `/functions/v1/notify-pix-request` | ✅ | Solicitação de PIX |

### NeoHairScan

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `hair-scan-analysis` | `/functions/v1/hair-scan-analysis` | ✅ | IA gera simulações |
| `scan-create-checkout` | `/functions/v1/scan-create-checkout` | ✅ | Checkout de plano |
| `scan-customer-portal` | `/functions/v1/scan-customer-portal` | ✅ | Portal Stripe |
| `scan-check-subscription` | `/functions/v1/scan-check-subscription` | ✅ | Valida assinatura |

### IPROMED

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `create-ipromed-users` | `/functions/v1/create-ipromed-users` | ✅ | Cria usuários jurídicos |
| `ai-legal-document` | `/functions/v1/ai-legal-document` | ✅ | IA gera documentos |
| `legal-ai-insights` | `/functions/v1/legal-ai-insights` | ✅ | IA analisa casos |

### Monitoramento / Alertas

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `sentinel-check` | `/functions/v1/sentinel-check` | ✅ | Verificação de saúde |
| `sentinel-whatsapp` | `/functions/v1/sentinel-whatsapp` | ✅ | Alertas via WhatsApp |
| `check-metric-alerts` | `/functions/v1/check-metric-alerts` | ✅ | Verifica thresholds |
| `check-inactive-users` | `/functions/v1/check-inactive-users` | ✅ | Detecta inatividade |
| `notify-error-alert` | `/functions/v1/notify-error-alert` | ✅ | Alerta de erros |
| `notify-login` | `/functions/v1/notify-login` | ✅ | Log de login |
| `notify-user-login` | `/functions/v1/notify-user-login` | ✅ | Notifica login |

### Relatórios / Analytics

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `send-weekly-reports` | `/functions/v1/send-weekly-reports` | ✅ | Email semanal |
| `analyze-daily-metrics` | `/functions/v1/analyze-daily-metrics` | ✅ | IA analisa métricas |
| `import-daily-metrics` | `/functions/v1/import-daily-metrics` | ✅ | Importação de dados |
| `import-avivar-data` | `/functions/v1/import-avivar-data` | ✅ | Dados Avivar |
| `import-staff-team` | `/functions/v1/import-staff-team` | ✅ | Importa equipe |

### IA / Chat

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `code-assistant-chat` | `/functions/v1/code-assistant-chat` | ✅ | Chat dev com IA |
| `jon-jobs-chat` | `/functions/v1/jon-jobs-chat` | ✅ | Assistente Jon Jobs |

---

## 🗄️ Banco de Dados (Visão Funcional)

### Domínio: Usuários e Autenticação

| Tabela | Descrição |
|--------|-----------|
| `neohub_users` | Usuários base do sistema |
| `neohub_user_profiles` | Perfis atribuídos (ENUM) |
| `neohub_module_permissions` | Matriz perfil x módulo |
| `neohub_user_module_overrides` | Overrides manuais |
| `user_roles` | Roles legados (admin/user) |
| `profiles` | Perfis básicos (legado) |
| `staff_profiles` | Perfis de equipe clínica |
| `staff_roles` | Definição de cargos |
| `staff_user_roles` | Atribuição cargo-usuário |

### Domínio: Academy / IBRAMEC

| Tabela | Descrição |
|--------|-----------|
| `courses` | Cursos disponíveis |
| `course_classes` | Turmas de cursos |
| `class_enrollments` | Matrículas |
| `class_schedule` | Cronograma por dia |
| `class_schedule_items` | Atividades do cronograma |
| `course_galleries` | Galerias de fotos |
| `course_gallery_photos` | Fotos individuais |
| `exams` | Provas cadastradas |
| `exam_questions` | Questões das provas |
| `exam_attempts` | Tentativas de prova |
| `exam_answers` | Respostas dadas |
| `day1_satisfaction_surveys` | Pesquisa Dia 1 |
| `day2_satisfaction_surveys` | Pesquisa Dia 2 |
| `day3_satisfaction_surveys` | Pesquisa Dia 3 |
| `student_referrals` | Indicações de alunos |
| `community_messages` | Chat entre alunos |
| `contact_requests` | Solicitações de contato |

### Domínio: Clínica / Pacientes

| Tabela | Descrição |
|--------|-----------|
| `clinic_patients` | Pacientes cadastrados |
| `clinic_sales` | Vendas/contratos |
| `clinic_surgeries` | Cirurgias agendadas |
| `clinics` | Clínicas/unidades |
| `daily_metrics` | Métricas diárias |

### Domínio: CRM / Leads

| Tabela | Descrição |
|--------|-----------|
| `leads` | Leads captados |
| `crm_conversations` | Conversas de atendimento |
| `crm_messages` | Mensagens de chat |

### Domínio: IPROMED

| Tabela | Descrição |
|--------|-----------|
| `ipromed_legal_clients` | Clientes jurídicos |
| `ipromed_contracts` | Contratos legais |
| `ipromed_legal_cases` | Processos/casos |
| `ipromed_deliverables` | Entregáveis da jornada |

### Domínio: NeoHairScan

| Tabela | Descrição |
|--------|-----------|
| `user_scan_credits` | Créditos por usuário |
| `scan_credit_transactions` | Histórico de consumo |

### Domínio: Sistema

| Tabela | Descrição |
|--------|-----------|
| `announcements` | Anúncios do sistema |
| `carousel_banners` | Banners da home |
| `banner_clicks` | Cliques em banners |
| `achievements` | Conquistas/badges |
| `metric_alerts` | Configuração de alertas |
| `alert_history` | Histórico de alertas |
| `admin_settings` | Configurações globais |
| `admin_audit_log` | Log de ações admin |
| `event_checklists` | Checklists de eventos |
| `event_checklist_items` | Itens dos checklists |
| `shared_dashboard_links` | Links públicos |
| `feature_flags` | Feature toggles |
| `mobile_blocked_modules` | Bloqueios mobile |

### Views Relevantes

| View | Descrição |
|------|-----------|
| `gallery_stats` | Métricas de galerias |
| `gallery_photo_stats` | Stats por foto |
| `exam_questions_student` | Questões sem gabarito |

### RPCs Principais

| RPC | Descrição |
|-----|-----------|
| `get_user_context()` | Contexto completo do usuário |
| `can_access_module()` | Verifica permissão de módulo |
| `can_access_module_with_action()` | Permissão com ação (read/write/delete) |
| `is_neohub_admin()` | Verifica se é admin |
| `consume_scan_credit()` | Consome crédito de scan |
| `check_and_reset_daily_credits()` | Reset diário de créditos |
| `validate_exam_answer()` | Valida resposta de prova |
| `get_exam_results_with_answers()` | Resultados completos |
| `calculate_day2_scores()` | Trigger de scoring |

---

## 🔌 Integrações Externas

### E-mail (Resend)

| Integração | Domínio | Uso |
|------------|---------|-----|
| Credenciais de acesso | ibramec.com | Envio para alunos |
| Notificações sistema | neohub.com.br | Alertas e relatórios |
| IPROMED | ipromed.com.br | Comunicação jurídica |

### WhatsApp (Uazapi)

| Integração | Uso |
|------------|-----|
| Sala de Espera | Chamada de pacientes |
| Alertas Sentinel | Notificações críticas |
| Lembretes NeoCare | Orientações pré/pós-op |

### Pagamentos (Stripe)

| Integração | Uso |
|------------|-----|
| Checkout Sessions | Upgrade de planos NeoHairScan |
| Customer Portal | Gestão de assinatura |
| Webhooks | Confirmação de pagamento |

### IA (Lovable AI Gateway)

| Modelo | Uso |
|--------|-----|
| google/gemini-2.5-flash-image | Edição de imagens NeoHairScan |
| google/gemini-2.5-flash-lite | Comparação facial |
| google/gemini-2.5-flash | Análise de pesquisas |
| google/gemini-2.5-pro | Geração de documentos legais |

---

## 🔒 Funcionalidades Sensíveis (Health / LGPD)

| Módulo | Dados Sensíveis | Proteção |
|--------|-----------------|----------|
| NeoCare | Histórico médico, exames | RLS por paciente |
| NeoTeam | Prontuário, evolução clínica | RLS por colaborador/médico |
| clinic_patients | CPF, dados pessoais | RLS + views filtradas |
| clinic_surgeries | Procedimentos cirúrgicos | RLS por branch |
| patient-documents | Arquivos de exames | Bucket privado |
| ipromed-documents | Contratos jurídicos | Bucket privado |

---

## 📱 Mobile (Capacitor)

| Configuração | Valor |
|--------------|-------|
| App ID | `app.lovable.d75807d51df7446daac336166617be60` |
| App Name | `transplant-insight-hub` |
| Plataformas | iOS, Android |
| Plugins | Push Notifications, App, Splash Screen |
| Módulos Bloqueados | neocare, clinic, prontuario, marketplace, neoteam |
| Wrapper | `MobileAppWrapper` + `MobileGuard` |

---

## 📁 Hooks Personalizados

| Hook | Descrição |
|------|-----------|
| `useUnifiedAuth` | Contexto de autenticação unificado |
| `useAccessMatrix` | Matriz de permissões |
| `useAchievements` | Sistema de conquistas |
| `useAnnouncements` | Anúncios do sistema |
| `useBanners` | Carrossel de banners |
| `useClinicMetrics` | Métricas de clínica |
| `useCrmConversations` | Conversas CRM |
| `useCrmMetrics` | Métricas CRM |
| `useCrmTasks` | Tarefas CRM |
| `useDailyMetrics` | Métricas diárias |
| `useDeepLinks` | Deep links mobile |
| `useEventLogger` | Log de eventos |
| `useEventLogs` | Consulta de logs |
| `useExams` | Sistema de provas |
| `useFeatureFlags` | Feature toggles |
| `useFirstSteps` | Onboarding |
| `useLeads` | Gestão de leads |
| `useMaterials` | Central de materiais |
| `useMetricAlerts` | Alertas de métricas |
| `useMetricHistory` | Histórico de métricas |
| `useMobileEnvironment` | Detecção mobile |
| `useModuleOverrides` | Overrides de módulo |
| `useModulePermissions` | Permissões de módulo |
| `useOnboarding` | Fluxo de onboarding |
| `usePermissions` | Permissões gerais |
| `usePersistedAIInsights` | Cache de insights IA |
| `usePushNotifications` | Push notifications |
| `useRealtimeNotifications` | Notificações realtime |
| `useSalaTecnica` | Suporte técnico |
| `useSales` | Gestão de vendas |
| `useSurgerySchedule` | Agenda cirúrgica |
| `useSystemMetrics` | Métricas do sistema |
| `useSystemSentinel` | Monitoramento |
| `useTabFromUrl` | Sync tabs com URL |
| `useUniversity` | Sistema educacional |
| `useUsageStats` | Estatísticas de uso |
| `useUserPresence` | Presença online |
| `useVideos` | Gestão de vídeos |

---

## 📜 Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 2.0.0 | 2026-01-28 | Roadmap técnico completo com 7 portais, 52 edge functions e arquitetura detalhada |
| 1.2.0 | 2026-01-27 | Links públicos para dashboards, consolidação de rotas |
| 1.1.0 | 2026-01-26 | Campanha de testes, preparação mobile, auditoria de segurança |
| 1.0.0 | 2026-01-24 | Criação inicial do roadmap e sistema de documentação |

---

## 🔗 Links Úteis

- [POPs (Procedimentos Operacionais)](/docs/pops/)
- [Relatórios de QA](/docs/qa-reports/)
- [Guia de Publicação Mobile](/docs/MOBILE-PUBLISHING-GUIDE.md)
- [Checklist de QA](/docs/QA-CHECKLIST.md)
- [Relatório de Cobertura](/docs/COVERAGE-REPORT.md)
- [Contexto IPROMED](/docs/IPROMED-CONTEXT.md)
