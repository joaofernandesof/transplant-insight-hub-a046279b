import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ModuleLayout } from '@/components/ModuleLayout';
import { ResetPasswordDialog } from '@/components/ResetPasswordDialog';
import { useUsageStats, formatDuration } from '@/hooks/useUsageStats';
import { 
  Users, 
  Clock, 
  Trophy, 
  Wifi, 
  WifiOff, 
  TrendingUp,
  Calendar,
  Eye,
  Medal,
  KeyRound
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UserMonitoring() {
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const { stats, isLoading } = useUsageStats({ period });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const onlineUsers = stats.filter(s => s.is_online);
  const offlineUsers = stats.filter(s => !s.is_online);
  const totalTime = stats.reduce((acc, s) => acc + s.total_time_seconds, 0);
  const maxTime = Math.max(...stats.map(s => s.total_time_seconds), 1);

  const handleResetPassword = (user: { user_id: string; user_name: string; user_email: string }) => {
    setSelectedUser({ id: user.user_id, name: user.user_name, email: user.user_email });
    setResetPasswordOpen(true);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Monitoramento de Usuários
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe a presença e tempo de uso dos licenciados
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-700 dark:text-green-400">Online Agora</p>
                <Wifi className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{onlineUsers.length}</p>
              <p className="text-xs text-green-600 dark:text-green-400">licenciados ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 dark:from-gray-950/30 dark:to-slate-950/30 dark:border-gray-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-700 dark:text-gray-400">Offline</p>
                <WifiOff className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{offlineUsers.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">licenciados inativos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-700 dark:text-blue-400">Tempo Total</p>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatDuration(totalTime)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">de uso acumulado</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 dark:from-purple-950/30 dark:to-violet-950/30 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-700 dark:text-purple-400">Média/Usuário</p>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {stats.length > 0 ? formatDuration(Math.floor(totalTime / stats.length)) : '0m'}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">tempo médio</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="presence" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presence" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Presença
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Ranking de Uso
            </TabsTrigger>
          </TabsList>

          {/* Presence Tab */}
          <TabsContent value="presence" className="space-y-4">
            {/* Online Users */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Online Agora ({onlineUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : onlineUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum licenciado online no momento
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {onlineUsers.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || ''} className="object-cover" />
                            <AvatarFallback>{user.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.clinic_name || user.user_email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleResetPassword(user)}
                            title="Redefinir senha"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                            Online
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Offline Users */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  Offline ({offlineUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : offlineUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Todos os licenciados estão online
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {offlineUsers.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10 opacity-70">
                            <AvatarImage src={user.avatar_url || ''} className="object-cover" />
                            <AvatarFallback>{user.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-white dark:border-gray-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.last_seen_at
                              ? `Visto ${formatDistanceToNow(new Date(user.last_seen_at), { locale: ptBR, addSuffix: true })}`
                              : 'Nunca acessou'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleResetPassword(user)}
                          title="Redefinir senha"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-4">
            {/* Period Filter */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Período
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'all', label: 'Todo período' },
                      { value: 'month', label: 'Este mês' },
                      { value: 'week', label: 'Esta semana' },
                      { value: 'today', label: 'Hoje' },
                    ].map((p) => (
                      <Badge
                        key={p.value}
                        variant={period === p.value ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setPeriod(p.value as typeof period)}
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Ranking List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Ranking de Tempo de Uso
                </CardTitle>
                <CardDescription>
                  Licenciados ordenados por tempo de uso no aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : stats.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhum dado de uso registrado ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.map((user, index) => (
                      <div
                        key={user.user_id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent border-yellow-200 dark:from-yellow-950/20 dark:border-yellow-800' : ''
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {getRankBadge(index)}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || ''} className="object-cover" />
                          <AvatarFallback>{user.user_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{user.user_name}</p>
                            {user.is_online && (
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.clinic_name || user.user_email}
                          </p>
                          <div className="mt-2">
                            <Progress 
                              value={(user.total_time_seconds / maxTime) * 100} 
                              className="h-1.5" 
                            />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-primary">
                            {formatDuration(user.total_time_seconds)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.session_count} {user.session_count === 1 ? 'sessão' : 'sessões'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Password Dialog */}
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          targetUser={selectedUser}
        />
      </div>
    </ModuleLayout>
  );
}
