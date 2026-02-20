import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowLeft, Heart, Users, GraduationCap, Building2, Sparkles, Scale, Fingerprint, Check, CreditCard, Flame } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import iconeNeofolic from '@/assets/icone-neofolic.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PROFILE_ROUTES, NeoHubProfile } from '@/neohub/lib/permissions';
import { VisionIcon } from '@/components/icons/VisionIcon';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
});

const signupSchema = z.object({
  fullName: z.string().min(3, { message: 'Nome deve ter no mínimo 3 caracteres' }),
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ViewMode = 'login' | 'forgot-password' | 'signup';

const modules = [
  { id: 'neocare', name: 'NeoCare', icon: Heart, gradient: 'from-rose-500 to-pink-500', description: 'Pacientes' },
  { id: 'neoteam', name: 'NeoTeam', icon: Users, gradient: 'from-blue-500 to-cyan-500', description: 'Colaboradores' },
  { id: 'academy', name: 'IBRAMEC', icon: GraduationCap, gradient: 'from-emerald-500 to-green-500', description: 'Alunos' },
  { id: 'neolicense', name: 'Licença ByNeoFolic', icon: Building2, gradient: 'from-amber-400 to-yellow-500', description: 'Licenciados' },
  { id: 'avivar', name: 'Avivar', icon: Sparkles, gradient: 'from-purple-500 to-violet-500', description: 'Marketing' },
  { id: 'ipromed', name: 'IPROMED', icon: Scale, gradient: 'from-cyan-500 to-cyan-600', description: 'Jurídico' },
  { id: 'vision', name: 'Vision', icon: VisionIcon, gradient: 'from-pink-500 via-rose-500 to-orange-500', description: 'Diagnóstico IA' },
  { id: 'neopay', name: 'NeoPay', icon: CreditCard, gradient: 'from-green-500 to-emerald-600', description: 'Pagamentos' },
  { id: 'hotleads', name: 'HotLeads', icon: Flame, gradient: 'from-orange-500 to-red-600', description: 'Leads' },
];

export default function Login() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    return !!savedEmail;
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  const { login } = useUnifiedAuth();
  const navigate = useNavigate();
  const biometric = useBiometricAuth();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricPendingCredentials, setBiometricPendingCredentials] = useState<{ email: string; password: string } | null>(null);

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
      // Use published URL to avoid Lovable auth bridge interception on preview
      const publishedUrl = 'https://transplant-insight-hub.lovable.app';
      const redirectUrl = window.location.hostname.includes('lovable')
        ? `${publishedUrl}/reset-password`
        : `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: redirectUrl }
      );

      if (resetError) {
        setError(resetError.message || 'Erro ao processar solicitação');
      } else {
        setSuccessMessage('Se o email estiver cadastrado, você receberá as instruções de recuperação.');
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    }

    setIsLoading(false);
  };
  
  const handleSubmit = async (e: React.FormEvent, biometricCredentials?: { email: string; password: string }) => {
    e?.preventDefault?.();
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    const loginEmail = biometricCredentials?.email || email;
    const loginPassword = biometricCredentials?.password || password;

    try {
      const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
      
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

      const { success, error: loginError } = await login(loginEmail, loginPassword);
      
      if (success) {
        // Check if user is pending approval (after auth, so RLS works)
        const { data: neohubUser } = await supabase
          .from('neohub_users')
          .select('is_active')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
          .maybeSingle();
        
        if (neohubUser && !neohubUser.is_active) {
          await supabase.auth.signOut();
          setError('Seu cadastro está aguardando aprovação do administrador. Você receberá acesso assim que for aprovado.');
          setIsLoading(false);
          return;
        }
        if (biometric.isAvailable && !biometric.hasCredentials && !biometricCredentials) {
          setShowBiometricSetup(true);
          setBiometricPendingCredentials({ email: loginEmail, password: loginPassword });
        }

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', loginEmail);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        navigate('/portal-selector');
      } else {
        setError(loginError || 'Email ou senha incorretos');
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    }
    
    setIsLoading(false);
  };

  // Login com biometria (Face ID / Touch ID)
  const handleBiometricLogin = async () => {
    if (!biometric.isAvailable || !biometric.hasCredentials) return;
    
    setError('');
    setIsLoading(true);

    try {
      const credentials = await biometric.authenticate();
      
      if (credentials) {
        // Simula um evento de form submit
        await handleSubmit({ preventDefault: () => {} } as React.FormEvent, credentials);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      setError('Falha na autenticação biométrica');
      setIsLoading(false);
    }
  };

  // Configura biometria após login bem-sucedido
  const handleSetupBiometric = async (accept: boolean) => {
    setShowBiometricSetup(false);
    
    if (accept && biometricPendingCredentials) {
      try {
        await biometric.saveCredentials(biometricPendingCredentials.email, biometricPendingCredentials.password);
      } catch (e) {
        console.error('Failed to save biometric credentials');
      }
    }
    
    setBiometricPendingCredentials(null);
  };

  const resetForm = () => {
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    const result = signupSchema.safeParse({
      fullName: signupName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
    });

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
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: signupName },
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError('Este email já está cadastrado.');
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erro ao criar usuário');
        setIsLoading(false);
        return;
      }

      // Create neohub_users with is_active = false (pending approval)
      const { error: userError } = await supabase
        .from('neohub_users')
        .insert({
          user_id: authData.user.id,
          email: signupEmail.trim().toLowerCase(),
          full_name: signupName,
          is_active: false,
          allowed_portals: [],
        });

      if (userError) {
        console.error('Error creating neohub user:', userError);
        setError('Erro ao criar perfil. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Sign out immediately so the user can't access anything
      await supabase.auth.signOut();

      setSuccessMessage('Cadastro realizado com sucesso! Seu acesso será liberado após aprovação do administrador.');
      resetForm();
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    }

    setIsLoading(false);
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
              Neo<span className="bg-gradient-to-b from-[#D4AF61] via-[#C9A86C] to-[#8B7355] bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Ecossistema Integrado
            </p>
          </div>

          {/* Modules Hub Visual - Desktop */}
          <div className="hidden md:block relative w-[420px] h-[420px]">
            {/* Central node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-500 flex items-center justify-center z-10 shadow-xl">
              <span className="text-white font-bold text-sm">HUB</span>
            </div>

            {/* Connection lines and modules */}
            {modules.map((module, index) => {
              const Icon = module.icon;
              const angle = (index * (360 / modules.length) - 90) * (Math.PI / 180);
              const radius = 170;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <React.Fragment key={module.id}>
                  {/* Connection line */}
                  <div 
                    className="absolute top-1/2 left-1/2 h-0.5 bg-gradient-to-r from-slate-600 to-transparent origin-left"
                    style={{
                      width: 170,
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
                      <Icon
                        className={`w-6 h-6 ${module.id === 'vision' ? 'text-amber-200' : 'text-white'}`}
                      />
                    </div>
                    <span className="block w-[92px] text-white text-xs font-medium text-center leading-tight">
                      {module.name}
                    </span>
                    <span className="block text-slate-400 text-[10px] text-center leading-tight">
                      {module.description}
                    </span>
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
                  {Icon && (
                    <Icon
                      className={`w-7 h-7 ${module.id === 'vision' ? 'text-amber-200' : 'text-white'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Description */}
          <p className="mt-8 text-center text-slate-300 text-sm max-w-md leading-relaxed">
            Um único acesso para todos os portais:
            <span className="text-rose-400 font-medium"> Pacientes</span>,
            <span className="text-blue-400 font-medium"> Colaboradores</span>,
            <span className="text-emerald-400 font-medium"> Alunos</span>,
            <span className="text-amber-400 font-medium"> Licenciados</span>,
            <span className="text-purple-400 font-medium"> Marketing</span>,
            <span className="text-cyan-400 font-medium"> Jurídico</span> e
            <span className="text-teal-400 font-medium"> Diagnóstico IA</span>.
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
            ) : viewMode === 'signup' ? (
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
                  Criar conta
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-5">
                  Preencha seus dados. O acesso será liberado após aprovação do administrador.
                </p>

                <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                      className="input-metric w-full h-12 text-base"
                    />
                    {fieldErrors.fullName && (
                      <p className="text-destructive text-xs mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
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
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        className={`input-metric pl-10 pr-12 w-full h-12 text-base ${fieldErrors.password ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      >
                        {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-destructive text-xs mt-1">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-3.5 sm:py-3 text-base font-semibold mt-2"
                  >
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </button>
                </form>

                <div className="mt-5 pt-5 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => { setViewMode('login'); resetForm(); }}
                      className="text-primary hover:underline font-medium"
                    >
                      Fazer login
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-5 sm:mb-6 text-center">
                  Acesse sua conta
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
                        autoComplete="current-password"
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
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-3.5 sm:py-3 text-base font-semibold mt-2"
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </button>

                  {/* Botão de login biométrico */}
                  {biometric.isAvailable && biometric.hasCredentials && (
                    <button
                      type="button"
                      onClick={handleBiometricLogin}
                      disabled={isLoading}
                      className="w-full py-3 mt-3 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground font-medium"
                    >
                      <Fingerprint className="w-5 h-5" />
                      <span>Entrar com {biometric.biometryName}</span>
                    </button>
                  )}
                </form>

                {/* Modal de configuração biométrica */}
                {showBiometricSetup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card rounded-xl border border-border shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                          <Fingerprint className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Ativar {biometric.biometryName}?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Use sua biometria para fazer login de forma rápida e segura nas próximas vezes.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSetupBiometric(false)}
                            className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                          >
                            Agora não
                          </button>
                          <button
                            onClick={() => handleSetupBiometric(true)}
                            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            Ativar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Criar conta */}
                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border text-center space-y-3">
                  <p className="text-sm text-muted-foreground font-medium">
                    Não tem uma conta?
                  </p>
                  <button
                    type="button"
                    onClick={() => { setViewMode('signup'); resetForm(); }}
                    className="w-full py-3 rounded-xl border-2 border-primary text-primary font-semibold text-base hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  >
                    Criar conta
                  </button>
                  <p className="text-xs text-muted-foreground/70">
                    O acesso será liberado após aprovação do administrador.
                  </p>
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground/70 pt-1">
                    <a href="https://neohub.ibramec.com/privacy-policy" className="hover:text-muted-foreground transition-colors">Política de Privacidade</a>
                    <a href="https://neohub.ibramec.com/terms" className="hover:text-muted-foreground transition-colors">Termos de Serviço</a>
                  </div>
                </div>
              </>
            )}
          </div>

          
          {/* Safe area spacer for mobile */}
          <div className="h-4 sm:h-0" />
        </div>
      </div>
    </div>
  );
}
