import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { toast } from 'sonner';

export interface Patient {
  id: string;
  fullName: string;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PatientInput {
  fullName: string;
  email?: string;
  cpf?: string;
  phone?: string;
  notes?: string;
}

export function usePatients() {
  const { user } = useClinicAuth();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['clinic-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_patients')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;

      return (data || []).map((p): Patient => ({
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        cpf: p.cpf,
        phone: p.phone,
        notes: p.notes,
        createdAt: p.created_at,
      }));
    },
    enabled: !!user,
  });

  const createPatient = useMutation({
    mutationFn: async (input: PatientInput) => {
      const { data, error } = await supabase
        .from('clinic_patients')
        .insert({
          full_name: input.fullName,
          email: input.email || null,
          cpf: input.cpf || null,
          phone: input.phone || null,
          notes: input.notes || null,
          created_by: user?.userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-patients'] });
      toast.success('Paciente cadastrado com sucesso!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('CPF já cadastrado no sistema');
      } else {
        toast.error('Erro ao cadastrar paciente');
      }
    },
  });

  const updatePatient = useMutation({
    mutationFn: async ({ id, ...input }: PatientInput & { id: string }) => {
      const { data, error } = await supabase
        .from('clinic_patients')
        .update({
          full_name: input.fullName,
          email: input.email || null,
          cpf: input.cpf || null,
          phone: input.phone || null,
          notes: input.notes || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-patients'] });
      toast.success('Paciente atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar paciente');
    },
  });

  const searchPatients = (query: string) => {
    if (!query) return patients;
    const lowerQuery = query.toLowerCase();
    return patients.filter(p => 
      p.fullName.toLowerCase().includes(lowerQuery) ||
      p.cpf?.includes(query) ||
      p.phone?.includes(query)
    );
  };

  return {
    patients,
    isLoading,
    error,
    createPatient,
    updatePatient,
    searchPatients,
  };
}
