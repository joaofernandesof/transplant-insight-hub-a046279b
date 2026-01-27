import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Import dashboard components (lazy load when needed)
import { Suspense, lazy } from "react";

const LegalDashboard = lazy(() => import("@/pages/neoteam/LegalDashboardPage"));

interface SharedDashboardData {
  id: string;
  token: string;
  dashboard_type: string;
  dashboard_config: Record<string, unknown>;
  title: string | null;
  description: string | null;
  password_hash: string | null;
  is_active: boolean;
  expires_at: string | null;
}

export default function PublicDashboardPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<SharedDashboardData | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token não fornecido");
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from("shared_dashboard_links")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .single();

      if (fetchError || !data) {
        setError("Dashboard não encontrado ou link expirado");
        return;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("Este link expirou");
        return;
      }

      // Check if password protected
      if (data.password_hash) {
        setPasswordRequired(true);
        setDashboardData(data as SharedDashboardData);
        return;
      }

      setDashboardData(data as SharedDashboardData);

      // Increment view count
      await supabase.rpc("increment_dashboard_view", { p_token: token });
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    if (!dashboardData) return null;

    const { dashboard_type, dashboard_config } = dashboardData;

    switch (dashboard_type) {
      case "legal-dashboard":
        return (
          <Suspense fallback={<DashboardLoader />}>
            <LegalDashboard />
          </Suspense>
        );
      
      // Adicionar outros tipos de dashboards aqui
      default:
        return (
          <Card className="max-w-lg mx-auto mt-20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <AlertTriangle className="h-12 w-12 text-warning" />
                <p className="text-muted-foreground">
                  Tipo de dashboard não suportado: {dashboard_type}
                </p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return <DashboardLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => window.location.href = "/"}
            >
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired && !dashboardData?.password_hash) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Dashboard Protegido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este dashboard requer uma senha para acesso.
            </p>
            <Input
              type="password"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="w-full">Acessar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header público */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-semibold text-lg">
                {dashboardData?.title || "Dashboard Compartilhado"}
              </h1>
              {dashboardData?.description && (
                <p className="text-xs text-muted-foreground">
                  {dashboardData.description}
                </p>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Visualização pública
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-6">
        {renderDashboard()}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Powered by NeoHub • Dashboard compartilhado externamente
        </div>
      </footer>
    </div>
  );
}

function DashboardLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    </div>
  );
}
