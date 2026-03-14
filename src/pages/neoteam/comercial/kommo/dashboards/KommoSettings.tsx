// KommoSettings - Configurações da Integração
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, RefreshCw, CheckCircle, AlertCircle, Database, Users, GitCompare, Tag, Link2 } from 'lucide-react';

export default function KommoSettings() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Configuração da conexão com o Kommo. A integração real será implementada na Fase 2.
      </p>

      {/* Status da Conexão */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Conexão com Kommo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Integração não configurada</p>
              <p className="text-xs text-muted-foreground">Configure as credenciais para iniciar a sincronização</p>
            </div>
            <Badge variant="outline" className="text-xs">Fase 2</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Domínio Kommo</Label>
              <Input placeholder="suaempresa.kommo.com" disabled />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Token de API</Label>
              <Input type="password" placeholder="••••••••••••••••" disabled />
            </div>
          </div>

          <Button disabled className="gap-2">
            <Settings className="h-4 w-4" /> Conectar
          </Button>
        </CardContent>
      </Card>

      {/* Sincronização */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: GitCompare, label: 'Funis e Etapas', status: 'pending', count: '-' },
            { icon: Users, label: 'Leads e Contatos', status: 'pending', count: '-' },
            { icon: Users, label: 'Usuários e Papéis', status: 'pending', count: '-' },
            { icon: Tag, label: 'Tags e Origens', status: 'pending', count: '-' },
            { icon: Database, label: 'Campos Customizados', status: 'pending', count: '-' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.count}</span>
              <Badge variant="outline" className="text-xs">Pendente</Badge>
            </div>
          ))}

          <Button variant="outline" disabled className="gap-2 mt-2">
            <RefreshCw className="h-4 w-4" /> Forçar Sincronização
          </Button>
        </CardContent>
      </Card>

      {/* Mapeamentos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Mapeamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Mapeie usuários do Kommo com usuários do NeoHub, configure origens, tags e campos customizados.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Usuários', 'Origens', 'Tags', 'Campos Custom.'].map(item => (
              <Button key={item} variant="outline" size="sm" className="text-xs" disabled>
                {item}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
