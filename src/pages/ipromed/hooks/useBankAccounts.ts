/**
 * Hook for managing Bank Accounts and Transactions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { CACHE_TIMES } from '@/lib/queryClient';

export interface BankAccount {
  id: string;
  user_id: string;
  bank_code: string;
  bank_name: string;
  agency: string;
  account_number: string;
  account_type: 'corrente' | 'poupanca' | 'pagamento';
  account_holder?: string;
  balance: number;
  last_sync_at?: string;
  is_active: boolean;
  integration_provider?: string;
  integration_id?: string;
  integration_status: 'manual' | 'pending' | 'connected' | 'error';
  integration_error?: string;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  user_id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: 'credit' | 'debit';
  category?: string;
  reconciliation_status: 'pending' | 'matched' | 'partial' | 'ignored';
  matched_payable_id?: string;
  matched_receivable_id?: string;
  matched_at?: string;
  matched_by?: string;
  import_source?: string;
  external_id?: string;
  raw_data?: any;
  created_at: string;
}

export type BankAccountInsert = Omit<BankAccount, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'balance' | 'integration_status'>;
export type BankTransactionInsert = Omit<BankTransaction, 'id' | 'user_id' | 'created_at' | 'reconciliation_status'>;

const ACCOUNTS_QUERY_KEY = ['ipromed-bank-accounts'];
const TRANSACTIONS_QUERY_KEY = ['ipromed-bank-transactions'];

export function useBankAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error, refetch } = useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!user,
    ...CACHE_TIMES.MEDIUM,
  });

  const createMutation = useMutation({
    mutationFn: async (account: BankAccountInsert) => {
      const { data, error } = await supabase
        .from('ipromed_bank_accounts')
        .insert({
          ...account,
          user_id: user!.id,
          balance: 0,
          integration_status: 'manual',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      toast.success('Conta bancária cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BankAccountInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from('ipromed_bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      toast.success('Conta atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ipromed_bank_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      toast.success('Conta excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ id, balance }: { id: string; balance: number }) => {
      const { data, error } = await supabase
        .from('ipromed_bank_accounts')
        .update({ 
          balance,
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      toast.success('Saldo atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar saldo: ${error.message}`);
    },
  });

  const totalBalance = accounts
    .filter(a => a.is_active)
    .reduce((sum, a) => sum + Number(a.balance), 0);

  return {
    accounts,
    isLoading,
    error,
    refetch,
    totalBalance,
    createAccount: createMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    updateBalance: updateBalanceMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useBankTransactions(accountId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, accountId],
    queryFn: async () => {
      let query = supabase
        .from('ipromed_bank_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      
      if (accountId) {
        query = query.eq('bank_account_id', accountId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!user,
    ...CACHE_TIMES.SHORT,
  });

  const importTransactionsMutation = useMutation({
    mutationFn: async (transactionsToImport: BankTransactionInsert[]) => {
      const { data, error } = await supabase
        .from('ipromed_bank_transactions')
        .insert(
          transactionsToImport.map(t => ({
            ...t,
            user_id: user!.id,
            reconciliation_status: 'pending',
          }))
        )
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      toast.success(`${data.length} transações importadas!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async ({ 
      transactionId, 
      payableId, 
      receivableId 
    }: { 
      transactionId: string; 
      payableId?: string; 
      receivableId?: string;
    }) => {
      const { data, error } = await supabase
        .from('ipromed_bank_transactions')
        .update({
          reconciliation_status: 'matched',
          matched_payable_id: payableId,
          matched_receivable_id: receivableId,
          matched_at: new Date().toISOString(),
          matched_by: user!.id,
        })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      toast.success('Transação conciliada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao conciliar: ${error.message}`);
    },
  });

  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.reconciliation_status === 'pending').length,
    matched: transactions.filter(t => t.reconciliation_status === 'matched').length,
    credits: transactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    debits: transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  };

  return {
    transactions,
    isLoading,
    error,
    refetch,
    stats,
    importTransactions: importTransactionsMutation.mutateAsync,
    reconcile: reconcileMutation.mutateAsync,
    isImporting: importTransactionsMutation.isPending,
    isReconciling: reconcileMutation.isPending,
  };
}

// OFX Parser utility
export function parseOFX(content: string): BankTransactionInsert[] {
  const transactions: BankTransactionInsert[] = [];
  
  // Simple OFX parser - extracts STMTTRN elements
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  const matches = content.matchAll(stmttrnRegex);
  
  for (const match of matches) {
    const block = match[1];
    
    const getValue = (tag: string): string => {
      const regex = new RegExp(`<${tag}>([^<\\n]+)`, 'i');
      const result = block.match(regex);
      return result ? result[1].trim() : '';
    };
    
    const trntype = getValue('TRNTYPE');
    const dtposted = getValue('DTPOSTED');
    const trnamt = getValue('TRNAMT');
    const fitid = getValue('FITID');
    const memo = getValue('MEMO') || getValue('NAME');
    
    if (dtposted && trnamt) {
      const amount = Math.abs(parseFloat(trnamt.replace(',', '.')));
      const isCredit = trntype === 'CREDIT' || parseFloat(trnamt.replace(',', '.')) > 0;
      
      // Parse date YYYYMMDD to YYYY-MM-DD
      const year = dtposted.slice(0, 4);
      const month = dtposted.slice(4, 6);
      const day = dtposted.slice(6, 8);
      
      transactions.push({
        bank_account_id: '', // Will be set when importing
        transaction_date: `${year}-${month}-${day}`,
        description: memo || 'Transação importada',
        amount,
        transaction_type: isCredit ? 'credit' : 'debit',
        import_source: 'ofx',
        external_id: fitid,
        raw_data: { trntype, dtposted, trnamt, fitid, memo },
      });
    }
  }
  
  return transactions;
}
