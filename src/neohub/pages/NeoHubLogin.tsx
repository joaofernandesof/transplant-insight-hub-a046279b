import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUnifiedAuth, PROFILE_ROUTES } from '@/contexts/UnifiedAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Heart, Users, GraduationCap, Building2, Sparkles, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

import iconeNeofolic from '@/assets/icone-neofolic.png';
import { ThemeToggle } from '@/components/ThemeToggle';

const modules = [
  { 
    id: 'neocare', 
    name: 'NeoCare', 
    icon: Heart, 
    color: 'from-rose-500 to-pink-500',
    glowColor: 'shadow-rose-500/30',
    description: 'Portal do Paciente'
  },
  { 
    id: 'neoteam', 
    name: 'NeoTeam', 
    icon: Users, 
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'shadow-blue-500/30',
    description: 'Portal do Colaborador'
  },
  { 
    id: 'academy', 
    name: 'IBRAMEC', 
    icon: GraduationCap, 
    color: 'from-emerald-500 to-green-500',
    glowColor: 'shadow-emerald-500/30',
    description: 'Portal do Aluno'
  },
  { 
    id: 'neolicense', 
    name: 'Licença ByNeoFolic', 
    icon: Building2, 
    color: 'from-amber-400 to-yellow-500',
    glowColor: 'shadow-amber-500/30',
    description: 'Portal do Licenciado'
  },
  { 
    id: 'avivar', 
    name: 'Avivar', 
    icon: Sparkles, 
    color: 'from-purple-500 to-violet-500',
    glowColor: 'shadow-purple-500/30',
    description: 'Marketing Digital'
  },
];

export default function NeoHubLogin() {
  const navigate = useNavigate();
  const { login, user, activeProfile, isLoading: authLoading } = useUnifiedAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Carregar email salvo
  useEffect(() => {
    const savedEmail = localStorage.getItem('neohub_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Redirecionar se já está logado
  useEffect(() => {
    if (user && !authLoading) {
      if (user.profiles.length === 1) {
        navigate(PROFILE_ROUTES[user.profiles[0]], { replace: true });
      } else if (activeProfile) {
        navigate(PROFILE_ROUTES[activeProfile], { replace: true });
      } else {
        navigate('/select-profile', { replace: true });
      }
    }
  }, [user, activeProfile, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Salvar ou remover email
    if (rememberMe) {
      localStorage.setItem('neohub_remembered_email', email);
    } else {
      localStorage.removeItem('neohub_remembered_email');
    }

    const result = await login(email, password);
    
    if (!result.success) {
      toast.error(result.error || 'Erro ao fazer login');
      setIsLoading(false);
      return;
    }

    toast.success('Login realizado com sucesso!');
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <ThemeToggle />
      </div>

      {/* Left Side - Hub Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Animated Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur-3xl animate-spin" style={{ animationDuration: '30s' }} />
        </div>

        {/* Central Hub */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo and Title with entrance animation */}
          <div className="mb-8 text-center animate-fade-in" style={{ animationDuration: '0.8s' }}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-1 shadow-2xl transform hover:scale-110 transition-all duration-500 hover:rotate-3 animate-float">
              <img 
                src={iconeNeofolic} 
                alt="NeoHub" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
              <span className="inline-block animate-slide-in-left" style={{ animationDuration: '0.6s' }}>Neo</span>
              <span className="text-primary inline-block animate-slide-in-right" style={{ animationDuration: '0.6s', animationDelay: '0.2s' }}>Hub</span>
            </h1>
            <p className="text-slate-400 text-lg animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Ecossistema Integrado NeoFolic
            </p>
          </div>

          {/* Modules Grid with staggered animations */}
          <div className="hidden md:grid grid-cols-3 gap-4 max-w-xl">
            {modules.map((module, index) => {
              const Icon = module.icon;
              const isCenter = index === 2;
              const delay = index * 0.1;
              
              return (
                <div
                  key={module.id}
                  className={`
                    relative group cursor-default animate-scale-in
                    ${index === 0 ? 'col-start-1' : ''}
                    ${index === 1 ? 'col-start-3' : ''}
                    ${index === 2 ? 'col-start-2 row-start-2' : ''}
                    ${index === 3 ? 'col-start-1 row-start-3' : ''}
                    ${index === 4 ? 'col-start-3 row-start-3' : ''}
                  `}
                  style={{ animationDelay: `${0.3 + delay}s`, animationDuration: '0.5s' }}
                >
                  {/* Animated connection lines */}
                  {!isCenter && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`
                        absolute w-16 h-0.5 origin-left
                        ${index === 0 ? 'rotate-45 translate-x-8 translate-y-8' : ''}
                        ${index === 1 ? '-rotate-45 -translate-x-8 translate-y-8' : ''}
                        ${index === 3 ? '-rotate-45 translate-x-8 -translate-y-8' : ''}
                        ${index === 4 ? 'rotate-45 -translate-x-8 -translate-y-8' : ''}
                      `}>
                        <div className="h-full w-full bg-gradient-to-r from-slate-600 to-transparent animate-pulse-line" style={{ animationDelay: `${delay}s` }} />
                        <div className="absolute top-0 left-0 h-full w-2 bg-primary/50 rounded-full animate-travel" style={{ animationDelay: `${delay + 1}s` }} />
                      </div>
                    </div>
                  )}
                  
                  <div className={`
                    flex flex-col items-center p-4 rounded-xl
                    bg-slate-800/50 backdrop-blur-sm border border-slate-700/50
                    transition-all duration-500 hover:scale-110 hover:bg-slate-700/50
                    hover:border-slate-600 group-hover:shadow-2xl
                    ${isCenter ? 'ring-2 ring-primary/50 animate-pulse-glow' : ''}
                  `}>
                    <div className={`
                      w-12 h-12 rounded-lg bg-gradient-to-br ${module.color}
                      flex items-center justify-center mb-2 shadow-lg
                      transition-all duration-500 group-hover:scale-110 group-hover:${module.glowColor} group-hover:shadow-xl
                      animate-float-delayed
                    `}
                    style={{ animationDelay: `${index * 0.5}s` }}
                    >
                      <Icon className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="text-white font-semibold text-sm transition-colors duration-300 group-hover:text-primary">{module.name}</span>
                    <span className="text-slate-400 text-xs text-center transition-opacity duration-300 opacity-70 group-hover:opacity-100">{module.description}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile modules with animation */}
          <div className="flex md:hidden flex-wrap justify-center gap-3 mt-4">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className={`
                    w-14 h-14 rounded-xl bg-gradient-to-br ${module.color}
                    flex items-center justify-center shadow-lg
                    transform hover:scale-110 transition-all duration-300
                    animate-bounce-in
                  `}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  title={module.name}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
              );
            })}
          </div>

          {/* Features text with typewriter effect */}
          <div className="mt-8 text-center max-w-md animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <p className="text-slate-300 text-sm leading-relaxed">
              Um único acesso para todos os portais: 
              <span className="text-rose-400 font-medium animate-color-pulse"> Pacientes</span>,
              <span className="text-blue-400 font-medium animate-color-pulse" style={{ animationDelay: '0.2s' }}> Colaboradores</span>,
              <span className="text-emerald-400 font-medium animate-color-pulse" style={{ animationDelay: '0.4s' }}> Alunos IBRAMEC</span>,
              <span className="text-amber-400 font-medium animate-color-pulse" style={{ animationDelay: '0.6s' }}> Licenciados</span> e
              <span className="text-purple-400 font-medium animate-color-pulse" style={{ animationDelay: '0.8s' }}> Marketing</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 lg:bg-background lg:min-w-[480px]">
        <Card className="w-full max-w-md shadow-2xl border-border/50 animate-slide-up" style={{ animationDuration: '0.6s' }}>
          <CardContent className="pt-8 pb-4">
            <div className="text-center mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold text-foreground">Acesse sua conta</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Entre com suas credenciais para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Label htmlFor="email">E-mail</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-10 transition-all duration-300 focus:scale-[1.02]"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Label htmlFor="password">Senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-10 transition-all duration-300 focus:scale-[1.02]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:scale-110 transition-transform"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border transition-transform group-hover:scale-110"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Lembrar meu login</span>
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 animate-fade-in transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25" 
                style={{ animationDelay: '0.6s' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-0 pb-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors">
                Criar conta
              </Link>
            </p>

          </CardFooter>
        </Card>
      </div>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }
        
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse-line {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes travel {
          0% { left: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); }
          50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.6); }
        }
        
        @keyframes color-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; text-shadow: 0 0 10px currentColor; }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-pulse-line {
          animation: pulse-line 2s ease-in-out infinite;
        }
        
        .animate-travel {
          animation: travel 3s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-color-pulse {
          animation: color-pulse 2s ease-in-out infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
