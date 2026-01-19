import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type {
  MarketplaceProfessional,
  MarketplaceUnit,
  MarketplaceLead,
  MarketplaceReview,
  MarketplaceCampaign,
  MarketplaceMetrics,
} from "../types/marketplace";

// Hook para Profissionais
export function useMarketplaceProfessionals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["marketplace-professionals", user?.id],
    queryFn: async (): Promise<MarketplaceProfessional[]> => {
      // Buscar médicos do portal
      const { data, error } = await supabase
        .from("portal_doctors")
        .select(`
          id,
          portal_user_id,
          crm,
          crm_state,
          rqe,
          specialty,
          bio,
          is_available,
          consultation_duration_minutes,
          portal_users (
            id,
            full_name,
            email,
            phone,
            avatar_url,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((doc: any) => ({
        id: doc.id,
        portalUserId: doc.portal_user_id,
        fullName: doc.portal_users?.full_name || "",
        email: doc.portal_users?.email || "",
        phone: doc.portal_users?.phone,
        avatarUrl: doc.portal_users?.avatar_url,
        crm: doc.crm,
        crmState: doc.crm_state,
        rqe: doc.rqe,
        specialty: doc.specialty,
        bio: doc.bio,
        isAvailable: doc.is_available ?? true,
        consultationDuration: doc.consultation_duration_minutes || 30,
        rating: 4.8, // Mock - seria calculado de avaliações reais
        reviewCount: 12,
        createdAt: doc.portal_users?.created_at || new Date().toISOString(),
      }));
    },
    enabled: !!user,
  });
}

// Hook para Unidades (usando clinics + profiles)
export function useMarketplaceUnits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["marketplace-units", user?.id],
    queryFn: async (): Promise<MarketplaceUnit[]> => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((clinic: any) => ({
        id: clinic.id,
        name: clinic.name,
        city: clinic.city,
        state: clinic.state,
        address: undefined,
        phone: undefined,
        email: undefined,
        description: undefined,
        imageUrl: undefined,
        isActive: true,
        professionals: [],
        rating: 4.7,
        reviewCount: 8,
        createdAt: clinic.created_at,
      }));
    },
    enabled: !!user,
  });
}

// Hook para Leads do Marketplace
export function useMarketplaceLeads() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["marketplace-leads", user?.id],
    queryFn: async (): Promise<MarketplaceLead[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((lead: any) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source || "direct",
        procedureInterest: lead.procedure_interest,
        status: mapLeadStatus(lead.status),
        responsibleId: lead.claimed_by,
        notes: lead.notes,
        scheduledAt: lead.scheduled_at,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      }));
    },
    enabled: !!user,
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status: mapStatusToDb(status) })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-leads"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  return { ...query, updateLeadStatus };
}

// Hook para Avaliações (usando portal_survey_responses + NPS)
export function useMarketplaceReviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["marketplace-reviews", user?.id],
    queryFn: async (): Promise<MarketplaceReview[]> => {
      const { data, error } = await supabase
        .from("portal_survey_responses")
        .select(`
          id,
          nps_score,
          answers,
          created_at,
          doctor_id,
          patient_id,
          portal_patients (
            portal_users (
              full_name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((response: any) => ({
        id: response.id,
        patientName: response.portal_patients?.portal_users?.full_name || "Paciente",
        professionalId: response.doctor_id,
        unitId: undefined,
        rating: response.nps_score ? Math.round(response.nps_score / 2) : 4,
        comment: (response.answers as any)?.feedback || undefined,
        reply: undefined,
        repliedAt: undefined,
        isPublic: true,
        createdAt: response.created_at,
      }));
    },
    enabled: !!user,
  });

  return query;
}

// Hook para Métricas
export function useMarketplaceMetrics(): { data: MarketplaceMetrics | undefined; isLoading: boolean } {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["marketplace-metrics", user?.id],
    queryFn: async (): Promise<MarketplaceMetrics> => {
      // Buscar leads
      const { data: leads } = await supabase.from("leads").select("*");

      // Buscar agendamentos
      const { data: appointments } = await supabase.from("portal_appointments").select("*");

      // Buscar avaliações
      const { data: reviews } = await supabase.from("portal_survey_responses").select("nps_score");

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const leadsData = leads || [];
      const appointmentsData = appointments || [];
      const reviewsData = reviews || [];

      const newLeadsThisMonth = leadsData.filter(
        (l) => new Date(l.created_at) >= startOfMonth
      ).length;

      const convertedLeads = leadsData.filter((l) => l.status === "converted").length;
      const conversionRate = leadsData.length > 0 ? (convertedLeads / leadsData.length) * 100 : 0;

      const appointmentsThisMonth = appointmentsData.filter(
        (a) => new Date(a.created_at || "") >= startOfMonth
      ).length;

      const avgRating = reviewsData.length > 0
        ? reviewsData.reduce((acc, r) => acc + (r.nps_score || 0), 0) / reviewsData.length / 2
        : 4.5;

      const reviewsThisMonth = reviewsData.filter(
        (r: any) => new Date(r.created_at) >= startOfMonth
      ).length;

      // Agrupar leads por fonte
      const leadsBySource = Object.entries(
        leadsData.reduce((acc: Record<string, number>, l) => {
          const source = l.source || "direct";
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {})
      ).map(([source, count]) => ({ source, count }));

      // Agrupar leads por status
      const leadsByStatus = Object.entries(
        leadsData.reduce((acc: Record<string, number>, l) => {
          const status = l.status || "new";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      ).map(([status, count]) => ({ status, count }));

      return {
        totalLeads: leadsData.length,
        newLeadsThisMonth,
        conversionRate,
        totalAppointments: appointmentsData.length,
        appointmentsThisMonth,
        averageRating: avgRating,
        reviewsThisMonth,
        leadsBySource,
        leadsByStatus,
      };
    },
    enabled: !!user,
  });
}

// Helpers
function mapLeadStatus(dbStatus: string | null): MarketplaceLead["status"] {
  const statusMap: Record<string, MarketplaceLead["status"]> = {
    new: "new",
    contacted: "contacted",
    scheduled: "scheduled",
    converted: "converted",
    discarded: "lost",
    lost: "lost",
  };
  return statusMap[dbStatus || "new"] || "new";
}

function mapStatusToDb(status: string): string {
  const statusMap: Record<string, string> = {
    new: "new",
    contacted: "contacted",
    scheduled: "scheduled",
    converted: "converted",
    lost: "discarded",
  };
  return statusMap[status] || "new";
}
