import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '../contexts/PortalAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  User,
  Shield,
  Key,
  Database
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface DiagnosticData {
  supabaseSession: Session | null;
  portalUser: any;
  userRoles: any[];
  rawPortalUser: any;
  errors: string[];
}

export default function AuthDiagnostic() {
  const navigate = useNavigate();
  const { user, session, isLoading } = usePortalAuth();
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);

  const runDiagnostic = async () => {
    setLoading(true);
    const errors: string[] = [];
    let supabaseSession: Session | null = null;
    let portalUser: any = null;
    let userRoles: any[] = [];
    let rawPortalUser: any = null;

    try {
      // 1. Check Supabase session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        errors.push(`Erro ao obter sessão: ${sessionError.message}`);
      } else {
        supabaseSession = sessionData.session;
      }

      if (supabaseSession?.user) {
        // 2. Fetch portal_users directly
        const { data: puData, error: puError } = await supabase
          .from('portal_users')
          .select('*')
          .eq('user_id', supabaseSession.user.id);

        if (puError) {
          errors.push(`Erro ao buscar portal_users: ${puError.message}`);
        } else if (!puData || puData.length === 0) {
          errors.push('Nenhum registro em portal_users para este user_id');
        } else {
          rawPortalUser = puData;
          portalUser = puData[0];
        }

        // 3. Fetch portal_user_roles directly
        if (portalUser) {
          const { data: rolesData, error: rolesError } = await supabase
            .from('portal_user_roles')
            .select('*')
            .eq('portal_user_id', portalUser.id);

          if (rolesError) {
            errors.push(`Erro ao buscar portal_user_roles: ${rolesError.message}`);
          } else if (!rolesData || rolesData.length === 0) {
            errors.push('Nenhuma role encontrada para este usuário');
          } else {
            userRoles = rolesData;
          }
        }
      } else {
        errors.push('Nenhuma sessão ativa no Supabase');
      }
    } catch (e: any) {
      errors.push(`Erro inesperado: ${e.message}`);
    }

    setDiagnostic({
      supabaseSession,
      portalUser,
      userRoles,
      rawPortalUser,
      errors,
    });
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const StatusIcon = ({ ok }: { ok: boolean }) => 
    ok ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/login')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Diagnóstico de Autenticação</h1>
            <p className="text-muted-foreground">Informações detalhadas para debug e suporte</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={runDiagnostic} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : diagnostic ? (
          <>
            {/* Errors */}
            {diagnostic.errors.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Erros Encontrados ({diagnostic.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnostic.errors.map((err, i) => (
                      <li key={i} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        {err}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Context State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Estado do PortalAuthContext
                </CardTitle>
                <CardDescription>Dados do hook usePortalAuth()</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <StatusIcon ok={!isLoading} />
                    <span>isLoading:</span>
                    <Badge variant={isLoading ? 'secondary' : 'outline'}>{isLoading ? 'true' : 'false'}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon ok={!!session} />
                    <span>session:</span>
                    <Badge variant={session ? 'default' : 'destructive'}>{session ? 'Presente' : 'Null'}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon ok={!!user} />
                    <span>user:</span>
                    <Badge variant={user ? 'default' : 'destructive'}>{user ? 'Presente' : 'Null'}</Badge>
                  </div>
                  {user && (
                    <div className="flex items-center gap-2">
                      <span>Roles (context):</span>
                      {user.roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supabase Session */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Sessão Supabase (auth.getSession)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {diagnostic.supabaseSession ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><strong>User ID:</strong> <code className="text-xs bg-muted p-1 rounded">{diagnostic.supabaseSession.user.id}</code></div>
                      <div><strong>Email:</strong> {diagnostic.supabaseSession.user.email}</div>
                      <div><strong>Email Confirmado:</strong> {diagnostic.supabaseSession.user.email_confirmed_at ? formatDate(diagnostic.supabaseSession.user.email_confirmed_at) : 'Não'}</div>
                      <div><strong>Último Login:</strong> {formatDate(diagnostic.supabaseSession.user.last_sign_in_at)}</div>
                      <div><strong>Token Expira:</strong> {formatDate(new Date(diagnostic.supabaseSession.expires_at! * 1000).toISOString())}</div>
                    </div>
                    <Separator />
                    <details>
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver user_metadata</summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(diagnostic.supabaseSession.user.user_metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <p className="text-destructive">Nenhuma sessão encontrada</p>
                )}
              </CardContent>
            </Card>

            {/* Portal User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  portal_users (banco de dados)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {diagnostic.portalUser ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><strong>ID:</strong> <code className="text-xs bg-muted p-1 rounded">{diagnostic.portalUser.id}</code></div>
                      <div><strong>user_id:</strong> <code className="text-xs bg-muted p-1 rounded">{diagnostic.portalUser.user_id}</code></div>
                      <div><strong>Email:</strong> {diagnostic.portalUser.email}</div>
                      <div><strong>Nome:</strong> {diagnostic.portalUser.full_name}</div>
                      <div><strong>Telefone:</strong> {diagnostic.portalUser.phone || 'N/A'}</div>
                      <div><strong>CPF:</strong> {diagnostic.portalUser.cpf || 'N/A'}</div>
                      <div><strong>Criado em:</strong> {formatDate(diagnostic.portalUser.created_at)}</div>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver JSON completo</summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(diagnostic.rawPortalUser, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <p className="text-destructive">Nenhum registro encontrado em portal_users</p>
                )}
              </CardContent>
            </Card>

            {/* User Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  portal_user_roles (banco de dados)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {diagnostic.userRoles.length > 0 ? (
                  <div className="space-y-2">
                    {diagnostic.userRoles.map((role) => (
                      <div key={role.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                        <Badge variant={role.role === 'admin' ? 'default' : 'secondary'}>{role.role}</Badge>
                        <span className="text-xs text-muted-foreground">ID: {role.id}</span>
                        <span className="text-xs text-muted-foreground ml-auto">Criado: {formatDate(role.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-destructive">Nenhuma role encontrada</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => navigate('/portal/login')}>
                  Ir para Login
                </Button>
                <Button variant="outline" onClick={() => navigate('/portal')}>
                  Ir para Portal Home
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    runDiagnostic();
                  }}
                >
                  Fazer Logout
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
