import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import iconeNeofolic from '@/assets/icone-neofolic.png';
import { ThemeToggle } from '@/components/ThemeToggle';

type PageState = 'checking' | 'recovery' | 'expired' | 'success';

function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
  if (!cleanHash) return params;
  cleanHash.split('&').forEach(pair => {
    const [key, ...rest] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
  });
  return params;
}

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageState, setPageState] = useState<PageState>('checking');

  useEffect(() => {
    // 1. Check URL hash for error params (otp_expired, access_denied, etc.)
    const hashParams = parseHashParams(window.location.hash);
    
    if (hashParams.error || hashParams.error_code) {
      // Link is expired or invalid — sign out any partial session immediately
      supabase.auth.signOut().then(() => {
        setPageState('expired');
      });
      return;
    }

    // 2. Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setPageState('recovery');
      }
    });

    // 3. Check if there's already a recovery session with type=recovery in hash
    const hasRecoveryType = window.location.hash.includes('type=recovery');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && hasRecoveryType) {
        setPageState('recovery');
      } else if (!session) {
        // No session and no recovery params — expired or invalid
        setPageState('expired');
      }
      // If session exists but no recovery type, wait for PASSWORD_RECOVERY event
    });

    // Timeout fallback — if nothing happened in 5s, mark as expired
    const timeout = setTimeout(() => {
      setPageState(prev => prev === 'checking' ? 'expired' : prev);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setPageState('success');

      // Sign out completely and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // SECURITY: Always sign out before going back to login
  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  if (pageState === 'checking') {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 p-1 shadow-2xl overflow-hidden">
            <img src={iconeNeofolic} alt="NeoHub" className="w-full h-full object-cover rounded-full" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Neo<span className="bg-gradient-to-b from-[#D4AF61] via-[#C9A86C] to-[#8B7355] bg-clip-text text-transparent">Hub</span>
          </h1>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-xl p-6 sm:p-8">
          {pageState === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Senha alterada com sucesso!
              </h2>
              <p className="text-muted-foreground mb-4">
                Você será redirecionado para o login em instantes...
              </p>
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
            </div>
          ) : pageState === 'expired' ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Link inválido ou expirado
              </h2>
              <p className="text-muted-foreground mb-6">
                O link de recuperação expirou ou já foi utilizado. Solicite um novo link na tela de login.
              </p>
              <button
                onClick={handleBackToLogin}
                className="btn-primary px-6 py-2"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
                Redefinir Senha
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Digite sua nova senha abaixo
              </p>

              {error && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      required
                      minLength={6}
                      className="input-metric pl-10 pr-10 w-full h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      required
                      minLength={6}
                      className="input-metric pl-10 pr-10 w-full h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3.5 text-base font-semibold mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Redefinir Senha'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2025 NeoHub by NeoFolic
        </p>
      </div>
    </div>
  );
}
