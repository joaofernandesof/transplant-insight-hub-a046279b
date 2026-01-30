/**
 * Etapa 11: Integração Google Calendar
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle2, XCircle, Shield, Zap, Bell, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepCalendarProps {
  calendarEmail: string;
  calendarConnected: boolean;
  onChange: (email: string, connected: boolean) => void;
}

export function StepCalendar({ calendarEmail, calendarConnected, onChange }: StepCalendarProps) {
  const handleConnect = () => {
    // In a real implementation, this would trigger OAuth flow
    // For now, we'll just simulate a connection if email is provided
    if (calendarEmail && calendarEmail.includes('@')) {
      onChange(calendarEmail, true);
    }
  };

  const handleDisconnect = () => {
    onChange('', false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Conecte seu Google Calendar
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Sincronize agendamentos automaticamente (opcional)
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Benefits */}
        <Card className="bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <h4 className="font-medium text-[hsl(var(--avivar-foreground))] mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Benefícios da integração:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: Zap, text: 'Agendamentos automáticos' },
                { icon: Clock, text: 'Verificação de disponibilidade em tempo real' },
                { icon: Bell, text: 'Notificações de novos agendamentos' },
                { icon: Shield, text: 'Evita duplos agendamentos' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <item.icon className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  {item.text}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Connection status */}
        {!calendarConnected ? (
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[hsl(var(--avivar-foreground))]">Não conectado</span>
              </div>

              {/* Email input */}
              <div className="space-y-2">
                <Label htmlFor="calendarEmail" className="text-[hsl(var(--avivar-foreground))]">
                  Email do Google Calendar
                </Label>
                <Input
                  id="calendarEmail"
                  type="email"
                  value={calendarEmail}
                  onChange={(e) => onChange(e.target.value, false)}
                  placeholder="seuemail@gmail.com"
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
                />
              </div>

              <Button
                onClick={handleConnect}
                disabled={!calendarEmail || !calendarEmail.includes('@')}
                className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Conectar com Google Calendar
              </Button>

              <p className="text-xs text-center text-[hsl(var(--avivar-muted-foreground))]">
                Você será redirecionado para login Google
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.3)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-[hsl(var(--avivar-foreground))]">Conectado</span>
              </div>

              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                Conectado como: <strong>{calendarEmail}</strong>
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnect}
                  className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconectar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permissions info */}
        <Alert className="bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))]">
          <Shield className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
          <AlertDescription className="text-[hsl(var(--avivar-foreground))]">
            <strong>Permissões solicitadas:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Ver eventos do calendário</li>
              <li>• Criar novos eventos</li>
              <li>• Modificar eventos criados pela aplicação</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
