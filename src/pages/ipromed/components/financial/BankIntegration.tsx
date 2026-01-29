/**
 * IPROMED Financial - Integração Bancária
 * Importação automática de extratos
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Link2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings,
  Plus,
  Clock,
  Loader2,
} from "lucide-react";

interface BankAccount {
  id: string;
  bank: string;
  agency: string;
  account: string;
  type: 'checking' | 'savings';
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync?: string;
  balance?: number;
}

const mockAccounts: BankAccount[] = [
  { id: '1', bank: 'Banco do Brasil', agency: '1234-5', account: '56789-0', type: 'checking', status: 'connected', lastSync: '2026-01-29T10:30:00', balance: 156000 },
  { id: '2', bank: 'Itaú', agency: '4567', account: '12345-6', type: 'checking', status: 'disconnected' },
  { id: '3', bank: 'Bradesco', agency: '7890', account: '98765-4', type: 'savings', status: 'connected', lastSync: '2026-01-28T15:00:00', balance: 45000 },
];

const supportedBanks = [
  { name: 'Banco do Brasil', logo: '🏦' },
  { name: 'Itaú', logo: '🏧' },
  { name: 'Bradesco', logo: '💳' },
  { name: 'Santander', logo: '🏛️' },
  { name: 'Caixa', logo: '💰' },
  { name: 'Nubank', logo: '💜' },
  { name: 'Inter', logo: '🧡' },
  { name: 'Sicoob', logo: '💚' },
];

const statusConfig = {
  connected: { label: 'Conectado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  disconnected: { label: 'Desconectado', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  syncing: { label: 'Sincronizando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BankIntegration() {
  const totalBalance = mockAccounts
    .filter(a => a.status === 'connected' && a.balance)
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Integração Bancária
          </h2>
          <p className="text-sm text-muted-foreground">
            Importação automática de extratos para manter o financeiro sempre atualizado
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Conectar Banco
        </Button>
      </div>

      {/* Total Balance */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Saldo Total (Contas Conectadas)</p>
              <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            <Building2 className="h-12 w-12 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Contas Bancárias</h3>
        
        <div className="grid gap-4">
          {mockAccounts.map(account => {
            const status = statusConfig[account.status];
            const StatusIcon = status.icon;
            
            return (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl">
                        🏦
                      </div>
                      <div>
                        <p className="font-semibold">{account.bank}</p>
                        <p className="text-sm text-muted-foreground">
                          Ag: {account.agency} | CC: {account.account}
                        </p>
                        {account.lastSync && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Última sync: {new Date(account.lastSync).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {account.balance && (
                        <p className="text-xl font-bold text-emerald-600">
                          {formatCurrency(account.balance)}
                        </p>
                      )}
                      
                      <Badge className={`gap-1 ${status.color}`}>
                        <StatusIcon className={`h-3 w-3 ${account.status === 'syncing' ? 'animate-spin' : ''}`} />
                        {status.label}
                      </Badge>
                      
                      <div className="flex gap-2">
                        {account.status === 'connected' && (
                          <Button variant="outline" size="sm" className="gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Sincronizar
                          </Button>
                        )}
                        {account.status === 'disconnected' && (
                          <Button size="sm" className="gap-1">
                            <Link2 className="h-3 w-3" />
                            Reconectar
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Supported Banks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bancos Suportados</CardTitle>
          <CardDescription>
            Integração via Open Banking para importação automática de extratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {supportedBanks.map(bank => (
              <div 
                key={bank.name}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <span className="text-2xl">{bank.logo}</span>
                <span className="text-xs text-center text-muted-foreground">{bank.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Configuração Pendente</p>
              <p className="text-sm text-amber-700">
                A integração bancária via Open Banking requer configuração adicional no portal do Conta Azul ou 
                autorização direta no app do banco. Entre em contato com o suporte para ativar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
