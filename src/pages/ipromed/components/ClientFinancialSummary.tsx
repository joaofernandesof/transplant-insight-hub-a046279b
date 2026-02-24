/**
 * CPG Advocacia Médica - Resumo Financeiro do Cliente
 * Exibe informações financeiras do cliente vinculadas ao módulo financeiro
 */

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ExternalLink,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ClientFinancialSummaryProps {
  clientId: string;
  clientName: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export function ClientFinancialSummary({ clientId, clientName }: ClientFinancialSummaryProps) {
  const navigate = useNavigate();

  // Fetch invoices for this client
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  // Calculate financial summary
  const summary = {
    total: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0),
    pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.amount || 0), 0),
    overdue: invoices.filter(inv => inv.status === 'overdue' || (inv.status === 'pending' && isPast(new Date(inv.due_date)))).reduce((sum, inv) => sum + (inv.amount || 0), 0),
    invoiceCount: invoices.length,
    paidCount: invoices.filter(inv => inv.status === 'paid').length,
    pendingCount: invoices.filter(inv => inv.status === 'pending').length,
    overdueCount: invoices.filter(inv => inv.status === 'overdue' || (inv.status === 'pending' && isPast(new Date(inv.due_date)))).length,
  };

  const paymentProgress = summary.total > 0 ? (summary.paid / summary.total) * 100 : 0;

  const getStatusBadge = (invoice: any) => {
    if (invoice.status === 'paid') {
      return <Badge className="bg-emerald-100 text-emerald-700">Pago</Badge>;
    }
    if (invoice.status === 'overdue' || (invoice.status === 'pending' && isPast(new Date(invoice.due_date)))) {
      const daysOverdue = differenceInDays(new Date(), new Date(invoice.due_date));
      return <Badge variant="destructive">{daysOverdue}d atraso</Badge>;
    }
    if (invoice.status === 'pending') {
      const daysUntil = differenceInDays(new Date(invoice.due_date), new Date());
      if (daysUntil <= 7) {
        return <Badge className="bg-amber-100 text-amber-700">Vence em {daysUntil}d</Badge>;
      }
      return <Badge variant="outline">Pendente</Badge>;
    }
    return <Badge variant="secondary">{invoice.status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Resumo Financeiro
          </CardTitle>
          <CardDescription>Honorários e pagamentos</CardDescription>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => navigate('/cpg/financial')}
          className="gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Ver Financeiro
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Recebido</span>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(summary.paid)}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">
              {summary.paidCount} fatura(s) paga(s)
            </p>
          </div>
          
          <div className={cn(
            "p-3 rounded-lg border",
            summary.overdue > 0 
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" 
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-1",
              summary.overdue > 0 
                ? "text-rose-700 dark:text-rose-400" 
                : "text-amber-700 dark:text-amber-400"
            )}>
              {summary.overdue > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">
                {summary.overdue > 0 ? 'Em Atraso' : 'Pendente'}
              </span>
            </div>
            <p className={cn(
              "text-lg font-bold",
              summary.overdue > 0 
                ? "text-rose-700 dark:text-rose-400" 
                : "text-amber-700 dark:text-amber-400"
            )}>
              {formatCurrency(summary.overdue > 0 ? summary.overdue : summary.pending)}
            </p>
            <p className={cn(
              "text-xs",
              summary.overdue > 0 
                ? "text-rose-600/70 dark:text-rose-500/70" 
                : "text-amber-600/70 dark:text-amber-500/70"
            )}>
              {summary.overdue > 0 
                ? `${summary.overdueCount} fatura(s) atrasada(s)` 
                : `${summary.pendingCount} fatura(s) pendente(s)`}
            </p>
          </div>
        </div>

        {/* Payment Progress */}
        {summary.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso de Pagamento</span>
              <span className="font-medium">{Math.round(paymentProgress)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(summary.paid)} recebido</span>
              <span>de {formatCurrency(summary.total)}</span>
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        {invoices.length > 0 ? (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Últimas Faturas
            </p>
            <div className="space-y-2">
              {invoices.slice(0, 4).map((invoice: any) => (
                <div 
                  key={invoice.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "p-1.5 rounded",
                      invoice.status === 'paid' 
                        ? "bg-emerald-100 text-emerald-600" 
                        : invoice.status === 'overdue' || (invoice.status === 'pending' && isPast(new Date(invoice.due_date)))
                          ? "bg-rose-100 text-rose-600"
                          : "bg-muted text-muted-foreground"
                    )}>
                      <Receipt className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {invoice.description || `Fatura #${invoice.invoice_number || invoice.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Venc: {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium">{formatCurrency(invoice.amount)}</span>
                    {getStatusBadge(invoice)}
                  </div>
                </div>
              ))}
            </div>
            {invoices.length > 4 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => navigate('/cpg/financial?tab=receivables')}
              >
                Ver todas as {invoices.length} faturas
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma fatura registrada</p>
            <Button 
              variant="link" 
              size="sm" 
              className="mt-1"
              onClick={() => navigate('/cpg/financial?tab=billing')}
            >
              Criar primeira cobrança
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
