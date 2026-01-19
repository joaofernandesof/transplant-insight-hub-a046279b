import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNeoHubAuth, NeoHubProfile, PROFILE_NAMES, PROFILE_ROUTES } from '../contexts/NeoHubAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Briefcase, GraduationCap, User, ChevronRight, LogOut, Shield, TrendingUp } from 'lucide-react';
import logoNeofolic from '@/assets/logo-byneofolic.png';

const PROFILE_ICONS: Record<NeoHubProfile, React.ElementType> = {
  administrador: Shield,
  paciente: Heart,
  colaborador: Briefcase,
  aluno: GraduationCap,
  licenciado: User,
  cliente_avivar: TrendingUp,
};

const PROFILE_COLORS: Record<NeoHubProfile, string> = {
  administrador: 'bg-red-500',
  paciente: 'bg-rose-500',
  colaborador: 'bg-blue-500',
  aluno: 'bg-amber-500',
  licenciado: 'bg-emerald-500',
  cliente_avivar: 'bg-orange-500',
};

const PROFILE_DESCRIPTIONS: Record<NeoHubProfile, string> = {
  administrador: 'Acesso total ao sistema e configurações',
  paciente: 'Acesse seus agendamentos, histórico e documentos médicos',
  colaborador: 'Gerencie pacientes, agenda e operações da clínica',
  aluno: 'Cursos, materiais e certificados da Ibramed Academy',
  licenciado: 'Dashboard completo da sua clínica licenciada',
  cliente_avivar: 'Marketing, leads e crescimento do seu negócio',
};

export default function ProfileSelector() {
  const navigate = useNavigate();
  const { user, setActiveProfile, logout } = useNeoHubAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSelectProfile = (profile: NeoHubProfile) => {
    setActiveProfile(profile);
    navigate(PROFILE_ROUTES[profile]);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <img 
          src={logoNeofolic} 
          alt="NeoHub" 
          className="h-8 w-auto dark:invert"
        />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">Olá, {user.fullName.split(' ')[0]}!</CardTitle>
            <CardDescription>
              Selecione o portal que deseja acessar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {user.profiles.map(profile => {
              const Icon = PROFILE_ICONS[profile];
              return (
                <button
                  key={profile}
                  onClick={() => handleSelectProfile(profile)}
                  className="w-full p-4 rounded-xl border-2 border-border hover:border-primary transition-all flex items-center gap-4 text-left group hover:bg-muted/50"
                >
                  <div className={`p-3 rounded-lg ${PROFILE_COLORS[profile]} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {PROFILE_NAMES[profile]}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {PROFILE_DESCRIPTIONS[profile]}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              );
            })}

            {user.isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary transition-all flex items-center gap-4 text-left group hover:bg-muted/50"
              >
                <div className="p-3 rounded-lg bg-purple-500 text-white">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    Painel Admin
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Gestão completa do sistema
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NeoHub by NeoFolic. Todos os direitos reservados.
      </footer>
    </div>
  );
}
