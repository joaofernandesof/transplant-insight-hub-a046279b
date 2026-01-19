# 🏥 Neo Folic - Sistema de Gestão para Clínicas de Transplante Capilar

<p align="center">
  <img src="src/assets/logo-byneofolic.png" alt="Neo Folic Logo" width="200"/>
</p>

## 📋 Visão Geral

Sistema completo de gestão e dashboard para clínicas de transplante capilar, focado no **funil de vendas** (comercial e marketing). Atua como um "mentor digital", fornecendo insights automáticos e ações corretivas baseados no desempenho dos indicadores.

**URL de Produção**: https://transplant-insight-hub.lovable.app

---

## 🏗️ Arquitetura do Sistema

O projeto é dividido em dois portais principais:

### 1. Portal do Licenciado (`/`)
Dashboard principal para gestão de clínicas licenciadas Neo Folic.

### 2. Portal Médico (`/portal`)
Sistema clínico completo para operações médicas (pacientes, médicos, agendamentos).

---

## 🚀 Funcionalidades Principais

### 📊 Dashboard & Métricas
- **Indicadores Semanais**: Visualização em tabela horizontal com etapas do funil
- **Metas Mensais**: Acompanhamento de objetivos por período
- **Comparativo de Clínicas**: Ranking e benchmarking entre unidades
- **Insights Automáticos**: Recomendações baseadas em performance

### 🔥 HotLeads - Gestão de Leads
- **Funil de Vendas**: 5 etapas (Lead Novo → Captado → Agendado → Vendido → Descartado)
- **Visualização Kanban/Lista**: Alternância de modos com drag-and-drop
- **Prioridade por Estado**: 1 hora de exclusividade para licenciados do mesmo estado
- **Dashboard Analítico**: Procedimentos vendidos, distribuição por cidade, conversão
- **Comparativo de Licenciados**: Rankings exclusivos para administradores

### 🏥 Agenda de Cirurgias
- **Calendário Visual**: Visualização mensal/semanal
- **Checklist de Procedimentos**: D0, D1, D2, D7
- **Controle Financeiro**: Valores, upgrades, upsells

### 💰 Vendas
- **Registro de Vendas**: Paciente, procedimento, valores
- **KPIs em Tempo Real**: Faturamento, ticket médio, conversão
- **Importação via Excel**: Upload em massa

### 🎓 Universidade Neo Folic
- **Cursos**: Módulos com aulas em vídeo
- **Quizzes**: Avaliações por lição
- **Certificados**: Geração automática em PDF
- **Progresso**: Tracking individual

### 🏆 Gamificação
- **Conquistas**: Sistema de badges e pontos
- **Leaderboard**: Ranking de licenciados
- **Timeline**: Histórico de conquistas

### 📚 Materiais de Apoio
- **Biblioteca Digital**: PDFs, vídeos, imagens
- **Categorização**: Por tipo e área
- **Download Direto**: Acesso rápido

### 🔔 Notificações
- **Sistema em Tempo Real**: Via Supabase Realtime
- **Notificações Rich**: Suporte a HTML, imagens e vídeos
- **Histórico**: Marcação de lidas/não lidas

### 👥 Programa de Indicação
- **Landing Page Personalizada**: Por código do licenciado
- **Tracking de Leads**: Status e conversões
- **Comissões**: Cálculo automático

---

## 🔐 Segurança (Padrões Fintech)

### Autenticação
- Login com email/senha via Supabase Auth
- Sessões seguras com tokens JWT
- Auto-confirm de email para agilidade

### Proteção de Dados
- Row Level Security (RLS) em todas as tabelas
- Dados de leads ocultos até captura
- Auditoria de acessos

### API Security
- Edge Functions com CORS configurado
- Rate limiting por endpoint
- Validação de payloads

---

## 📡 API REST

Documentação completa disponível em `/api-docs`.

### Endpoints Principais

#### Leads
```bash
POST /functions/v1/receive-lead
Content-Type: application/json

{
  "name": "João Silva",
  "phone": "11999999999",
  "email": "joao@email.com",
  "state": "SP",
  "city": "São Paulo",
  "procedure_interest": "Transplante Capilar",
  "source": "Meta Ads"
}
```

#### Webhooks
```bash
POST /functions/v1/notify-hotlead-event
Content-Type: application/json

{
  "event_type": "lead_claimed",
  "lead_name": "João Silva",
  "licensee_name": "Dr. Pedro"
}
```

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component Library
- **Recharts** - Charts & Graphs
- **React Router DOM** - Routing
- **TanStack Query** - Server State
- **React Hook Form + Zod** - Forms & Validation

### Backend (Lovable Cloud)
- **Supabase** - Database & Auth
- **PostgreSQL** - Relational Database
- **Edge Functions** - Serverless (Deno)
- **Realtime** - WebSocket subscriptions
- **Storage** - File uploads

### Mobile (Capacitor)
- **Android** - Build nativo
- **iOS** - Build nativo

---

## 📁 Estrutura de Pastas

```
src/
├── assets/              # Imagens e arquivos estáticos
├── components/
│   ├── hotleads/        # Componentes do módulo HotLeads
│   ├── sales/           # Componentes de vendas
│   ├── surgery/         # Componentes de cirurgias
│   └── ui/              # shadcn/ui components
├── contexts/            # React Contexts (Auth, Data)
├── hooks/               # Custom hooks
├── integrations/        # Supabase client & types
├── pages/               # Páginas principais
├── portal/              # Portal Médico (separado)
│   ├── components/
│   ├── contexts/
│   └── pages/
└── utils/               # Funções utilitárias

supabase/
└── functions/           # Edge Functions
    ├── receive-lead/
    ├── notify-hotlead-event/
    ├── jon-jobs-chat/
    └── ...
```

---

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuários/licenciados |
| `leads` | Leads do funil de vendas |
| `sales` | Registro de vendas |
| `surgery_schedule` | Agenda de cirurgias |
| `courses` | Cursos da universidade |
| `course_modules` | Módulos dos cursos |
| `module_lessons` | Aulas dos módulos |
| `achievements` | Conquistas disponíveis |
| `user_achievements` | Conquistas desbloqueadas |
| `notifications` | Notificações do sistema |
| `materials` | Materiais de apoio |

### Portal Médico

| Tabela | Descrição |
|--------|-----------|
| `portal_users` | Usuários do portal |
| `portal_patients` | Pacientes |
| `portal_doctors` | Médicos |
| `portal_appointments` | Agendamentos |
| `portal_medical_records` | Prontuários |
| `portal_inventory_items` | Estoque |

---

## 👥 Perfis de Acesso

### Portal do Licenciado
| Perfil | Permissões |
|--------|------------|
| **Admin** | Acesso total, gestão de licenciados |
| **Licenciado** | Dashboard próprio, leads do seu estado |

### Portal Médico
| Perfil | Dashboard |
|--------|-----------|
| **Admin** | Visão geral, configurações |
| **Médico** | Agenda, prontuários |
| **Recepção** | Agendamentos, check-in |
| **Financeiro** | Faturamento, pagamentos |
| **Estoque** | Inventário, movimentações |
| **Paciente** | Consultas, documentos |

---

## 🚀 Como Executar

### Requisitos
- Node.js 18+
- npm ou bun

### Instalação

```bash
# Clone o repositório
git clone <URL_DO_REPOSITÓRIO>

# Instale as dependências
npm install

# Execute em desenvolvimento
npm run dev
```

### Build para Produção

```bash
npm run build
```

### Mobile (Capacitor)

```bash
# Android
npx cap add android
npx cap sync
npx cap open android

# iOS
npx cap add ios
npx cap sync
npx cap open ios
```

---

## 📊 Métricas do Funil

O sistema monitora as seguintes etapas:

1. **Planejamento** - Metas definidas
2. **Tráfego** - Investimento em ads
3. **Landing Page** - Taxa de conversão
4. **Leads** - Volume captado
5. **Atendimento** - Tempo de resposta
6. **Agendamento** - Taxa de scheduling
7. **Consulta** - Comparecimento
8. **Vendas** - Conversão final
9. **Financeiro** - Faturamento
10. **Gestão** - Indicadores gerais

---

## 🤖 Assistente Virtual

**Jon Jobs** - Assistente IA integrado para suporte aos licenciados.
- Acesso via botão flutuante
- Respostas contextualizadas
- Histórico de conversas

---

## 📈 Roadmap

- [ ] Integração WhatsApp Business API
- [ ] Dashboard de ROI por campanha
- [ ] Módulo de CRM avançado
- [ ] App mobile nativo (React Native)
- [ ] Integração com sistemas de prontuário

---

## 📄 Licença

Projeto proprietário - Neo Folic © 2024-2026

---

## 🤝 Suporte

Para suporte técnico, entre em contato através do sistema de chat integrado ou abra uma issue neste repositório.
