/**
 * IPROMED Financial - Integração Bancária
 * Importação automática de extratos e conexão com qualquer banco
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Trash2,
  Edit,
  Search,
  X,
  Upload,
  FileSpreadsheet,
  History,
} from "lucide-react";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  bank: string;
  bankCode?: string;
  agency: string;
  account: string;
  type: 'checking' | 'savings' | 'payment';
  status: 'connected' | 'disconnected' | 'syncing' | 'pending';
  lastSync?: string;
  balance?: number;
  logo?: string;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
  reconciled: boolean;
}

// Lista expandida de bancos brasileiros
const brazilianBanks = [
  { code: '077', name: 'Banco Inter', logo: '🧡' },
  { code: '001', name: 'Banco do Brasil', logo: '🏦' },
  { code: '341', name: 'Itaú Unibanco', logo: '🏧' },
  { code: '237', name: 'Bradesco', logo: '💳' },
  { code: '033', name: 'Santander', logo: '🏛️' },
  { code: '104', name: 'Caixa Econômica', logo: '💰' },
  { code: '260', name: 'Nubank', logo: '💜' },
  { code: '756', name: 'Sicoob', logo: '💚' },
  { code: '748', name: 'Sicredi', logo: '💛' },
  { code: '212', name: 'Banco Original', logo: '🟢' },
  { code: '336', name: 'C6 Bank', logo: '⚫' },
  { code: '290', name: 'PagSeguro', logo: '💚' },
  { code: '380', name: 'PicPay', logo: '💚' },
  { code: '323', name: 'Mercado Pago', logo: '💙' },
  { code: '655', name: 'Neon', logo: '💙' },
  { code: '637', name: 'Sofisa Direto', logo: '🔵' },
  { code: '746', name: 'Modal', logo: '🔷' },
  { code: '208', name: 'BTG Pactual', logo: '🔵' },
  { code: '422', name: 'Safra', logo: '🔶' },
  { code: '070', name: 'BRB', logo: '🟦' },
  { code: '000', name: 'Outro Banco', logo: '🏦' },
];

const accountTypes = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Conta Poupança' },
  { value: 'payment', label: 'Conta Pagamento' },
];

const statusConfig = {
  connected: { label: 'Conectado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  disconnected: { label: 'Desconectado', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  syncing: { label: 'Sincronizando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BankIntegration() {
  const [accounts, setAccounts] = useState<BankAccount[]>([
    { 
      id: '1', 
      bank: 'Banco Inter', 
      bankCode: '077',
      agency: '0001', 
      account: '12345678-9', 
      type: 'checking', 
      status: 'connected', 
      lastSync: '2026-02-08T10:30:00', 
      balance: 156000,
      logo: '🧡'
    },
  ]);
  
  const [transactions, setTransactions] = useState<BankTransaction[]>([
    { id: '1', date: '2026-02-08', description: 'Honorários - Processo 0001234', amount: 15000, type: 'credit', category: 'Honorários', reconciled: true },
    { id: '2', date: '2026-02-07', description: 'Pagamento Fornecedor - Papelaria', amount: -450, type: 'debit', category: 'Despesas', reconciled: true },
    { id: '3', date: '2026-02-06', description: 'Honorários - Consulta Dr. Silva', amount: 2500, type: 'credit', category: 'Honorários', reconciled: false },
    { id: '4', date: '2026-02-05', description: 'Aluguel Escritório', amount: -8500, type: 'debit', category: 'Fixas', reconciled: true },
    { id: '5', date: '2026-02-04', description: 'Recebimento Cliente - Maria Santos', amount: 5000, type: 'credit', category: 'Honorários', reconciled: false },
    { id: '6', date: '2026-02-03', description: 'Internet e Telefone', amount: -350, type: 'debit', category: 'Fixas', reconciled: true },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [searchBank, setSearchBank] = useState('');
  const [newAccount, setNewAccount] = useState({
    bank: '',
    bankCode: '',
    agency: '',
    account: '',
    type: 'checking' as 'checking' | 'savings' | 'payment',
    customBankName: '',
  });

  const filteredBanks = brazilianBanks.filter(bank => 
    bank.name.toLowerCase().includes(searchBank.toLowerCase()) ||
    bank.code.includes(searchBank)
  );

  const totalBalance = accounts
    .filter(a => a.status === 'connected' && a.balance)
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const handleAddAccount = () => {
    const selectedBank = brazilianBanks.find(b => b.code === newAccount.bankCode);
    const bankName = newAccount.bankCode === '000' ? newAccount.customBankName : selectedBank?.name || '';
    
    if (!bankName || !newAccount.agency || !newAccount.account) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const account: BankAccount = {
      id: Date.now().toString(),
      bank: bankName,
      bankCode: newAccount.bankCode,
      agency: newAccount.agency,
      account: newAccount.account,
      type: newAccount.type,
      status: 'pending',
      logo: selectedBank?.logo || '🏦',
    };

    setAccounts([...accounts, account]);
    setIsAddDialogOpen(false);
    setNewAccount({ bank: '', bankCode: '', agency: '', account: '', type: 'checking', customBankName: '' });
    setSearchBank('');
    toast.success(`${bankName} adicionado com sucesso! Configure a integração para sincronizar.`);
  };

  const handleConnect = (accountId: string) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, status: 'syncing' as const };
      }
      return acc;
    }));

    // Simular conexão
    setTimeout(() => {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === accountId) {
          return { 
            ...acc, 
            status: 'connected' as const, 
            lastSync: new Date().toISOString(),
            balance: Math.floor(Math.random() * 100000) + 10000
          };
        }
        return acc;
      }));
      toast.success('Banco conectado com sucesso!');
    }, 2000);
  };

  const handleSync = (accountId: string) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, status: 'syncing' as const };
      }
      return acc;
    }));

    setTimeout(() => {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === accountId) {
          return { 
            ...acc, 
            status: 'connected' as const, 
            lastSync: new Date().toISOString()
          };
        }
        return acc;
      }));
      toast.success('Extrato sincronizado!');
    }, 1500);
  };

  const handleDisconnect = (accountId: string) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, status: 'disconnected' as const, lastSync: undefined };
      }
      return acc;
    }));
    toast.info('Banco desconectado');
  };

  const handleRemove = (accountId: string) => {
    setAccounts(accounts.filter(acc => acc.id !== accountId));
    toast.success('Conta removida');
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingAccount) return;
    setAccounts(accounts.map(acc => 
      acc.id === editingAccount.id ? editingAccount : acc
    ));
    setIsEditDialogOpen(false);
    setEditingAccount(null);
    toast.success('Conta atualizada');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Integração Bancária
          </h2>
          <p className="text-sm text-muted-foreground">
            Conecte qualquer banco brasileiro para importação automática de extratos
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Conectar Banco
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Conta Bancária</DialogTitle>
              <DialogDescription>
                Selecione seu banco e informe os dados da conta para integração
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Bank Search */}
              <div className="space-y-2">
                <Label>Banco</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar banco por nome ou código..."
                    value={searchBank}
                    onChange={(e) => setSearchBank(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {/* Bank List */}
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {filteredBanks.map(bank => (
                    <div
                      key={bank.code}
                      onClick={() => {
                        setNewAccount({ ...newAccount, bankCode: bank.code, bank: bank.name });
                        setSearchBank('');
                      }}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                        newAccount.bankCode === bank.code ? 'bg-primary/10 border-l-2 border-primary' : ''
                      }`}
                    >
                      <span className="text-2xl">{bank.logo}</span>
                      <div>
                        <p className="font-medium">{bank.name}</p>
                        <p className="text-xs text-muted-foreground">Código: {bank.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {newAccount.bankCode && (
                  <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                    <span className="text-xl">
                      {brazilianBanks.find(b => b.code === newAccount.bankCode)?.logo}
                    </span>
                    <span className="font-medium">
                      {brazilianBanks.find(b => b.code === newAccount.bankCode)?.name}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto"
                      onClick={() => setNewAccount({ ...newAccount, bankCode: '', bank: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Custom Bank Name */}
              {newAccount.bankCode === '000' && (
                <div className="space-y-2">
                  <Label>Nome do Banco</Label>
                  <Input
                    placeholder="Digite o nome do banco"
                    value={newAccount.customBankName}
                    onChange={(e) => setNewAccount({ ...newAccount, customBankName: e.target.value })}
                  />
                </div>
              )}

              {/* Account Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agência</Label>
                  <Input
                    placeholder="0001"
                    value={newAccount.agency}
                    onChange={(e) => setNewAccount({ ...newAccount, agency: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Input
                    placeholder="12345678-9"
                    value={newAccount.account}
                    onChange={(e) => setNewAccount({ ...newAccount, account: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select 
                  value={newAccount.type} 
                  onValueChange={(v) => setNewAccount({ ...newAccount, type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddAccount} disabled={!newAccount.bankCode}>
                Adicionar Conta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Balance */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Saldo Total (Contas Conectadas)</p>
              <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
              <p className="text-orange-200 text-sm mt-1">
                {accounts.filter(a => a.status === 'connected').length} conta(s) conectada(s)
              </p>
            </div>
            <Building2 className="h-12 w-12 text-orange-200" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList>
          <TabsTrigger value="accounts" className="gap-2">
            <Building2 className="h-4 w-4" />
            Contas Bancárias
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <History className="h-4 w-4" />
            Extrato
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar OFX
          </TabsTrigger>
        </TabsList>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4 mt-4">
          <div className="grid gap-4">
            {accounts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Nenhuma conta cadastrada</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione sua primeira conta bancária para começar a sincronizar extratos
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Conta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              accounts.map(account => {
                const status = statusConfig[account.status];
                const StatusIcon = status.icon;
                
                return (
                  <Card key={account.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl">
                            {account.logo || '🏦'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{account.bank}</p>
                              {account.bankCode && (
                                <span className="text-xs text-muted-foreground">({account.bankCode})</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Ag: {account.agency} | {accountTypes.find(t => t.value === account.type)?.label}: {account.account}
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
                          {account.balance !== undefined && account.status === 'connected' && (
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
                              <>
                                <Button variant="outline" size="sm" className="gap-1" onClick={() => handleSync(account.id)}>
                                  <RefreshCw className="h-3 w-3" />
                                  Sincronizar
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDisconnect(account.id)}>
                                  <Link2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {(account.status === 'disconnected' || account.status === 'pending') && (
                              <Button size="sm" className="gap-1" onClick={() => handleConnect(account.id)}>
                                <Link2 className="h-3 w-3" />
                                Conectar
                              </Button>
                            )}
                            {account.status === 'syncing' && (
                              <Button size="sm" disabled className="gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Sincronizando...
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemove(account.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Extrato Bancário</CardTitle>
                  <CardDescription>Transações importadas do banco</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Atualizar Extrato
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div 
                    key={tx.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      tx.reconciled ? 'bg-muted/50' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${tx.type === 'credit' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('pt-BR')} • {tx.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                      {tx.reconciled ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Conciliado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importar Extrato OFX/CSV
              </CardTitle>
              <CardDescription>
                Importe extratos bancários manualmente para bancos sem integração direta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Arraste seu arquivo aqui</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Suportamos arquivos OFX, CSV e CNAB
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supported Banks Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bancos com Integração Direta</CardTitle>
          <CardDescription>
            Integração via Open Finance para importação automática de extratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {brazilianBanks.slice(0, 16).map(bank => (
              <div 
                key={bank.code}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => {
                  setNewAccount({ ...newAccount, bankCode: bank.code, bank: bank.name });
                  setIsAddDialogOpen(true);
                }}
              >
                <span className="text-2xl">{bank.logo}</span>
                <span className="text-xs text-center text-muted-foreground">{bank.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input value={editingAccount.bank} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agência</Label>
                  <Input
                    value={editingAccount.agency}
                    onChange={(e) => setEditingAccount({ ...editingAccount, agency: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Input
                    value={editingAccount.account}
                    onChange={(e) => setEditingAccount({ ...editingAccount, account: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select 
                  value={editingAccount.type} 
                  onValueChange={(v) => setEditingAccount({ ...editingAccount, type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
