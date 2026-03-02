/**
 * useFinancialDashboard - Hook para dados financeiros do NeoTeam
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

export interface FinancialSummary {
  totalReceita: number;
  totalDespesa: number;
  saldo: number;
  contasVencidas: number;
  aReceberPendente: number;
  aPagarPendente: number;
  contratosAtivos: number;
  vgvTotal: number;
}

export interface MonthlyData {
  month: string;
  receita: number;
  despesa: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  color: string;
  type: 'receita' | 'despesa';
}

export interface AccountEntry {
  id: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: string;
  paid_date?: string | null;
  received_date?: string | null;
  branch?: string | null;
  supplier?: string | null;
  client_name?: string | null;
  notes?: string | null;
  type: 'payable' | 'receivable';
}

export function useFinancialDashboard(monthOffset = 0) {
  const targetDate = subMonths(new Date(), monthOffset);
  const monthStart = format(startOfMonth(targetDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd');

  // Summary KPIs
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary', monthStart],
    queryFn: async (): Promise<FinancialSummary> => {
      const [payables, receivables, contracts] = await Promise.all([
        supabase
          .from('neoteam_accounts_payable')
          .select('amount, status, due_date')
          .gte('due_date', monthStart)
          .lte('due_date', monthEnd),
        supabase
          .from('neoteam_accounts_receivable')
          .select('amount, status, due_date')
          .gte('due_date', monthStart)
          .lte('due_date', monthEnd),
        supabase
          .from('clinic_contracts')
          .select('vgv, contract_status')
          .not('contract_status', 'eq', 'distrato'),
      ]);

      const payData = payables.data || [];
      const recData = receivables.data || [];
      const contData = contracts.data || [];

      const totalDespesa = payData
        .filter(p => p.status === 'pago')
        .reduce((s, p) => s + Number(p.amount), 0);

      const totalReceita = recData
        .filter(r => r.status === 'recebido')
        .reduce((s, r) => s + Number(r.amount), 0);

      const today = format(new Date(), 'yyyy-MM-dd');

      const contasVencidas =
        payData.filter(p => p.status === 'pendente' && p.due_date < today).length +
        recData.filter(r => r.status === 'pendente' && r.due_date < today).length;

      return {
        totalReceita,
        totalDespesa,
        saldo: totalReceita - totalDespesa,
        contasVencidas,
        aReceberPendente: recData
          .filter(r => r.status === 'pendente')
          .reduce((s, r) => s + Number(r.amount), 0),
        aPagarPendente: payData
          .filter(p => p.status === 'pendente')
          .reduce((s, p) => s + Number(p.amount), 0),
        contratosAtivos: contData.length,
        vgvTotal: contData.reduce((s, c) => s + Number(c.vgv || 0), 0),
      };
    },
  });

  // Monthly trend (last 6 months)
  const { data: monthlyTrend = [], isLoading: trendLoading } = useQuery({
    queryKey: ['financial-trend'],
    queryFn: async (): Promise<MonthlyData[]> => {
      const months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const ms = format(startOfMonth(d), 'yyyy-MM-dd');
        const me = format(endOfMonth(d), 'yyyy-MM-dd');

        const [pay, rec] = await Promise.all([
          supabase
            .from('neoteam_accounts_payable')
            .select('amount')
            .eq('status', 'pago')
            .gte('due_date', ms)
            .lte('due_date', me),
          supabase
            .from('neoteam_accounts_receivable')
            .select('amount')
            .eq('status', 'recebido')
            .gte('due_date', ms)
            .lte('due_date', me),
        ]);

        months.push({
          month: format(d, 'MMM'),
          despesa: (pay.data || []).reduce((s, p) => s + Number(p.amount), 0),
          receita: (rec.data || []).reduce((s, r) => s + Number(r.amount), 0),
        });
      }
      return months;
    },
  });

  // Upcoming due
  const { data: upcoming = [], isLoading: upcomingLoading } = useQuery({
    queryKey: ['financial-upcoming'],
    queryFn: async (): Promise<AccountEntry[]> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextMonth = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const [payables, receivables] = await Promise.all([
        supabase
          .from('neoteam_accounts_payable')
          .select('*')
          .eq('status', 'pendente')
          .gte('due_date', today)
          .lte('due_date', nextMonth)
          .order('due_date')
          .limit(10),
        supabase
          .from('neoteam_accounts_receivable')
          .select('*')
          .eq('status', 'pendente')
          .gte('due_date', today)
          .lte('due_date', nextMonth)
          .order('due_date')
          .limit(10),
      ]);

      const entries: AccountEntry[] = [
        ...(payables.data || []).map(p => ({ ...p, type: 'payable' as const })),
        ...(receivables.data || []).map(r => ({ ...r, type: 'receivable' as const })),
      ];

      return entries.sort((a, b) => a.due_date.localeCompare(b.due_date));
    },
  });

  // Overdue
  const { data: overdue = [], isLoading: overdueLoading } = useQuery({
    queryKey: ['financial-overdue'],
    queryFn: async (): Promise<AccountEntry[]> => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const [payables, receivables] = await Promise.all([
        supabase
          .from('neoteam_accounts_payable')
          .select('*')
          .eq('status', 'pendente')
          .lt('due_date', today)
          .order('due_date')
          .limit(20),
        supabase
          .from('neoteam_accounts_receivable')
          .select('*')
          .eq('status', 'pendente')
          .lt('due_date', today)
          .order('due_date')
          .limit(20),
      ]);

      return [
        ...(payables.data || []).map(p => ({ ...p, type: 'payable' as const })),
        ...(receivables.data || []).map(r => ({ ...r, type: 'receivable' as const })),
      ].sort((a, b) => a.due_date.localeCompare(b.due_date));
    },
  });

  return {
    summary: summary ?? {
      totalReceita: 0, totalDespesa: 0, saldo: 0,
      contasVencidas: 0, aReceberPendente: 0, aPagarPendente: 0,
      contratosAtivos: 0, vgvTotal: 0,
    },
    monthlyTrend,
    upcoming,
    overdue,
    isLoading: summaryLoading || trendLoading || upcomingLoading || overdueLoading,
  };
}
