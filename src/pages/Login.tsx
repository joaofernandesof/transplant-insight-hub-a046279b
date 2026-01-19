import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, User, ArrowLeft, Heart, Users, GraduationCap, Building2, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import iconeNeofolic from '@/assets/icone-neofolic.png';
import logoNeofolic from '@/assets/logo-byneofolic.png';
import { ThemeToggle } from '@/components/ThemeToggle';

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

const signupSchema = z.object({
  name: z.string().trim().min(3, { message: 'Nome deve ter no mínimo 3 caracteres' }).max(100),
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
});

type ViewMode = 'login' | 'signup' | 'forgot-password';

const modules = [
  { id: 'neocare', name: 'NeoCare', icon: Heart, gradient: 'from-rose-500 to-pink-500', description: 'Pacientes' },
  { id: 'neoteam', name: 'NeoTeam', icon: Users, gradient: 'from-blue-500 to-cyan-500', description: 'Colaboradores' },
  { id: 'academy', name: 'Academy', icon: GraduationCap, gradient: 'from-amber-500 to-orange-500', description: 'Alunos' },
  { id: 'neolicense', name: 'NeoLicense', icon: Building2, gradient: 'from-emerald-500 to-teal-500', description: 'Licenciados' },
  { id: 'avivar', name: 'Avivar', icon: Sparkles, gradient: 'from-purple-500 to-violet-500', description: 'Marketing' },
];

export default function Login() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    return !!savedEmail;
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    const result = resetPasswordSchema.safeParse({ email });
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    }

    setIsLoading(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (viewMode === 'signup') {
        const result = signupSchema.safeParse({ name, email, password, confirmPassword });
        
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0] as string] = err.message;
            }
          });
          setFieldErrors(errors);
          setIsLoading(false);
          return;
        }

        const { success, error: signupError } = await signup(email, password, name);
        
        if (success) {
          setSuccessMessage('Conta criada com sucesso! Você já pode fazer login.');
          setViewMode('login');
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(signupError || 'Erro ao criar conta');
        }
      } else {
        const result = loginSchema.safeParse({ email, password });
        
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0] as string] = err.message;
            }
          });
          setFieldErrors(errors);
          setIsLoading(false);
          return;
        }

        const { success, error: loginError } = await login(email, password);
        
        if (success) {
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          navigate('/');
        } else {
          setError(loginError || 'Email ou senha incorretos');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };
  
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left Side - NeoHub Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>

        {/* Central Hub Content */}
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

          {/* Modules Hub Visual - Desktop */}
          <div className="hidden md:block relative w-80 h-80">
            {/* Central node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-500 flex items-center justify-center z-10 shadow-xl">
              <span className="text-white font-bold text-sm">HUB</span>
            </div>

            {/* Connection lines and modules */}
            {modules.map((module, index) => {
              const Icon = module.icon;
              const angle = (index * (360 / modules.length) - 90) * (Math.PI / 180);
              const radius = 120;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <React.Fragment key={module.id}>
                  {/* Connection line */}
                  <div 
                    className="absolute top-1/2 left-1/2 h-0.5 bg-gradient-to-r from-slate-600 to-transparent origin-left"
                    style={{
                      width: radius,
                      transform: `rotate(${index * (360 / modules.length) - 90}deg)`,
                    }}
                  />
                  
                  {/* Module node */}
                  <div
                    className="absolute flex flex-col items-center gap-1 transition-transform hover:scale-110 cursor-default"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-medium">{module.name}</span>
                    <span className="text-slate-400 text-[10px]">{module.description}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile modules grid */}
          <div className="flex md:hidden flex-wrap justify-center gap-3 mt-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg`}
                  title={module.name}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
              );
            })}
          </div>

          {/* Description */}
          <p className="mt-8 text-center text-slate-300 text-sm max-w-md leading-relaxed">
            Um único acesso para todos os portais:
            <span className="text-rose-400 font-medium"> Pacientes</span>,
            <span className="text-blue-400 font-medium"> Colaboradores</span>,
            <span className="text-amber-400 font-medium"> Alunos</span>,
            <span className="text-emerald-400 font-medium"> Licenciados</span> e
            <span className="text-purple-400 font-medium"> Marketing</span>.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 lg:bg-background lg:min-w-[480px]">
        <div className="w-full max-w-md">
          {/* Login/Signup/Forgot Password Form */}
          <div className="bg-card rounded-2xl border border-border shadow-xl p-5 sm:p-8">
            {viewMode === 'forgot-password' ? (
              <>
                <button
                  type="button"
                  onClick={() => { setViewMode('login'); resetForm(); }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </button>
                
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">
                  Recuperar senha
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-5">
                  Digite seu email e enviaremos instruções para redefinir sua senha.
                </p>
                
                <form onSubmit={handlePasswordReset} className="space-y-4 sm:space-y-5">
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm">
                      {successMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        autoComplete="email"
                        className={`input-metric pl-10 w-full h-12 text-base ${fieldErrors.email ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-destructive text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-3.5 sm:py-3 text-base font-semibold mt-2"
                  >
                    {isLoading ? 'Enviando...' : 'Enviar email de recuperação'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-5 sm:mb-6 text-center">
                  {viewMode === 'signup' ? 'Criar conta' : 'Acesse sua conta'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm">
                      {successMessage}
                    </div>
                  )}

                  {viewMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                        Nome completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome"
                          required
                          className={`input-metric pl-10 w-full h-12 text-base ${fieldErrors.name ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {fieldErrors.name && (
                        <p className="text-destructive text-xs mt-1">{fieldErrors.name}</p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        autoComplete="email"
                        className={`input-metric pl-10 w-full h-12 text-base ${fieldErrors.email ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-destructive text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete={viewMode === 'signup' ? "new-password" : "current-password"}
                        className={`input-metric pl-10 pr-12 w-full h-12 text-base ${fieldErrors.password ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-destructive text-xs mt-1">{fieldErrors.password}</p>
                    )}
                  </div>

                  {viewMode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                        Confirmar senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          autoComplete="new-password"
                          className={`input-metric pl-10 w-full h-12 text-base ${fieldErrors.confirmPassword ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="text-destructive text-xs mt-1">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}
                  
                  {viewMode === 'login' && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                      <label className="flex items-center gap-2 cursor-pointer order-1 sm:order-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-5 h-5 sm:w-4 sm:h-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                        <span className="text-sm text-muted-foreground">Lembrar meu login</span>
                      </label>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline text-left sm:text-right order-2 sm:order-none"
                        onClick={() => { setViewMode('forgot-password'); resetForm(); }}
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-3.5 sm:py-3 text-base font-semibold mt-2"
                  >
                    {isLoading ? (viewMode === 'signup' ? 'Criando conta...' : 'Entrando...') : (viewMode === 'signup' ? 'Criar conta' : 'Entrar')}
                  </button>
                </form>
                
                {/* Toggle Login/Signup */}
                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {viewMode === 'signup' ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                    <button
                      type="button"
                      onClick={() => { setViewMode(viewMode === 'signup' ? 'login' : 'signup'); resetForm(); }}
                      className="ml-2 text-primary hover:underline font-medium"
                    >
                      {viewMode === 'signup' ? 'Fazer login' : 'Criar conta'}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer logo */}
          <div className="mt-6 flex justify-center">
            <img 
              src={logoNeofolic} 
              alt="ByNeofolic" 
              className="h-6 opacity-50 invert lg:invert-0 lg:dark:invert"
            />
          </div>
          
          {/* Safe area spacer for mobile */}
          <div className="h-4 sm:h-0" />
        </div>
      </div>
    </div>
  );
}
