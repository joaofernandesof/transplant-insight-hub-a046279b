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
  contactStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected';
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

  // Fetch all students enrolled in any course (from profiles + class_enrollments)
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

      const profileResults = await Promise.all(
        batches.map(batch =>
          supabase
            .from("profiles")
            .select("id, user_id, name, email, avatar_url, city, state, clinic_name, tier, services")
            .in("user_id", batch)
        )
      );

      const allProfiles = profileResults.flatMap(result => result.data || []);

      // Get contact requests for current user
      const { data: sentRequests } = await supabase
        .from("contact_requests")
        .select("target_user_id, status")
        .eq("requester_id", user.authUserId);

      const { data: receivedRequests } = await supabase
        .from("contact_requests")
        .select("requester_id, status")
        .eq("target_user_id", user.authUserId);

      const sentMap = new Map((sentRequests || []).map(r => [r.target_user_id, r.status]));
      const receivedMap = new Map((receivedRequests || []).map(r => [r.requester_id, r.status]));

      return allProfiles.map((p): CommunityMember => {
        let contactStatus: CommunityMember['contactStatus'] = 'none';
        
        if (sentMap.has(p.user_id)) {
          const status = sentMap.get(p.user_id);
          contactStatus = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'pending_sent';
        } else if (receivedMap.has(p.user_id)) {
          const status = receivedMap.get(p.user_id);
          contactStatus = status === 'accepted' ? 'accepted' : 'pending_received';
        }

        return {
          id: p.id,
          authUserId: p.user_id,
          fullName: p.name || "Aluno",
          email: p.email,
          avatarUrl: p.avatar_url,
          city: p.city,
          state: p.state,
          clinicName: p.clinic_name,
          tier: p.tier,
          services: p.services,
          contactStatus,
        };
      });
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

      // Get requester details from profiles
      const requesterIds = data.map(r => r.requester_id);
      const { data: requesters } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", requesterIds);

      const requesterMap = new Map((requesters || []).map(r => [r.user_id, r]));

      return data.map((r): ContactRequest => {
        const requester = requesterMap.get(r.requester_id);
        return {
          id: r.id,
          requesterId: r.requester_id,
          requesterName: requester?.name || "Usuário",
          requesterAvatar: requester?.avatar_url,
          message: r.message,
          createdAt: r.created_at,
          status: r.status,
        };
      });
    },
    enabled: !!user?.authUserId,
  });

  // Send contact request
  const sendContactRequest = useMutation({
    mutationFn: async ({ targetUserId, message }: { targetUserId: string; message?: string }) => {
      const { error } = await supabase
        .from("contact_requests")
        .insert({
          requester_id: user!.authUserId,
          target_user_id: targetUserId,
          message,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação de contato enviada!");
      queryClient.invalidateQueries({ queryKey: ["academy-community"] });
    },
    onError: (error) => {
      console.error("Error sending contact request:", error);
      toast.error("Erro ao enviar solicitação");
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

  return {
    members,
    pendingRequests,
    isLoading,
    sendContactRequest: sendContactRequest.mutate,
    respondToRequest: respondToRequest.mutate,
    sendMessage: sendMessage.mutate,
    isSendingRequest: sendContactRequest.isPending,
    isSendingMessage: sendMessage.isPending,
  };
}
