import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNeoHubAuth, PROFILE_ROUTES } from '../contexts/NeoHubAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Heart, Users, GraduationCap, Building2, Sparkles, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import logoNeofolic from '@/assets/logo-byneofolic.png';
import iconeNeofolic from '@/assets/icone-neofolic.png';
import { ThemeToggle } from '@/components/ThemeToggle';

const modules = [
  { 
    id: 'neocare', 
    name: 'NeoCare', 
    icon: Heart, 
    color: 'from-rose-500 to-pink-500',
    description: 'Portal do Paciente'
  },
  { 
    id: 'neoteam', 
    name: 'NeoTeam', 
    icon: Users, 
    color: 'from-blue-500 to-cyan-500',
    description: 'Portal do Colaborador'
  },
  { 
    id: 'academy', 
    name: 'IBRAMEC', 
    icon: GraduationCap, 
    color: 'from-emerald-500 to-green-500',
    description: 'Portal do Aluno'
  },
  { 
    id: 'neolicense', 
    name: 'Licença ByNeoFolic', 
    icon: Building2, 
    color: 'from-amber-400 to-yellow-500',
    description: 'Portal do Licenciado'
  },
  { 
    id: 'avivar', 
    name: 'Avivar', 
    icon: Sparkles, 
    color: 'from-purple-500 to-violet-500',
    description: 'Marketing Digital'
  },
];

export default function NeoHubLogin() {
  const navigate = useNavigate();
  const { login, user, activeProfile, isLoading: authLoading } = useNeoHubAuth();
  
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
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left Side - Hub Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>

        {/* Central Hub */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-1 shadow-2xl">
              <img 
                src={iconeNeofolic} 
                alt="NeoHub" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
              Neo<span className="text-primary">Hub</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Ecossistema Integrado NeoFolic
            </p>
          </div>

          {/* Modules Grid */}
          <div className="hidden md:grid grid-cols-3 gap-4 max-w-xl">
            {modules.map((module, index) => {
              const Icon = module.icon;
              const isCenter = index === 2;
              
              return (
                <div
                  key={module.id}
                  className={`
                    relative group cursor-default
                    ${index === 0 ? 'col-start-1' : ''}
                    ${index === 1 ? 'col-start-3' : ''}
                    ${index === 2 ? 'col-start-2 row-start-2' : ''}
                    ${index === 3 ? 'col-start-1 row-start-3' : ''}
                    ${index === 4 ? 'col-start-3 row-start-3' : ''}
                  `}
                >
                  {/* Connection lines */}
                  {!isCenter && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`
                        absolute w-16 h-0.5 bg-gradient-to-r from-slate-600 to-transparent
                        ${index === 0 ? 'rotate-45 translate-x-8 translate-y-8' : ''}
                        ${index === 1 ? '-rotate-45 -translate-x-8 translate-y-8' : ''}
                        ${index === 3 ? '-rotate-45 translate-x-8 -translate-y-8' : ''}
                        ${index === 4 ? 'rotate-45 -translate-x-8 -translate-y-8' : ''}
                      `} />
                    </div>
                  )}
                  
                  <div className={`
                    flex flex-col items-center p-4 rounded-xl
                    bg-slate-800/50 backdrop-blur-sm border border-slate-700/50
                    transition-all duration-300 hover:scale-105 hover:bg-slate-700/50
                    ${isCenter ? 'ring-2 ring-primary/50' : ''}
                  `}>
                    <div className={`
                      w-12 h-12 rounded-lg bg-gradient-to-br ${module.color}
                      flex items-center justify-center mb-2 shadow-lg
                    `}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm">{module.name}</span>
                    <span className="text-slate-400 text-xs text-center">{module.description}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile modules (simplified) */}
          <div className="flex md:hidden flex-wrap justify-center gap-3 mt-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className={`
                    w-14 h-14 rounded-xl bg-gradient-to-br ${module.color}
                    flex items-center justify-center shadow-lg
                  `}
                  title={module.name}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
              );
            })}
          </div>

          {/* Features text */}
          <div className="mt-8 text-center max-w-md">
            <p className="text-slate-300 text-sm leading-relaxed">
              Um único acesso para todos os portais: 
              <span className="text-rose-400 font-medium"> Pacientes</span>,
              <span className="text-blue-400 font-medium"> Colaboradores</span>,
              <span className="text-emerald-400 font-medium"> Alunos IBRAMEC</span>,
              <span className="text-amber-400 font-medium"> Licenciados</span> e
              <span className="text-purple-400 font-medium"> Marketing</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 lg:bg-background lg:min-w-[480px]">
        <Card className="w-full max-w-md shadow-2xl border-border/50">
          <CardContent className="pt-8 pb-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Acesse sua conta</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Entre com suas credenciais para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">Lembrar meu login</span>
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
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

          <CardFooter className="flex flex-col gap-4 pt-0 pb-6">
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
              <Link to="/register" className="text-primary hover:underline font-medium">
                Criar conta
              </Link>
            </p>

            {/* Logo footer */}
            <div className="pt-4 border-t w-full flex justify-center">
              <img 
                src={logoNeofolic} 
                alt="ByNeofolic" 
                className="h-6 opacity-50 dark:invert"
              />
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
