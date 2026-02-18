import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Users, 
  GraduationCap, 
  Building2, 
  Zap, 
  Scale, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  CreditCard,
  Leaf,
  Flame,
} from 'lucide-react';
import iconeNeofolic from '@/assets/icone-neofolic.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VisionIcon } from '@/components/icons/VisionIcon';

// Lista unificada de módulos
const modules = [
  { id: 'neocare', name: 'NeoCare', icon: Heart, gradient: 'from-rose-500 to-pink-500', description: 'Portal do Paciente' },
  { id: 'neoteam', name: 'NeoTeam', icon: Users, gradient: 'from-blue-500 to-cyan-500', description: 'Portal do Colaborador' },
  { id: 'academy', name: 'IBRAMEC', icon: GraduationCap, gradient: 'from-emerald-500 to-green-500', description: 'Academia de Ensino' },
  { id: 'neolicense', name: 'Licença', icon: Building2, gradient: 'from-amber-400 to-yellow-500', description: 'Portal do Licenciado' },
  { id: 'avivar', name: 'Avivar', icon: Zap, gradient: 'from-purple-500 to-violet-500', description: 'CRM + IA para Vendas' },
  { id: 'ipromed', name: 'IPROMED', icon: Scale, gradient: 'from-cyan-500 to-cyan-600', description: 'Proteção Médico-Legal' },
  { id: 'vision', name: 'Vision', icon: VisionIcon, gradient: 'from-pink-500 via-rose-500 to-orange-500', description: 'Diagnóstico por IA' },
  { id: 'neopay', name: 'NeoPay', icon: CreditCard, gradient: 'from-green-500 to-emerald-600', description: 'Gateway de Pagamentos' },
  { id: 'hotleads', name: 'HotLeads', icon: Flame, gradient: 'from-orange-500 to-red-600', description: 'Marketplace de Leads' },
  { id: 'neohair', name: 'NeoHair', icon: Leaf, gradient: 'from-teal-500 to-cyan-500', description: 'Tratamento Capilar' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 p-0.5 shadow-xl">
              <img 
                src={iconeNeofolic} 
                alt="NeoHub" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Neo<span className="bg-gradient-to-b from-[#D4AF61] via-[#C9A86C] to-[#8B7355] bg-clip-text text-transparent">Hub</span>
              </h1>
              <p className="text-xs text-slate-400">Ecossistema Integrado</p>
            </div>
          </div>
          
          <Link
            to="/login"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF61] to-[#C9A86C] text-slate-900 font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Entrar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Main Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full text-sm text-slate-300 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Acesso restrito a usuários autorizados
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Plataforma Unificada de
              <br />
              <span className="bg-gradient-to-r from-[#D4AF61] via-[#C9A86C] to-[#8B7355] bg-clip-text text-transparent">
                Gestão Integrada
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
              Um único acesso para todos os portais do ecossistema NeoFolic. 
              Pacientes, colaboradores, alunos e parceiros em uma experiência conectada.
            </p>
          </div>

          {/* Modules Grid - 5+4 layout */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-3xl mx-auto mb-10">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className="group flex flex-col items-center gap-2 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 hover:border-slate-600/50 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${module.id === 'vision' ? 'text-amber-200' : 'text-white'}`} />
                  </div>
                  <span className="text-white text-sm font-medium text-center">{module.name}</span>
                  <span className="text-slate-400 text-[10px] text-center leading-tight">{module.description}</span>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-8 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-amber-400" />
              <span className="text-slate-300 text-sm font-medium">Área Restrita</span>
            </div>
            
            <p className="text-slate-400 text-sm mb-6">
              O acesso a esta plataforma é disponível apenas para usuários previamente autorizados.
              Não é possível criar uma conta diretamente. Se você é um usuário autorizado, faça login abaixo.
            </p>
            
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#D4AF61] to-[#C9A86C] text-slate-900 font-bold text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              Acessar minha conta
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <p className="mt-4 text-xs text-slate-500">
              Caso precise de acesso, entre em contato com o administrador do sistema.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <img src={iconeNeofolic} alt="" className="w-5 h-5" />
            <span>© {new Date().getFullYear()} NeoHub by NeoFolic. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://neohub.ibramec.com/privacy-policy" className="hover:text-slate-300 transition-colors">Política de Privacidade</a>
            <a href="https://neohub.ibramec.com/terms" className="hover:text-slate-300 transition-colors">Termos de Serviço</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
