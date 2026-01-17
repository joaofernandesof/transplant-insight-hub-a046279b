import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, User, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

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

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    // Check if there's a saved email
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isSignup) {
        // Validate signup data
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
          setIsSignup(false);
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(signupError || 'Erro ao criar conta');
        }
      } else {
        // Validate login data
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
          // Save or remove email based on remember me preference
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

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setFieldErrors({});
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };
  
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center px-4 py-6 sm:p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <span className="text-white font-bold text-xl sm:text-2xl">B</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Byneofolic</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">Portal do Licenciado</p>
        </div>
        
        {/* Login/Signup Form */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-5 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-5 sm:mb-6 text-center">
            {isSignup ? 'Criar conta' : 'Acesse sua conta'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {successMessage}
              </div>
            )}

            {isSignup && (
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
                    className={`input-metric pl-10 w-full h-12 text-base ${fieldErrors.name ? 'border-red-500' : ''}`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
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
                  className={`input-metric pl-10 w-full h-12 text-base ${fieldErrors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
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
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className={`input-metric pl-10 pr-12 w-full h-12 text-base ${fieldErrors.password ? 'border-red-500' : ''}`}
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
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {isSignup && (
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
                    className={`input-metric pl-10 w-full h-12 text-base ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}
            
            {!isSignup && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <label className="flex items-center gap-2 cursor-pointer order-1 sm:order-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 sm:w-4 sm:h-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-muted-foreground">Lembrar meu email</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline text-left sm:text-right order-2 sm:order-none"
                  onClick={() => {/* TODO: Forgot password */}}
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
              {isLoading ? (isSignup ? 'Criando conta...' : 'Entrando...') : (isSignup ? 'Criar conta' : 'Entrar')}
            </button>
          </form>
          
          {/* Toggle Login/Signup */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              {isSignup ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 text-primary hover:underline font-medium"
              >
                {isSignup ? 'Fazer login' : 'Criar conta'}
              </button>
            </p>
          </div>
        </div>
        
        {/* Safe area spacer for mobile */}
        <div className="h-4 sm:h-0" />
      </div>
    </div>
  );
}
