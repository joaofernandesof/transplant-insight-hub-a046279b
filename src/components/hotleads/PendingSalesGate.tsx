/**
 * PendingSalesGate - Obriga licenciados a completarem dados de vendas pendentes
 * 
 * Se o usuário tem leads com outcome "vendido" mas sem sold_procedure ou sold_value,
 * ele é bloqueado até completar as informações.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const PROCEDURES = [
  'Transplante Capilar',
  'Transplante de Barba',
  'Transplante de Sobrancelhas',
  'Mesoterapia',
  'PRP',
];

interface PendingSale {
  id: string;
  name: string;
  phone: string;
  outcome_at: string | null;
}

interface PendingSalesGateProps {
  children: React.ReactNode;
}

export function PendingSalesGate({ children }: PendingSalesGateProps) {
  const { user, isAdmin: realIsAdmin } = useAuth();
  const { activeProfile } = useUnifiedAuth();
  const isAdmin = realIsAdmin && (!activeProfile || activeProfile === 'administrador');

  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [procedure, setProcedure] = useState('');
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendingSales = useCallback(async () => {
    if (!user?.id || isAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, outcome_at')
        .eq('claimed_by', user.id)
        .eq('lead_outcome', 'vendido')
        .or('sold_procedure.is.null,sold_value.is.null')
        .order('outcome_at', { ascending: true });

      if (error) throw error;
      setPendingSales((data as PendingSale[]) || []);
    } catch (err) {
      console.error('Error fetching pending sales:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isAdmin]);

  useEffect(() => {
    fetchPendingSales();
  }, [fetchPendingSales]);

  const formatCurrency = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSubmit = async () => {
    const lead = pendingSales[currentIndex];
    if (!lead || !procedure || !value) return;

    const numericValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ sold_procedure: procedure, sold_value: numericValue } as any)
        .eq('id', lead.id);

      if (error) throw error;

      toast.success(`Venda de "${lead.name}" atualizada!`);

      // Move to next or finish
      const remaining = pendingSales.filter((_, i) => i !== currentIndex);
      setPendingSales(remaining);
      setCurrentIndex(0);
      setProcedure('');
      setValue('');
    } catch (err) {
      console.error('Error updating sale:', err);
      toast.error('Erro ao salvar dados da venda');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin bypasses gate
  if (isAdmin) return <>{children}</>;
  
  // Loading state
  if (isLoading) return null;

  // No pending sales — allow access
  if (pendingSales.length === 0) return <>{children}</>;

  // Block access and show form
  const currentLead = pendingSales[currentIndex];

  return (
    <div className="flex-1 flex items-center justify-center bg-background min-h-[calc(100dvh-52px)] lg:min-h-dvh p-4">
      <Card className="w-full max-w-lg border-amber-300 dark:border-amber-700">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <CardTitle className="text-xl">Vendas Pendentes</CardTitle>
          <CardDescription className="text-base">
            Você tem <strong>{pendingSales.length}</strong> venda{pendingSales.length > 1 ? 's' : ''} sem informações completas.
            Complete os dados para continuar usando o HotLeads.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Lead info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentLead.name}</p>
              <p className="text-sm text-muted-foreground">{currentLead.phone}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentIndex + 1} de {pendingSales.length}
            </span>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pending-procedure">Procedimento vendido *</Label>
              <Select value={procedure} onValueChange={setProcedure}>
                <SelectTrigger id="pending-procedure">
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {PROCEDURES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pending-value">Valor da Venda (R$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="pending-value"
                  className="pl-10"
                  placeholder="0,00"
                  value={value}
                  onChange={(e) => setValue(formatCurrency(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!procedure || !value || isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {pendingSales.length > 1
              ? `Salvar e ir para próximo (${currentIndex + 1}/${pendingSales.length})`
              : 'Salvar e Continuar'
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
