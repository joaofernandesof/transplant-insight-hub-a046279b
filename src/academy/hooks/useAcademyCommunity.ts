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

  // Fetch all students with aluno profile
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["academy-community", user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return [];

      // Get all users with aluno profile
      const { data: profileAssignments, error: paError } = await supabase
        .from("user_profile_assignments")
        .select("user_id")
        .eq("profile_id", "15ff5857-30b9-4862-a646-ffce72c200dc"); // aluno profile

      if (paError) {
        console.error("Error fetching profile assignments:", paError);
        return [];
      }

      const userIds = profileAssignments.map(pa => pa.user_id);
      if (userIds.length === 0) return [];

      // Get neohub_users data
      const { data: users, error: usersError } = await supabase
        .from("neohub_users")
        .select("id, user_id, full_name, email, avatar_url, address_city, address_state, clinic_name, tier, services")
        .in("user_id", userIds)
        .neq("user_id", user.authUserId) // Exclude self
        .eq("is_active", true);

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return [];
      }

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

      return (users || []).map((u): CommunityMember => {
        let contactStatus: CommunityMember['contactStatus'] = 'none';
        
        if (sentMap.has(u.user_id)) {
          const status = sentMap.get(u.user_id);
          contactStatus = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'pending_sent';
        } else if (receivedMap.has(u.user_id)) {
          const status = receivedMap.get(u.user_id);
          contactStatus = status === 'accepted' ? 'accepted' : 'pending_received';
        }

        return {
          id: u.id,
          authUserId: u.user_id,
          fullName: u.full_name,
          email: u.email,
          avatarUrl: u.avatar_url,
          city: u.address_city,
          state: u.address_state,
          clinicName: u.clinic_name,
          tier: u.tier,
          services: u.services,
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

      // Get requester details
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
