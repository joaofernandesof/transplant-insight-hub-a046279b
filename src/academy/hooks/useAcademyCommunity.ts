import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";

export interface CommunityMember {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  clinicName: string | null;
  tier: string | null;
  services: string[] | null;
  profilePublic: boolean;
  bio: string | null;
  instagramPersonal: string | null;
  whatsappPersonal: string | null;
}

export interface ContactRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string | null;
  message: string | null;
  createdAt: string;
  status: string;
}

export function useAcademyCommunity() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  // Fetch all students enrolled in any course
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["academy-community", user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return [];

      // Get all unique user_ids from class_enrollments (students enrolled in any class)
      const { data: enrollments, error: enrollError } = await supabase
        .from("class_enrollments")
        .select("user_id");

      if (enrollError) {
        console.error("Error fetching enrollments:", enrollError);
        return [];
      }

      // Get unique user IDs excluding the current user
      const uniqueUserIds = [...new Set(enrollments.map(e => e.user_id))]
        .filter(id => id !== user.authUserId);

      if (uniqueUserIds.length === 0) return [];

      // Batch requests to avoid query size limits
      const batchSize = 100;
      const batches: string[][] = [];
      for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        batches.push(uniqueUserIds.slice(i, i + batchSize));
      }

      // Fetch from neohub_users (source of truth) with new fields
      const neohubResults = await Promise.all(
        batches.map(batch =>
          supabase
            .from("neohub_users")
            .select("id, user_id, full_name, email, avatar_url, address_city, address_state, clinic_name, tier, services, profile_public, bio, instagram_personal, whatsapp_personal")
            .in("user_id", batch)
        )
      );

      const allUsers = neohubResults.flatMap(result => result.data || []);

      return allUsers.map((u): CommunityMember => ({
        id: u.id,
        authUserId: u.user_id,
        fullName: u.full_name || "Aluno",
        email: u.email,
        avatarUrl: u.avatar_url,
        city: u.address_city,
        state: u.address_state,
        clinicName: u.clinic_name,
        tier: u.tier,
        services: u.services,
        profilePublic: u.profile_public || false,
        bio: u.bio,
        instagramPersonal: u.instagram_personal,
        whatsappPersonal: u.whatsapp_personal,
      }));
    },
    enabled: !!user?.authUserId,
  });

  // Fetch pending contact requests received
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["pending-contact-requests", user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return [];

      const { data, error } = await supabase
        .from("contact_requests")
        .select("id, requester_id, message, created_at, status")
        .eq("target_user_id", user.authUserId)
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching pending requests:", error);
        return [];
      }

      // Get requester details from neohub_users
      const requesterIds = data.map(r => r.requester_id);
      const { data: requesters } = await supabase
        .from("neohub_users")
        .select("user_id, full_name, avatar_url")
        .in("user_id", requesterIds);

      const requesterMap = new Map((requesters || []).map(r => [r.user_id, r]));

      return data.map((r): ContactRequest => {
        const requester = requesterMap.get(r.requester_id);
        return {
          id: r.id,
          requesterId: r.requester_id,
          requesterName: requester?.full_name || "Usuário",
          requesterAvatar: requester?.avatar_url,
          message: r.message,
          createdAt: r.created_at,
          status: r.status,
        };
      });
    },
    enabled: !!user?.authUserId,
  });

  // Send message to user
  const sendMessage = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      const { error } = await supabase
        .from("community_messages")
        .insert({
          sender_id: user!.authUserId,
          recipient_id: recipientId,
          content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem enviada!");
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    },
  });

  // Respond to contact request
  const respondToRequest = useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      const { error } = await supabase
        .from("contact_requests")
        .update({
          status: accept ? "accepted" : "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: (_, { accept }) => {
      toast.success(accept ? "Solicitação aceita!" : "Solicitação recusada");
      queryClient.invalidateQueries({ queryKey: ["pending-contact-requests"] });
      queryClient.invalidateQueries({ queryKey: ["academy-community"] });
    },
    onError: (error) => {
      console.error("Error responding to request:", error);
      toast.error("Erro ao responder solicitação");
    },
  });

  // Check if current user's profile is complete
  const isProfileComplete = !!(
    user?.fullName &&
    user?.phone &&
    (user as any)?.address_city
  );

  return {
    members,
    pendingRequests,
    isLoading,
    respondToRequest: respondToRequest.mutate,
    sendMessage: sendMessage.mutate,
    isSendingMessage: sendMessage.isPending,
    isProfileComplete,
  };
}