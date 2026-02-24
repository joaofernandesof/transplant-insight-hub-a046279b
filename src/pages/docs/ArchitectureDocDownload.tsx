import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, FileText, ChevronRight, ChevronLeft, 
  Shield, Users, Layout, Database, Code, Folder,
  ArrowRight, CheckCircle, AlertTriangle, Lock,
  Home, Settings, Layers, GitBranch, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';

// ====================================
// FONTE ÚNICA DE VERDADE - ARQUITETURA COMPLETA
// ====================================

const PORTALS = [
  { id: 'admin', name: 'Admin', route: '/admin', color: 'bg-red-500', desc: 'Administração central do sistema', modules: ['dashboard', 'licensees', 'metrics', 'settings', 'sentinel'] },
  { id: 'neoteam', name: 'NeoTeam', route: '/neoteam', color: 'bg-blue-500', desc: 'Gestão de equipe e colaboradores', modules: ['staff', 'schedules', 'reports', 'performance'] },
  { id: 'neocare', name: 'NeoCare', route: '/portal', color: 'bg-emerald-500', desc: 'Portal do paciente', modules: ['appointments', 'exams', 'orientations', 'history'] },
  { id: 'academy', name: 'Academy', route: '/academy', color: 'bg-purple-500', desc: 'Plataforma educacional e cursos', modules: ['courses', 'classes', 'certificates', 'exams'] },
  { id: 'neolicense', name: 'NeoLicense', route: '/neolicense', color: 'bg-amber-500', desc: 'Portal do licenciado', modules: ['metrics', 'marketing', 'financial', 'university'] },
  { id: 'avivar', name: 'Avivar', route: '/avivar', color: 'bg-pink-500', desc: 'Marketing, CRM e automação com IA', modules: ['leads', 'crm', 'campaigns', 'inbox', 'cadences', 'agenda'] },
  { id: 'ipromed', name: 'CPG Advocacia', route: '/cpg', color: 'bg-indigo-500', desc: 'Portal jurídico e compliance', modules: ['clients', 'contracts', 'exams', 'journey', 'legal-hub'] },
  { id: 'vision', name: 'Vision', route: '/vision', color: 'bg-cyan-500', desc: 'Análise capilar com IA', modules: ['scanner', 'reports', 'history'] },
  { id: 'neopay', name: 'NeoPay', route: '/neopay', color: 'bg-green-500', desc: 'Gateway de pagamentos', modules: ['transactions', 'invoices', 'subscriptions'] },
  { id: 'neohair', name: 'NeoHair', route: '/neohair', color: 'bg-orange-500', desc: 'Tratamento capilar', modules: ['protocols', 'tracking', 'results'] },
];

const PROFILES = [
  { id: 'administrador', name: 'Administrador', access: ['admin', 'neoteam', 'neocare', 'academy', 'neolicense', 'avivar', 'ipromed', 'vision', 'neopay', 'neohair'], desc: 'Acesso total ao sistema. Bypass automático em todas verificações de permissão.' },
  { id: 'colaborador', name: 'Colaborador', access: ['neoteam', 'neocare'], desc: 'Funcionários da clínica. Acesso a gestão de equipe e pacientes.' },
  { id: 'medico', name: 'Médico', access: ['neoteam'], desc: 'Profissionais médicos. Acesso a agenda e protocolos.' },
  { id: 'paciente', name: 'Paciente', access: ['neocare'], desc: 'Pacientes da clínica. Portal de acompanhamento.' },
  { id: 'aluno', name: 'Aluno', access: ['academy'], desc: 'Estudantes matriculados. Acesso a cursos e certificados.' },
  { id: 'licenciado', name: 'Licenciado', access: ['neolicense', 'avivar', 'neoteam'], desc: 'Donos de clínicas licenciadas. Dashboard e métricas.' },
  { id: 'cliente_avivar', name: 'Cliente Avivar', access: ['avivar'], desc: 'Clientes do CRM Avivar. Gestão de leads e marketing.' },
  { id: 'ipromed', name: 'IPROMED', access: ['ipromed'], desc: 'Advogados e consultores jurídicos.' },
];

const FOLDER_STRUCTURE = [
  { path: 'src/', type: 'folder', desc: 'Código fonte principal' },
  { path: '├── components/', type: 'folder', desc: 'Componentes compartilhados React' },
  { path: '│   ├── ui/', type: 'folder', desc: 'shadcn/ui - NÃO MODIFICAR LÓGICA INTERNA' },
  { path: '│   ├── guards/', type: 'folder', desc: 'Guards de proteção de rotas' },
  { path: '│   ├── admin/', type: 'folder', desc: 'Componentes do admin' },
  { path: '│   ├── avivar/', type: 'folder', desc: 'Componentes do Avivar' },
  { path: '│   └── shared/', type: 'folder', desc: 'Componentes reutilizáveis' },
  { path: '├── contexts/', type: 'folder', desc: 'Contextos React globais' },
  { path: '│   ├── UnifiedAuthContext.tsx', type: 'file', desc: '⭐ AUTENTICAÇÃO CENTRAL - CRÍTICO', critical: true },
  { path: '│   └── AuthContext.tsx', type: 'file', desc: 'Wrapper de compatibilidade legada' },
  { path: '├── hooks/', type: 'folder', desc: 'Custom hooks compartilhados' },
  { path: '│   ├── useModulePermissions.ts', type: 'file', desc: 'Permissões de módulos RBAC' },
  { path: '│   ├── useFeatureFlags.ts', type: 'file', desc: 'Feature flags do sistema' },
  { path: '│   └── useTabFromUrl.ts', type: 'file', desc: 'Sincronização de tabs com URL' },
  { path: '├── pages/', type: 'folder', desc: 'Páginas e portais do sistema' },
  { path: '│   ├── admin/', type: 'folder', desc: 'Portal Admin' },
  { path: '│   ├── avivar/', type: 'folder', desc: 'Portal Avivar (CRM/Marketing)' },
  { path: '│   ├── ipromed/', type: 'folder', desc: 'Portal IPROMED (Jurídico)' },
  { path: '│   ├── vision/', type: 'folder', desc: 'Portal Vision (Scanner IA)' },
  { path: '│   ├── neohair/', type: 'folder', desc: 'Portal NeoHair' },
  { path: '│   ├── neopay/', type: 'folder', desc: 'Portal NeoPay' },
  { path: '│   ├── neoteam/', type: 'folder', desc: 'Portal NeoTeam' },
  { path: '│   └── public/', type: 'folder', desc: 'Páginas públicas' },
  { path: '├── neohub/', type: 'folder', desc: 'Core NeoHub - Núcleo do sistema' },
  { path: '│   ├── pages/neocare/', type: 'folder', desc: 'Portal NeoCare' },
  { path: '│   ├── pages/neoteam/', type: 'folder', desc: 'Portal NeoTeam (alternativo)' },
  { path: '│   └── contexts/', type: 'folder', desc: 'Contextos internos do NeoHub' },
  { path: '├── integrations/', type: 'folder', desc: 'Integrações externas' },
  { path: '│   └── supabase/', type: 'folder', desc: 'Cliente Supabase - AUTO-GERADO', critical: true },
  { path: '├── marketplace/', type: 'folder', desc: 'Componentes de marketplace' },
  { path: '└── App.tsx', type: 'file', desc: '⭐ ROTEAMENTO PRINCIPAL - CRÍTICO', critical: true },
];

const GUARDS = [
  { name: 'ProtectedRoute', desc: 'Verifica apenas se usuário está autenticado', use: 'Rotas que precisam de login básico', file: 'RouteGuard.tsx' },
  { name: 'RouteGuard', desc: 'Proteção com verificação de permissões', use: 'Rotas com regras específicas de acesso', file: 'RouteGuard.tsx' },
  { name: 'ProfileGuard', desc: 'Exige que usuário tenha perfil ativo específico', use: 'Áreas exclusivas de determinado perfil', file: 'UnifiedGuards.tsx' },
  { name: 'PortalGuard', desc: 'Proteção de entrada de portal inteiro', use: 'Wrapping de portais completos', file: 'UnifiedGuards.tsx' },
  { name: 'AdminRoute', desc: 'Apenas administradores podem acessar', use: 'Painel administrativo', file: 'UnifiedGuards.tsx' },
  { name: 'ComponentGuard', desc: 'Proteção granular de componentes', use: 'Botões, seções ou elementos sensíveis', file: 'ComponentGuard.tsx' },
  { name: 'ModuleGuard', desc: 'Verifica permissão de módulo específico', use: 'Módulos com controle RBAC', file: 'ModuleGuard.tsx' },
  { name: 'MobileGuard', desc: 'Bloqueia módulos em ambiente mobile nativo', use: 'Proteção de funcionalidades web-only', file: 'MobileGuard.tsx' },
];

const DATABASE_TABLES = [
  { table: 'neohub_users', desc: 'Identidade central de usuários', rls: true, key: 'user_id (auth.uid)' },
  { table: 'neohub_user_profiles', desc: 'Perfis atribuídos (1:N com users)', rls: true, key: 'neohub_user_id' },
  { table: 'permission_modules', desc: 'Módulos disponíveis no sistema', rls: false, key: 'code' },
  { table: 'permission_profile_matrix', desc: 'Matriz perfil→módulo', rls: false, key: 'profile + module_code' },
  { table: 'user_module_overrides', desc: 'Exceções de permissão por usuário', rls: true, key: 'user_id + module_code' },
  { table: 'clinics', desc: 'Clínicas licenciadas', rls: true, key: 'user_id (owner)' },
  { table: 'leads', desc: 'Leads do CRM', rls: true, key: 'user_id' },
  { table: 'avivar_appointments', desc: 'Agendamentos Avivar', rls: true, key: 'user_id' },
  { table: 'class_enrollments', desc: 'Matrículas Academy', rls: true, key: 'user_id' },
  { table: 'daily_metrics', desc: 'Métricas diárias das clínicas', rls: true, key: 'clinic_id' },
  { table: 'feature_flags', desc: 'Feature flags do sistema', rls: false, key: 'key' },
];

const EDGE_FUNCTIONS = [
  { name: 'avivar-ai-agent', desc: 'Agente IA para atendimento automático' },
  { name: 'analyze-daily-metrics', desc: 'Análise IA de métricas diárias' },
  { name: 'hair-scan-analysis', desc: 'Análise IA de imagens capilares' },
  { name: 'sentinel-check', desc: 'Monitoramento de saúde do sistema' },
  { name: 'create-licensees', desc: 'Criação automatizada de licenciados' },
  { name: 'send-weekly-reports', desc: 'Envio de relatórios semanais' },
  { name: 'notify-*', desc: 'Família de funções de notificação' },
  { name: 'import-*', desc: 'Família de funções de importação' },
];

const CHECKLIST_NEW_PORTAL = [
  '1. Criar diretório em src/pages/meuportal/',
  '2. Criar MeuPortalApp.tsx com Routes internas',
  '3. Criar MeuPortalLayout.tsx com sidebar/header',
  '4. Adicionar rota lazy em src/App.tsx',
  '5. Adicionar tipo ao Portal em UnifiedAuthContext.tsx',
  '6. Mapear perfis em PROFILE_PORTAL_MAP',
  '7. Envolver com PortalGuard para proteção',
  '8. Adicionar card no grid da LandingPage',
  '9. Criar tabelas com RLS no banco',
  '10. Adicionar à documentação (este arquivo)',
];

const CHECKLIST_NEW_MODULE = [
  '1. Criar diretório modules/meumodulo/ no portal',
  '2. Criar página principal e componentes',
  '3. Adicionar Route no PortalApp.tsx pai',
  '4. Adicionar item no menu/sidebar do portal',
  '5. Criar hooks de dados (useQuery) se necessário',
  '6. Adicionar guards de permissão se sensível',
  '7. Registrar módulo em permission_modules (banco)',
  '8. Configurar matriz de acesso por perfil',
];

const DANGER_ZONES = [
  { file: 'src/integrations/supabase/client.ts', reason: 'Auto-gerado pelo Supabase. NUNCA EDITAR.' },
  { file: 'src/integrations/supabase/types.ts', reason: 'Tipos do banco. Gerado automaticamente.' },
  { file: 'supabase/config.toml', reason: 'Configuração do projeto Supabase.' },
  { file: '.env', reason: 'Variáveis de ambiente. Auto-gerado.' },
  { file: 'package.json', reason: 'Gerenciado por ferramentas. Não editar diretamente.' },
];

const CODING_STANDARDS = [
  'SEMPRE usar useUnifiedAuth() para autenticação - NUNCA criar contextos alternativos',
  'SEMPRE usar authUserId (não user.id interno) para operações com RLS',
  'SEMPRE usar tokens semânticos de cores (--primary, --background, etc)',
  'SEMPRE usar React Query para estado do servidor',
  'SEMPRE usar lazy loading para páginas de portais',
  'SEMPRE usar shadcn/ui como base de componentes',
  'NUNCA hardcode cores HSL diretamente em componentes',
  'NUNCA criar novos contextos de autenticação',
  'NUNCA editar arquivos marcados como auto-gerados',
  'NUNCA modificar lógica interna de componentes ui/',
];

const RLS_PATTERNS = [
  'SELECT: auth.uid() = user_id - Usuário vê apenas seus dados',
  'INSERT: auth.uid() = user_id - Usuário só cria seus dados',
  'UPDATE: auth.uid() = user_id - Usuário só edita seus dados',
  'DELETE: auth.uid() = user_id - Usuário só deleta seus dados',
  'Admin bypass: Verificar is_admin na RPC ou policy',
  'Tenant isolation: Adicionar tenant_id ao filtro',
];

// ====================================
// Componentes Visuais (mesmos de antes)
// ====================================

function FlipCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PortalGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {PORTALS.map((portal) => (
        <div key={portal.id} className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-3 h-3 rounded-full ${portal.color}`} />
            <span className="font-medium text-sm">{portal.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{portal.desc}</p>
          <code className="text-xs text-primary mt-1 block">{portal.route}</code>
        </div>
      ))}
    </div>
  );
}

function ProfileAccessMatrix() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-1 font-medium">Perfil</th>
            {PORTALS.map((p) => (
              <th key={p.id} className="text-center py-2 px-1 font-medium">
                <span className="text-xs">{p.name.slice(0, 4)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PROFILES.map((profile) => (
            <tr key={profile.id} className="border-b">
              <td className="py-2 px-1 font-medium">{profile.name}</td>
              {PORTALS.map((portal) => (
                <td key={portal.id} className="text-center py-2">
                  {profile.access.includes(portal.id) ? (
                    <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FolderTree() {
  return (
    <div className="font-mono text-sm space-y-1">
      {FOLDER_STRUCTURE.map((item, i) => (
        <div key={i} className={`flex items-center gap-2 ${item.critical ? 'text-primary font-semibold' : ''}`}>
          <span className="text-muted-foreground">{item.path}</span>
          {item.critical && <Badge variant="secondary" className="text-xs">CRÍTICO</Badge>}
          <span className="text-xs text-muted-foreground ml-auto">{item.desc}</span>
        </div>
      ))}
    </div>
  );
}

function GuardsVisual() {
  return (
    <div className="space-y-2">
      {GUARDS.map((guard) => (
        <div key={guard.name} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-semibold text-primary">{`<${guard.name}>`}</code>
              <span className="text-xs text-muted-foreground">({guard.file})</span>
            </div>
            <p className="text-sm text-muted-foreground">{guard.desc}</p>
            <p className="text-xs text-muted-foreground mt-1">→ {guard.use}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuthFlowDiagram() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <div className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
          UnifiedAuthContext
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="px-4 py-2 rounded-lg border bg-card">useUnifiedAuth()</div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
        {['user', 'session', 'isAdmin', 'activeProfile'].map((prop) => (
          <div key={prop} className="px-3 py-2 rounded border bg-muted/50 text-center">
            <code className="text-xs">{prop}</code>
          </div>
        ))}
        {['hasProfile()', 'canAccess()', 'canAccessModule()', 'login()'].map((fn) => (
          <div key={fn} className="px-3 py-2 rounded border bg-primary/10 text-center">
            <code className="text-xs text-primary">{fn}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistVisual({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      {title && <h4 className="font-semibold mb-3">{title}</h4>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="h-3 w-3 text-primary" />
            </div>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DangerZones() {
  return (
    <div className="space-y-2">
      {DANGER_ZONES.map((zone) => (
        <div key={zone.file} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <code className="text-sm font-medium">{zone.file}</code>
            <p className="text-xs text-muted-foreground">{zone.reason}</p>
          </div>
          <Lock className="h-4 w-4 text-destructive" />
        </div>
      ))}
    </div>
  );
}

function CodeExample({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted px-3 py-2 border-b">
        <span className="text-sm font-medium">{title}</span>
      </div>
      <pre className="p-3 text-xs overflow-x-auto bg-card">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ====================================
// GERADOR DE PDF COMPLETO
// ====================================

function generateCompletePDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;
  let pageNum = 1;

  const checkPage = (neededSpace: number = 20) => {
    if (y > pageHeight - neededSpace) {
      doc.addPage();
      pageNum++;
      y = margin;
    }
  };

  const addTitle = (text: string, size: number = 16) => {
    checkPage(30);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += size * 0.5 + 5;
  };

  const addSubtitle = (text: string) => {
    checkPage(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 8;
  };

  const addText = (text: string, size: number = 10, indent: number = 0) => {
    checkPage(15);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPage(8);
      doc.text(line, margin + indent, y);
      y += size * 0.45;
    });
    y += 2;
  };

  const addBullet = (text: string, indent: number = 0) => {
    checkPage(10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent - 5);
    doc.text('•', margin + indent, y);
    lines.forEach((line: string, i: number) => {
      doc.text(line, margin + indent + 5, y);
      if (i < lines.length - 1) y += 5;
    });
    y += 6;
  };

  const addCode = (code: string, indent: number = 0) => {
    checkPage(15);
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    const lines = doc.splitTextToSize(code, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPage(6);
      doc.text(line, margin + indent, y);
      y += 4;
    });
    y += 3;
  };

  const addSeparator = () => {
    checkPage(10);
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  // =====================
  // CAPA
  // =====================
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('NeoHub', pageWidth / 2, 50, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text('Guia de Arquitetura Completo', pageWidth / 2, 65, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Documentação para Agentes de IA e Desenvolvedores', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Versão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 95, { align: 'center' });
  doc.text('Plataforma: Lovable + Supabase', pageWidth / 2, 102, { align: 'center' });

  // Sumário
  y = 130;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Sumário', margin, y);
  y += 10;
  
  const sections = [
    '1. Visão Geral do Ecossistema',
    '2. Os 10 Portais',
    '3. Sistema de Perfis RBAC',
    '4. Autenticação Unificada',
    '5. Guards de Proteção',
    '6. Estrutura de Diretórios',
    '7. Banco de Dados e RLS',
    '8. Edge Functions',
    '9. Padrões de Código',
    '10. Checklists de Desenvolvimento',
    '11. Zona Perigosa - Arquivos Proibidos',
    '12. Exemplos de Código',
  ];
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  sections.forEach(section => {
    doc.text(section, margin + 5, y);
    y += 6;
  });

  // =====================
  // 1. VISÃO GERAL
  // =====================
  doc.addPage();
  y = margin;
  addTitle('1. VISÃO GERAL DO ECOSSISTEMA', 16);
  y += 5;
  
  addText('O NeoHub é uma plataforma SaaS modular composta por 10 portais interconectados, todos compartilhando a mesma base de usuários e sistema de autenticação unificado.');
  y += 3;
  
  addSubtitle('Arquitetura Principal');
  addBullet('Frontend: React + TypeScript + Vite + Tailwind CSS');
  addBullet('Backend: Supabase (Lovable Cloud) - PostgreSQL + Auth + Storage + Edge Functions');
  addBullet('Autenticação: UnifiedAuthContext como fonte única de verdade');
  addBullet('Autorização: RBAC com matriz de perfis + overrides por usuário');
  addBullet('Roteamento: React Router com lazy loading obrigatório para portais');
  
  addSubtitle('Números Chave');
  addBullet('10 Portais distintos');
  addBullet('8 Tipos de perfil');
  addBullet('6 Guards de proteção');
  addBullet('60+ Edge Functions');
  addBullet('100+ Tabelas no banco');

  // =====================
  // 2. OS 10 PORTAIS
  // =====================
  doc.addPage();
  y = margin;
  addTitle('2. OS 10 PORTAIS', 16);
  y += 5;
  
  PORTALS.forEach((portal, i) => {
    checkPage(30);
    addSubtitle(`${i + 1}. ${portal.name} (${portal.route})`);
    addText(portal.desc);
    addText(`Módulos: ${portal.modules.join(', ')}`, 9);
    y += 3;
  });

  // =====================
  // 3. SISTEMA DE PERFIS
  // =====================
  doc.addPage();
  y = margin;
  addTitle('3. SISTEMA DE PERFIS RBAC', 16);
  y += 5;
  
  addText('O NeoHub utiliza um sistema RBAC (Role-Based Access Control) onde cada usuário pode ter múltiplos perfis simultâneos. A estrutura separa a identidade central (neohub_users) das atribuições de papéis (neohub_user_profiles).');
  y += 5;
  
  PROFILES.forEach((profile) => {
    checkPage(25);
    addSubtitle(`${profile.name} (${profile.id})`);
    addText(profile.desc);
    addText(`Acesso: ${profile.access.join(', ')}`, 9);
    y += 3;
  });
  
  addSubtitle('Matriz de Acesso');
  addText('Um perfil pode acessar múltiplos portais. Administradores têm bypass automático em todas as verificações.');

  // =====================
  // 4. AUTENTICAÇÃO UNIFICADA
  // =====================
  doc.addPage();
  y = margin;
  addTitle('4. AUTENTICAÇÃO UNIFICADA', 16);
  y += 5;
  
  addSubtitle('UnifiedAuthContext - O Coração do Sistema');
  addText('Arquivo: src/contexts/UnifiedAuthContext.tsx');
  addText('Este é o ÚNICO contexto de autenticação do sistema. TODO código novo DEVE usar este contexto.');
  y += 5;
  
  addSubtitle('Como Usar');
  addCode(`import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

function MeuComponente() {
  const { 
    user,           // Dados do usuário
    session,        // Sessão Supabase
    isLoading,      // Estado de carregamento
    isAdmin,        // É administrador?
    activeProfile,  // Perfil ativo atual
    hasProfile,     // Verifica se tem perfil
    canAccess,      // Verifica acesso a portal
    canAccessModule // Verifica acesso a módulo
  } = useUnifiedAuth();
  
  return <div>Olá, {user?.fullName}</div>;
}`);
  y += 5;
  
  addSubtitle('Propriedades Importantes do User');
  addBullet('user.id - ID interno na tabela neohub_users');
  addBullet('user.authUserId - ID real do Supabase Auth (usar para RLS!)');
  addBullet('user.userId - Alias para authUserId (compatibilidade)');
  addBullet('user.email - Email do usuário');
  addBullet('user.fullName - Nome completo');
  addBullet('user.profiles - Array de perfis atribuídos');
  addBullet('user.permissions - Permissões no formato "module:action"');
  addBullet('user.isAdmin - Boolean indicando se é admin');
  
  addSubtitle('⚠️ IMPORTANTE: authUserId vs id');
  addText('As políticas RLS do banco usam auth.uid(). Portanto, ao fazer operações de INSERT/UPDATE/DELETE, SEMPRE use user.authUserId, NÃO user.id.');

  // =====================
  // 5. GUARDS DE PROTEÇÃO
  // =====================
  doc.addPage();
  y = margin;
  addTitle('5. GUARDS DE PROTEÇÃO', 16);
  y += 5;
  
  addText('Guards são componentes React que protegem rotas e componentes baseado em autenticação e permissões.');
  addText('Arquivo principal: src/components/guards/UnifiedGuards.tsx');
  y += 5;
  
  GUARDS.forEach((guard) => {
    checkPage(25);
    addSubtitle(`<${guard.name}>`);
    addText(guard.desc);
    addText(`Arquivo: ${guard.file}`, 9);
    addText(`Uso: ${guard.use}`, 9);
    y += 3;
  });
  
  addSubtitle('Exemplo de Uso');
  addCode(`// Proteger um portal inteiro
import { PortalGuard } from '@/components/guards/UnifiedGuards';

export default function MeuPortalApp() {
  return (
    <PortalGuard portal="meuportal">
      <MeuPortalLayout>
        <Routes>
          <Route path="/" element={<MeuPortalHome />} />
        </Routes>
      </MeuPortalLayout>
    </PortalGuard>
  );
}`);

  // =====================
  // 6. ESTRUTURA DE DIRETÓRIOS
  // =====================
  doc.addPage();
  y = margin;
  addTitle('6. ESTRUTURA DE DIRETÓRIOS', 16);
  y += 5;
  
  FOLDER_STRUCTURE.forEach((item) => {
    const prefix = item.critical ? '⭐ ' : '';
    addBullet(`${prefix}${item.path} - ${item.desc}`);
  });
  
  addSubtitle('Arquivos Críticos');
  addBullet('src/App.tsx - Roteamento principal. Todas as rotas lazy aqui.');
  addBullet('src/contexts/UnifiedAuthContext.tsx - Autenticação central.');
  addBullet('src/components/guards/UnifiedGuards.tsx - Guards de proteção.');

  // =====================
  // 7. BANCO DE DADOS E RLS
  // =====================
  doc.addPage();
  y = margin;
  addTitle('7. BANCO DE DADOS E RLS', 16);
  y += 5;
  
  addSubtitle('Tabelas Principais');
  DATABASE_TABLES.forEach((table) => {
    addBullet(`${table.table}: ${table.desc} (RLS: ${table.rls ? 'Sim' : 'Não'}, Key: ${table.key})`);
  });
  
  y += 5;
  addSubtitle('Padrões de RLS (Row Level Security)');
  addText('Todas as tabelas com dados de usuário DEVEM ter RLS habilitado.');
  y += 3;
  
  RLS_PATTERNS.forEach((pattern) => {
    addBullet(pattern);
  });
  
  addSubtitle('Exemplo de Política RLS');
  addCode(`-- Usuário só vê seus próprios dados
CREATE POLICY "Users can view own data" ON minha_tabela
FOR SELECT USING (auth.uid() = user_id);

-- Usuário só insere seus próprios dados
CREATE POLICY "Users can insert own data" ON minha_tabela
FOR INSERT WITH CHECK (auth.uid() = user_id);`);

  // =====================
  // 8. EDGE FUNCTIONS
  // =====================
  doc.addPage();
  y = margin;
  addTitle('8. EDGE FUNCTIONS (BACKEND)', 16);
  y += 5;
  
  addText('Edge Functions são funções serverless executadas no Supabase. Localização: supabase/functions/');
  y += 5;
  
  addSubtitle('Principais Funções');
  EDGE_FUNCTIONS.forEach((fn) => {
    addBullet(`${fn.name}: ${fn.desc}`);
  });
  
  addSubtitle('Como Criar Nova Edge Function');
  addBullet('1. Criar pasta: supabase/functions/minha-funcao/');
  addBullet('2. Criar arquivo: index.ts com handler Deno');
  addBullet('3. Deploy é automático pelo Lovable');
  
  addSubtitle('Exemplo de Edge Function');
  addCode(`// supabase/functions/minha-funcao/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Lógica da função aqui
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});`);

  // =====================
  // 9. PADRÕES DE CÓDIGO
  // =====================
  doc.addPage();
  y = margin;
  addTitle('9. PADRÕES DE CÓDIGO OBRIGATÓRIOS', 16);
  y += 5;
  
  addText('Estas regras são OBRIGATÓRIAS para manter consistência e evitar bugs.');
  y += 5;
  
  CODING_STANDARDS.forEach((standard, i) => {
    addBullet(`${i + 1}. ${standard}`);
  });
  
  addSubtitle('Exemplo de Componente Correto');
  addCode(`// ✅ CORRETO
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function MeuComponente() {
  const { user, canAccessModule } = useUnifiedAuth();
  
  const { data } = useQuery({
    queryKey: ['meus-dados', user?.authUserId], // usar authUserId!
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  if (!canAccessModule('meu_modulo')) {
    return <div>Sem permissão</div>;
  }
  
  return <div className="bg-background text-foreground">{/* tokens semânticos! */}</div>;
}`);

  // =====================
  // 10. CHECKLISTS
  // =====================
  doc.addPage();
  y = margin;
  addTitle('10. CHECKLISTS DE DESENVOLVIMENTO', 16);
  y += 5;
  
  addSubtitle('Checklist: Criar Novo Portal');
  CHECKLIST_NEW_PORTAL.forEach((item) => {
    addBullet(item);
  });
  
  y += 5;
  addSubtitle('Checklist: Criar Novo Módulo');
  CHECKLIST_NEW_MODULE.forEach((item) => {
    addBullet(item);
  });

  // =====================
  // 11. ZONA PERIGOSA
  // =====================
  doc.addPage();
  y = margin;
  addTitle('11. ⚠️ ZONA PERIGOSA - ARQUIVOS PROIBIDOS', 16);
  y += 5;
  
  addText('Os seguintes arquivos são AUTO-GERADOS ou gerenciados pelo sistema. NUNCA os edite diretamente.');
  y += 5;
  
  DANGER_ZONES.forEach((zone) => {
    checkPage(20);
    addSubtitle(`❌ ${zone.file}`);
    addText(zone.reason);
    y += 3;
  });
  
  addSubtitle('Regras de Ouro');
  addBullet('SEMPRE usar useUnifiedAuth() para autenticação');
  addBullet('SEMPRE usar tokens semânticos para cores');
  addBullet('SEMPRE usar React Query para dados do servidor');
  addBullet('SEMPRE usar lazy loading para páginas');
  addBullet('NUNCA criar novos contextos de auth');
  addBullet('NUNCA hardcode IDs ou URLs do Supabase');
  addBullet('NUNCA editar arquivos de src/integrations/supabase/');

  // =====================
  // 12. EXEMPLOS DE CÓDIGO
  // =====================
  doc.addPage();
  y = margin;
  addTitle('12. EXEMPLOS DE CÓDIGO', 16);
  y += 5;
  
  addSubtitle('Estrutura Mínima de Portal');
  addCode(`// src/pages/meuportal/MeuPortalApp.tsx
import { Routes, Route } from 'react-router-dom';
import { PortalGuard } from '@/components/guards/UnifiedGuards';
import MeuPortalLayout from './MeuPortalLayout';
import MeuPortalHome from './MeuPortalHome';

export default function MeuPortalApp() {
  return (
    <PortalGuard portal="meuportal">
      <MeuPortalLayout>
        <Routes>
          <Route path="/" element={<MeuPortalHome />} />
          <Route path="/config" element={<MeuPortalConfig />} />
        </Routes>
      </MeuPortalLayout>
    </PortalGuard>
  );
}`);
  
  y += 5;
  addSubtitle('Hook de Dados com React Query');
  addCode(`// src/hooks/useMeusDados.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export function useMeusDados() {
  const { user } = useUnifiedAuth();
  
  return useQuery({
    queryKey: ['meus-dados', user?.authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*')
        .eq('user_id', user!.authUserId); // usar authUserId para RLS!
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}`);
  
  y += 5;
  addSubtitle('Adicionando Rota no App.tsx');
  addCode(`// Em src/App.tsx, adicionar:
const MeuPortal = React.lazy(() => import('./pages/meuportal/MeuPortalApp'));

// Dentro do Routes:
<Route path="/meuportal/*" element={
  <Suspense fallback={<LoadingSpinner />}>
    <MeuPortal />
  </Suspense>
} />`);

  // =====================
  // RODAPÉ EM TODAS AS PÁGINAS
  // =====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `NeoHub Architecture Guide v${new Date().toLocaleDateString('pt-BR')} - Página ${i}/${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.setTextColor(0);
  }

  return doc;
}

// ====================================
// Componente Principal
// ====================================

export default function ArchitectureDocDownload() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const slides = [
    { id: 'overview', title: 'Visão Geral', icon: Home },
    { id: 'portals', title: 'Portais', icon: Layout },
    { id: 'auth', title: 'Autenticação', icon: Shield },
    { id: 'guards', title: 'Guards', icon: Lock },
    { id: 'structure', title: 'Estrutura', icon: Folder },
    { id: 'checklist', title: 'Checklists', icon: CheckCircle },
    { id: 'danger', title: 'Zona Perigosa', icon: AlertTriangle },
    { id: 'examples', title: 'Exemplos', icon: Code },
  ];

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = generateCompletePDF();
      doc.save('NeoHub-Architecture-Guide-Complete.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">NeoHub Architecture</h1>
              <p className="text-xs text-muted-foreground">Flipchart Visual Interativo</p>
            </div>
          </div>
          <Button onClick={handleGeneratePDF} disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar PDF Completo
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={prevSlide} disabled={currentSlide === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide ? 'bg-primary w-6' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Slide Tabs */}
        <Tabs value={slides[currentSlide].id} onValueChange={(v) => setCurrentSlide(slides.findIndex(s => s.id === v))}>
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50">
            {slides.map((slide) => (
              <TabsTrigger key={slide.id} value={slide.id} className="gap-1 text-xs">
                <slide.icon className="h-3 w-3" />
                {slide.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            {/* Slide 1: Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold mb-2">NeoHub Ecosystem</h2>
                <p className="text-muted-foreground">10 Portais • RBAC Unificado • Supabase Backend</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <FlipCard title="10 Portais" icon={Layout}>
                  <p className="text-sm text-muted-foreground">Admin, NeoTeam, NeoCare, Academy, NeoLicense, Avivar, IPROMED, Vision, NeoPay, NeoHair</p>
                </FlipCard>
                <FlipCard title="8 Perfis" icon={Users}>
                  <p className="text-sm text-muted-foreground">Administrador, Colaborador, Médico, Paciente, Aluno, Licenciado, Cliente Avivar, IPROMED</p>
                </FlipCard>
                <FlipCard title="Auth Unificado" icon={Shield}>
                  <p className="text-sm text-muted-foreground">UnifiedAuthContext controla tudo. Um usuário pode ter múltiplos perfis.</p>
                </FlipCard>
              </div>
            </TabsContent>

            {/* Slide 2: Portais */}
            <TabsContent value="portals" className="space-y-6">
              <h2 className="text-2xl font-bold">Os 10 Portais</h2>
              <PortalGrid />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Matriz de Acesso: Perfil → Portal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileAccessMatrix />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Slide 3: Autenticação */}
            <TabsContent value="auth" className="space-y-6">
              <h2 className="text-2xl font-bold">Sistema de Autenticação</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">UnifiedAuthContext - O Coração do Sistema</CardTitle>
                  <CardDescription>Único contexto de auth. SEMPRE use este para novo código.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AuthFlowDiagram />
                </CardContent>
              </Card>
              <CodeExample 
                title="Como usar"
                code={`import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

function MeuComponente() {
  const { user, isAdmin, hasProfile, canAccess, canAccessModule } = useUnifiedAuth();
  
  if (!canAccess('avivar')) return <Navigate to="/unauthorized" />;
  
  // IMPORTANTE: user.authUserId para operações com RLS!
  return <div>Olá, {user?.fullName}</div>;
}`}
              />
            </TabsContent>

            {/* Slide 4: Guards */}
            <TabsContent value="guards" className="space-y-6">
              <h2 className="text-2xl font-bold">Guards de Proteção</h2>
              <p className="text-muted-foreground">Arquivo: src/components/guards/UnifiedGuards.tsx</p>
              <GuardsVisual />
            </TabsContent>

            {/* Slide 5: Estrutura */}
            <TabsContent value="structure" className="space-y-6">
              <h2 className="text-2xl font-bold">Estrutura de Diretórios</h2>
              <Card>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[400px]">
                    <FolderTree />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Slide 6: Checklists */}
            <TabsContent value="checklist" className="space-y-6">
              <h2 className="text-2xl font-bold">Checklists de Desenvolvimento</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5" /> Novo Portal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChecklistVisual items={CHECKLIST_NEW_PORTAL} title="" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GitBranch className="h-5 w-5" /> Novo Módulo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChecklistVisual items={CHECKLIST_NEW_MODULE} title="" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Slide 7: Zona Perigosa */}
            <TabsContent value="danger" className="space-y-6">
              <h2 className="text-2xl font-bold text-destructive">⚠️ Zona Perigosa</h2>
              <p className="text-muted-foreground">NUNCA edite estes arquivos - são auto-gerados!</p>
              <DangerZones />
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Regras de Ouro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>✅ Sempre use <code className="text-primary">useUnifiedAuth</code></p>
                  <p>✅ Use <code className="text-primary">authUserId</code> para operações com RLS</p>
                  <p>✅ Lazy loading obrigatório para páginas</p>
                  <p>✅ RLS obrigatório em tabelas com dados de usuário</p>
                  <p>✅ Tokens semânticos para cores (nunca hardcode)</p>
                  <p>✅ React Query para estado do servidor</p>
                  <p>✅ shadcn/ui como base de componentes</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Slide 8: Exemplos */}
            <TabsContent value="examples" className="space-y-6">
              <h2 className="text-2xl font-bold">Exemplos de Código</h2>
              <div className="space-y-4">
                <CodeExample 
                  title="Estrutura de Portal Mínima"
                  code={`// src/pages/meuportal/MeuPortalApp.tsx
import { Routes, Route } from 'react-router-dom';
import { PortalGuard } from '@/components/guards/UnifiedGuards';

export default function MeuPortalApp() {
  return (
    <PortalGuard portal="meuportal">
      <MeuPortalLayout>
        <Routes>
          <Route path="/" element={<MeuPortalHome />} />
        </Routes>
      </MeuPortalLayout>
    </PortalGuard>
  );
}`}
                />
                <CodeExample 
                  title="Hook de Dados com React Query"
                  code={`import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export function useMeusDados() {
  const { user } = useUnifiedAuth();
  
  return useQuery({
    queryKey: ['meus-dados', user?.authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*')
        .eq('user_id', user!.authUserId); // authUserId!
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}`}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          NeoHub Architecture Guide • Atualizado: {new Date().toLocaleDateString('pt-BR')}
        </div>
      </footer>
    </div>
  );
}
