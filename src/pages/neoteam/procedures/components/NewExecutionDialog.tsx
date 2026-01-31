/**
 * New Execution Dialog
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProcedures, useProcedureKits, useCreateExecution } from '../hooks/useProcedures';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2 } from 'lucide-react';

interface NewExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewExecutionDialog({ open, onOpenChange }: NewExecutionDialogProps) {
  const { user } = useUnifiedAuth();
  const authUserId = user?.id;
  const [clinicId, setClinicId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: clinics } = useQuery({
    queryKey: ['clinics-list'],
    queryFn: async () => {
      const { data } = await supabase.from('clinics').select('id, name');
      return data || [];
    }
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clinic_patients')
        .select('id, full_name')
        .order('full_name')
        .limit(100);
      return data || [];
    }
  });

  const { data: procedures } = useProcedures();
  const { data: kits } = useProcedureKits(procedureId || undefined);
  
  const createExecution = useCreateExecution();

  const activeKit = kits?.find(k => k.is_active);

  const handleSubmit = async () => {
    if (!clinicId || !procedureId || !authUserId) return;

    await createExecution.mutateAsync({
      clinic_id: clinicId,
      patient_id: patientId || undefined,
      procedure_id: procedureId,
      kit_id: activeKit?.id,
      executed_by: authUserId,
      notes: notes || undefined
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setClinicId('');
    setPatientId('');
    setProcedureId('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Aplicação</DialogTitle>
          <DialogDescription>
            Inicie uma nova aplicação de procedimento no paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Clínica *</Label>
            <Select value={clinicId} onValueChange={setClinicId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a clínica" />
              </SelectTrigger>
              <SelectContent>
                {clinics?.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Procedimento *</Label>
            <Select value={procedureId} onValueChange={setProcedureId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedures?.map((proc) => (
                  <SelectItem key={proc.id} value={proc.id}>
                    {proc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {procedureId && activeKit && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Kit: v{activeKit.version}</p>
              <p className="text-xs text-muted-foreground">
                {(activeKit as any).kit_items?.length || 0} itens serão carregados
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!clinicId || !procedureId || createExecution.isPending}
          >
            {createExecution.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Iniciar Aplicação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
