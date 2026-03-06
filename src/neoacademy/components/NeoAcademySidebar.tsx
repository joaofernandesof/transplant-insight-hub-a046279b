import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Play, Users, Award,
  Settings, BarChart3, ChevronLeft, Sparkles,
  GraduationCap, FileText, Calendar, MessageCircle,
  ClipboardList, UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/neoacademy' },
  { label: 'Catálogo', icon: BookOpen, path: '/neoacademy/catalog' },
  { label: 'Meus Cursos', icon: GraduationCap, path: '/neoacademy/my-courses' },
  
  { label: 'Agenda', icon: Calendar, path: '/neoacademy/schedule' },
  { label: 'Provas', icon: FileText, path: '/neoacademy/exams' },
  { label: 'Certificados', icon: Award, path: '/neoacademy/certificates' },
  { label: 'Comunidade', icon: Users, path: '/neoacademy/community' },
  { label: 'Chat', icon: MessageCircle, path: '/neoacademy/chat' },
  { label: 'Indicações', icon: UserCog, path: '/neoacademy/referral' },
];

const ADMIN_ITEMS = [
  { label: 'Analytics', icon: BarChart3, path: '/neoacademy/admin/analytics' },
  { label: 'Gerenciar Cursos', icon: BookOpen, path: '/neoacademy/admin/courses' },
  { label: 'Alunos', icon: Users, path: '/neoacademy/admin/students' },
  { label: 'Matrículas', icon: ClipboardList, path: '/neoacademy/admin/enrollments' },
  { label: 'Pesquisas', icon: ClipboardList, path: '/neoacademy/admin/surveys' },
  { label: 'Configurações', icon: Settings, path: '/neoacademy/admin/settings' },
];

interface NeoAcademySidebarProps {
  children: React.ReactNode;
}

export function NeoAcademySidebar({ children }: NeoAcademySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 flex flex-col border-r border-white/5 bg-[#0d0d14] transition-all duration-300 h-screen z-40",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Conecta Capilar</span>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/neoacademy'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                isActive 
                  ? "bg-blue-500/15 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Admin section */}
          {!collapsed && (
            <div className="pt-6 pb-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Produtor
              </span>
            </div>
          )}
          {ADMIN_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                isActive 
                  ? "bg-blue-500/15 text-blue-400" 
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Spacer for fixed sidebar */}
      <div className={cn("shrink-0 transition-all duration-300", collapsed ? "w-16" : "w-64")} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-[#0a0a0f]">
        {children}
      </main>
    </div>
  );
}
