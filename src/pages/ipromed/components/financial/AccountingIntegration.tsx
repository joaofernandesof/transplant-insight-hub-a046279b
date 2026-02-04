/**
 * CPG Advocacia Médica Financial - Integração Contábil
 * Exportação organizada para o contador
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ExportItem {
  id: string;
  name: string;
  description: string;
  lastExport?: string;
  status: 'ready' | 'pending' | 'exported';
}

const exportItems: ExportItem[] = [
  { id: '1', name: 'Livro Caixa', description: 'Entradas e saídas do período', lastExport: '2026-01-15', status: 'exported' },
  { id: '2', name: 'Relatório de Honorários', description: 'Todos os recebimentos discriminados', lastExport: '2026-01-15', status: 'exported' },
  { id: '3', name: 'Relatório de Despesas', description: 'Despesas por categoria e centro de custo', lastExport: '2026-01-15', status: 'exported' },
  { id: '4', name: 'Notas Fiscais Emitidas', description: 'XML e PDF das NFS-e do período', status: 'ready' },
  { id: '5', name: 'Conciliação Bancária', description: 'Extrato conciliado com lançamentos', status: 'pending' },
  { id: '6', name: 'Relatório de Retenções', description: 'ISS, IR e outras retenções', status: 'ready' },
];

const chartOfAccounts = [
  { code: '1.1.1', name: 'Caixa Geral', type: 'Ativo' },
  { code: '1.1.2', name: 'Bancos c/ Movimento', type: 'Ativo' },
  { code: '3.1.1', name: 'Receita de Honorários', type: 'Receita' },
  { code: '3.1.2', name: 'Receita de Consultas', type: 'Receita' },
  { code: '3.1.3', name: 'Receita de Pareceres', type: 'Receita' },
  { code: '4.1.1', name: 'Despesas com Pessoal', type: 'Despesa' },
  { code: '4.1.2', name: 'Pró-labore', type: 'Despesa' },
  { code: '4.2.1', name: 'Custas Processuais', type: 'Despesa' },
  { code: '4.2.2', name: 'Peritos', type: 'Despesa' },
  { code: '4.2.3', name: 'Correspondentes', type: 'Despesa' },
];

const statusConfig = {
  ready: { label: 'Pronto', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  exported: { label: 'Exportado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
};

export default function AccountingIntegration() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [period, setPeriod] = useState('2026-01');

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    toast.success(`${selectedItems.length} arquivo(s) exportado(s) com sucesso!`);
    setSelectedItems([]);
  };

  const handleSendToAccountant = () => {
    toast.success('Documentos enviados para o contador!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-cyan-600" />
            Integração Contábil
          </h2>
          <p className="text-sm text-muted-foreground">
            Exportação organizada para o contador, reduzindo idas e vindas
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-01">Janeiro/2026</SelectItem>
              <SelectItem value="2025-12">Dezembro/2025</SelectItem>
              <SelectItem value="2025-11">Novembro/2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Export Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Documentos para Exportação</CardTitle>
              <CardDescription>Selecione os relatórios para exportar</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                disabled={selectedItems.length === 0}
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Exportar ({selectedItems.length})
              </Button>
              <Button 
                className="gap-2"
                onClick={handleSendToAccountant}
              >
                <Send className="h-4 w-4" />
                Enviar ao Contador
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exportItems.map(item => {
              const status = statusConfig[item.status];
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.lastExport && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Último: {format(new Date(item.lastExport), "dd/MM/yyyy")}
                      </span>
                    )}
                    <Badge className={`gap-1 ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chart of Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Plano de Contas Padrão
          </CardTitle>
          <CardDescription>
            Mapeamento entre categorias do sistema e plano de contas contábil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartOfAccounts.map(account => (
              <div 
                key={account.code}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{account.code}</span>
                  <span className="text-sm">{account.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {account.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Dica de Integração</p>
              <p className="text-sm text-blue-700">
                Para integração automática com sistemas contábeis como Conta Azul, Omie ou Domínio, 
                entre em contato com o suporte. Podemos configurar a exportação direta via API, 
                eliminando a necessidade de envio manual de arquivos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
