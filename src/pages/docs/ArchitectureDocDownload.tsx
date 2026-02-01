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
// Dados da Arquitetura (Fonte Única de Verdade)
// ====================================

const PORTALS = [
  { id: 'admin', name: 'Admin', route: '/admin', color: 'bg-red-500', desc: 'Administração central' },
  { id: 'neoteam', name: 'NeoTeam', route: '/neoteam', color: 'bg-blue-500', desc: 'Gestão de equipe' },
  { id: 'neocare', name: 'NeoCare', route: '/portal', color: 'bg-emerald-500', desc: 'Portal do paciente' },
  { id: 'academy', name: 'Academy', route: '/academy', color: 'bg-purple-500', desc: 'Educação e cursos' },
  { id: 'neolicense', name: 'NeoLicense', route: '/neolicense', color: 'bg-amber-500', desc: 'Portal do licenciado' },
  { id: 'avivar', name: 'Avivar', route: '/avivar', color: 'bg-pink-500', desc: 'Marketing e CRM com IA' },
  { id: 'ipromed', name: 'IPROMED', route: '/ipromed', color: 'bg-indigo-500', desc: 'Jurídico e compliance' },
  { id: 'vision', name: 'Vision', route: '/vision', color: 'bg-cyan-500', desc: 'Análise capilar IA' },
  { id: 'neopay', name: 'NeoPay', route: '/neopay', color: 'bg-green-500', desc: 'Gateway de pagamentos' },
  { id: 'neohair', name: 'NeoHair', route: '/neohair', color: 'bg-orange-500', desc: 'Tratamento capilar' },
];

const PROFILES = [
  { id: 'administrador', name: 'Administrador', access: ['admin', 'neoteam', 'neocare', 'academy', 'neolicense', 'avivar', 'ipromed', 'vision', 'neopay', 'neohair'] },
  { id: 'colaborador', name: 'Colaborador', access: ['neoteam', 'neocare'] },
  { id: 'paciente', name: 'Paciente', access: ['neocare'] },
  { id: 'aluno', name: 'Aluno', access: ['academy'] },
  { id: 'licenciado', name: 'Licenciado', access: ['neolicense', 'avivar'] },
  { id: 'ipromed', name: 'IPROMED', access: ['ipromed'] },
];

const FOLDER_STRUCTURE = [
  { path: 'src/', type: 'folder', desc: 'Código fonte' },
  { path: '├── components/', type: 'folder', desc: 'Componentes compartilhados' },
  { path: '│   ├── ui/', type: 'folder', desc: 'shadcn/ui components' },
  { path: '│   └── guards/', type: 'folder', desc: 'Guards de proteção' },
  { path: '├── contexts/', type: 'folder', desc: 'Contextos React globais' },
  { path: '│   └── UnifiedAuthContext.tsx', type: 'file', desc: '⭐ AUTH CENTRAL', critical: true },
  { path: '├── hooks/', type: 'folder', desc: 'Hooks compartilhados' },
  { path: '├── pages/', type: 'folder', desc: 'Páginas e portais' },
  { path: '│   ├── admin/', type: 'folder', desc: 'Portal Admin' },
  { path: '│   ├── avivar/', type: 'folder', desc: 'Portal Avivar' },
  { path: '│   ├── ipromed/', type: 'folder', desc: 'Portal IPROMED' },
  { path: '│   └── ...', type: 'more', desc: 'Outros portais' },
  { path: '├── neohub/', type: 'folder', desc: 'Core NeoHub' },
  { path: '│   ├── pages/neocare/', type: 'folder', desc: 'Portal NeoCare' },
  { path: '│   └── pages/neoteam/', type: 'folder', desc: 'Portal NeoTeam' },
  { path: '├── portal/', type: 'folder', desc: 'Portal legado (NeoCare)' },
  { path: '└── App.tsx', type: 'file', desc: 'Roteamento principal', critical: true },
];

const GUARDS = [
  { name: 'ProtectedRoute', desc: 'Apenas verifica autenticação', use: 'Rotas que precisam de login' },
  { name: 'RouteGuard', desc: 'Proteção com permissões', use: 'Rotas com regras específicas' },
  { name: 'ProfileGuard', desc: 'Exige perfil ativo', use: 'Áreas exclusivas de perfil' },
  { name: 'PortalGuard', desc: 'Proteção por portal', use: 'Entrada de portais' },
  { name: 'AdminRoute', desc: 'Apenas administradores', use: 'Painel admin' },
  { name: 'ComponentGuard', desc: 'Proteção de componentes', use: 'Botões/seções sensíveis' },
];

const CHECKLIST_NEW_PORTAL = [
  'Criar diretório em src/pages/meuportal/',
  'Criar MeuPortalApp.tsx com rotas',
  'Criar MeuPortalLayout.tsx e Sidebar',
  'Adicionar rota em src/App.tsx (lazy)',
  'Adicionar tipo ao Portal em UnifiedAuthContext',
  'Mapear perfis em PROFILE_PORTAL_MAP',
  'Usar PortalGuard para proteger',
  'Adicionar ao grid da Landing Page',
  'Criar tabelas com RLS no banco',
];

const CHECKLIST_NEW_MODULE = [
  'Criar diretório modules/meumodulo/',
  'Criar página principal e componentes',
  'Adicionar rota no PortalApp.tsx pai',
  'Adicionar item no menu/sidebar',
  'Criar hooks de dados se necessário',
  'Adicionar guards de permissão',
];

const DANGER_ZONES = [
  { file: 'src/integrations/supabase/client.ts', reason: 'Auto-gerado pelo Supabase' },
  { file: 'src/integrations/supabase/types.ts', reason: 'Auto-gerado pelo Supabase' },
  { file: 'supabase/config.toml', reason: 'Configuração Supabase' },
  { file: '.env', reason: 'Variáveis de ambiente' },
];

// ====================================
// Componentes Visuais
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
        {['hasProfile()', 'canAccess()', 'login()', 'logout()'].map((fn) => (
          <div key={fn} className="px-3 py-2 rounded border bg-primary/10 text-center">
            <code className="text-xs text-primary">{fn}</code>
          </div>
        ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground mt-4">
        <p className="font-medium">⚠️ Sempre use <code className="text-primary">useUnifiedAuth</code> para novo código!</p>
      </div>
    </div>
  );
}

function ChecklistVisual({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs text-muted-foreground">{i + 1}</span>
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

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      const addTitle = (text: string, size: number = 16) => {
        if (y > pageHeight - 30) { doc.addPage(); y = margin; }
        doc.setFontSize(size);
        doc.setFont('helvetica', 'bold');
        doc.text(text, margin, y);
        y += size * 0.5 + 3;
      };

      const addText = (text: string, size: number = 10) => {
        if (y > pageHeight - 20) { doc.addPage(); y = margin; }
        doc.setFontSize(size);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          if (y > pageHeight - 15) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += size * 0.4 + 1;
        });
      };

      // Capa
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('NeoHub', pageWidth / 2, 60, { align: 'center' });
      doc.setFontSize(16);
      doc.text('Guia de Arquitetura', pageWidth / 2, 75, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Documentação para Desenvolvimento', pageWidth / 2, 90, { align: 'center' });
      doc.text(`Atualizado: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 100, { align: 'center' });

      // Portais
      doc.addPage(); y = margin;
      addTitle('10 PORTAIS DO ECOSSISTEMA', 14);
      y += 5;
      PORTALS.forEach((p) => {
        addText(`• ${p.name} (${p.route}) - ${p.desc}`);
      });

      // Perfis
      y += 10;
      addTitle('PERFIS E ACESSOS', 14);
      y += 5;
      PROFILES.forEach((p) => {
        addText(`• ${p.name}: ${p.access.join(', ')}`);
      });

      // Auth
      doc.addPage(); y = margin;
      addTitle('SISTEMA DE AUTENTICAÇÃO', 14);
      y += 5;
      addText('UnifiedAuthContext é o ÚNICO contexto de autenticação.');
      addText('Sempre use: import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"');
      y += 5;
      addText('Propriedades: user, session, isLoading, isAdmin, activeProfile');
      addText('Métodos: hasProfile(), canAccess(), login(), logout(), signup()');

      // Guards
      y += 10;
      addTitle('GUARDS DE PROTEÇÃO', 14);
      y += 5;
      GUARDS.forEach((g) => {
        addText(`• <${g.name}> - ${g.desc}`);
      });

      // Estrutura
      doc.addPage(); y = margin;
      addTitle('ESTRUTURA DE DIRETÓRIOS', 14);
      y += 5;
      addText('src/components/ui/ → shadcn/ui');
      addText('src/components/guards/ → Guards de rotas');
      addText('src/contexts/UnifiedAuthContext.tsx → AUTH CENTRAL');
      addText('src/pages/[portal]/ → Portais');
      addText('src/App.tsx → Roteamento principal');

      // Checklists
      doc.addPage(); y = margin;
      addTitle('CHECKLIST: NOVO PORTAL', 14);
      y += 5;
      CHECKLIST_NEW_PORTAL.forEach((item, i) => addText(`${i + 1}. ${item}`));

      y += 10;
      addTitle('CHECKLIST: NOVO MÓDULO', 14);
      y += 5;
      CHECKLIST_NEW_MODULE.forEach((item, i) => addText(`${i + 1}. ${item}`));

      // Zona Perigosa
      doc.addPage(); y = margin;
      addTitle('⚠️ ARQUIVOS PROIBIDOS DE EDITAR', 14);
      y += 5;
      DANGER_ZONES.forEach((z) => addText(`❌ ${z.file} - ${z.reason}`));

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(`NeoHub Architecture Guide - Página ${i}/${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.setTextColor(0);
      }

      doc.save('NeoHub-Architecture-Guide.pdf');
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
          <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar PDF
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
                <FlipCard title="6 Perfis" icon={Users}>
                  <p className="text-sm text-muted-foreground">Administrador, Colaborador, Paciente, Aluno, Licenciado, IPROMED</p>
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
  const { user, isAdmin, hasProfile, canAccess } = useUnifiedAuth();
  
  if (!canAccess('avivar')) return <Navigate to="/unauthorized" />;
  
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

export function useMeusDados() {
  return useQuery({
    queryKey: ['meus-dados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('minha_tabela')
        .select('*');
      if (error) throw error;
      return data;
    },
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
