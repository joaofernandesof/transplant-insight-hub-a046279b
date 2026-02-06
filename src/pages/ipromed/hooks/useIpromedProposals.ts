/**
 * Hook para gerenciamento de propostas comerciais CPG
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Proposal {
  id: string;
  proposal_code: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  plan_name: string;
  plan_subtitle: string | null;
  monthly_value: number;
  original_value: number;
  intermediate_value: number;
  conditions: string[];
  custom_conditions: string[];
  services: string[];
  documents: string[];
  documents_included: string;
  intro_message: string | null;
  closing_message: string | null;
  status: string;
  validity_days: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
}

export interface CreateProposalInput {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  plan_name: string;
  plan_subtitle?: string;
  monthly_value: number;
  original_value?: number;
  intermediate_value?: number;
  conditions?: string[];
  custom_conditions?: string[];
  services?: string[];
  documents?: string[];
  documents_included?: string;
  intro_message?: string;
  closing_message?: string;
  status?: string;
  validity_days?: number;
}

async function generateProposalCode(): Promise<string> {
  const { data, error } = await (supabase as any)
    .from("ipromed_proposals")
    .select("proposal_code")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastCode = data[0].proposal_code;
    const match = lastCode.match(/PROP_(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `PROP_${String(nextNumber).padStart(4, "0")}`;
}

export function useProposals(searchQuery?: string) {
  return useQuery({
    queryKey: ["ipromed-proposals", searchQuery],
    queryFn: async () => {
      let query = (supabase as any)
        .from("ipromed_proposals")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(
          `client_name.ilike.%${searchQuery}%,proposal_code.ilike.%${searchQuery}%,plan_name.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Proposal[];
    },
  });
}

export function useProposal(id: string | undefined) {
  return useQuery({
    queryKey: ["ipromed-proposal", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from("ipromed_proposals")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Proposal;
    },
    enabled: !!id,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      const proposal_code = await generateProposalCode();
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await (supabase as any)
        .from("ipromed_proposals")
        .insert({
          ...input,
          proposal_code,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposals"] });
      toast.success("Proposta criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar proposta: " + error.message);
    },
  });
}

export function useUpdateProposal(options?: { silent?: boolean }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Proposal> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("ipromed_proposals")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposal", data.id] });
      if (!options?.silent) {
        toast.success("Proposta atualizada!");
      }
    },
    onError: (error) => {
      toast.error("Erro ao atualizar proposta: " + error.message);
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("ipromed_proposals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposals"] });
      toast.success("Proposta excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir proposta: " + error.message);
    },
  });
}

export function useSendProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, validityDays = 15 }: { id: string; validityDays?: number }) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

      const { data, error } = await (supabase as any)
        .from("ipromed_proposals")
        .update({
          status: "sent",
          sent_at: now.toISOString(),
          validity_days: validityDays,
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposal", data.id] });
      toast.success("Proposta enviada! Validade de " + data.validity_days + " dias.");
    },
    onError: (error) => {
      toast.error("Erro ao enviar proposta: " + error.message);
    },
  });
}

export function useAcceptProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from("ipromed_proposals")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposal", data.id] });
      toast.success("Proposta marcada como aceita!");
    },
    onError: (error) => {
      toast.error("Erro ao aceitar proposta: " + error.message);
    },
  });
}

export function useRejectProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from("ipromed_proposals")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["ipromed-proposal", data.id] });
      toast.success("Proposta marcada como recusada.");
    },
    onError: (error) => {
      toast.error("Erro ao recusar proposta: " + error.message);
    },
  });
}
