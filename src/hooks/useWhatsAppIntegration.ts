import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WhatsAppSession {
  id: string;
  user_id: string;
  instance_id: string;
  session_name: string;
  status: 'disconnected' | 'connecting' | 'qr_code' | 'connected' | 'error';
  qr_code: string | null;
  qr_code_expires_at: string | null;
  phone_number: string | null;
  phone_name: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
  webhook_url: string | null;
  settings: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  session_id: string;
  message_id: string;
  remote_jid: string;
  from_me: boolean;
  contact_name: string | null;
  contact_phone: string | null;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  timestamp: string;
  status: string;
  is_group: boolean;
  group_name: string | null;
}

export interface WhatsAppContact {
  id: string;
  session_id: string;
  jid: string;
  phone: string;
  name: string | null;
  push_name: string | null;
  profile_picture_url: string | null;
  is_business: boolean;
  last_message_at: string | null;
  unread_count: number;
}

export function useWhatsAppIntegration() {
  const { user } = useAuth();
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionPolling, setConnectionPolling] = useState<ReturnType<typeof setInterval> | null>(null);

  // Fetch existing session
  const fetchSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('avivar_uazapi_instances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSession(data as unknown as WhatsAppSession | null);
      
      if (data?.qr_code) {
        setQrCode(data.qr_code);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp session:', error);
    }
  }, [user?.id]);

  // Create session and get QR code
  const createSession = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setIsConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('avivar-whatsapp/create-session', {
        method: 'POST',
      });

      if (error) throw error;

      if (data.success) {
        setSession(data.session);
        setQrCode(data.qrCode);
        
        // Start polling for connection status
        startConnectionPolling();
        
        toast.success('QR Code gerado!', {
          description: 'Escaneie com seu WhatsApp para conectar.'
        });
      } else {
        throw new Error(data.error || 'Falha ao criar sessão');
      }
    } catch (error) {
      console.error('Error creating WhatsApp session:', error);
      toast.error('Erro ao conectar WhatsApp', {
        description: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh QR code
  const refreshQRCode = async () => {
    if (!user?.id || !session) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('avivar-whatsapp/refresh-qr', {
        method: 'POST',
      });

      if (error) throw error;

      if (data.success) {
        setQrCode(data.qrCode);
        
        if (data.status === 'connected') {
          await checkConnectionStatus();
        }
      } else {
        throw new Error(data.error || 'Falha ao atualizar QR code');
      }
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      toast.error('Erro ao atualizar QR code');
    } finally {
      setIsLoading(false);
    }
  };

  // Check connection status
  const checkConnectionStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('avivar-whatsapp/check-status', {
        method: 'POST',
      });

      if (error) throw error;

      if (data.success && data.connected) {
        setSession(data.session);
        setQrCode(null);
        setIsConnecting(false);
        stopConnectionPolling();
        
        toast.success('WhatsApp conectado!', {
          description: `Conectado como ${data.session.phone_name || data.session.phone_number}`
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  };

  // Disconnect WhatsApp
  const disconnect = async () => {
    if (!user?.id || !session) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('avivar-whatsapp/disconnect', {
        method: 'POST',
      });

      if (error) throw error;

      if (data.success) {
        setSession(prev => prev ? { ...prev, status: 'disconnected' } : null);
        setQrCode(null);
        stopConnectionPolling();
        
        toast.success('WhatsApp desconectado');
      } else {
        throw new Error(data.error || 'Falha ao desconectar');
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Erro ao desconectar WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async (phone: string, message: string) => {
    if (!user?.id || !session || session.status !== 'connected') {
      toast.error('WhatsApp não está conectado');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('avivar-whatsapp/send-message', {
        method: 'POST',
        body: { phone, message },
      });

      if (error) throw error;

      if (data.success) {
        return true;
      } else {
        throw new Error(data.error || 'Falha ao enviar mensagem');
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    }
  };

  // Start polling for connection status
  const startConnectionPolling = () => {
    stopConnectionPolling(); // Clear any existing polling
    
    const interval = setInterval(async () => {
      const connected = await checkConnectionStatus();
      if (connected) {
        stopConnectionPolling();
      }
    }, 3000); // Check every 3 seconds
    
    setConnectionPolling(interval);
    
    // Auto-stop polling after 2 minutes
    setTimeout(() => {
      stopConnectionPolling();
      setIsConnecting(false);
    }, 120000);
  };

  // Stop polling
  const stopConnectionPolling = () => {
    if (connectionPolling) {
      clearInterval(connectionPolling);
      setConnectionPolling(null);
    }
  };

  // Realtime subscription for session updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('whatsapp-session')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'avivar_uazapi_instances',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('WhatsApp session update:', payload);
          if (payload.new) {
            setSession(payload.new as WhatsAppSession);
            
            if ((payload.new as WhatsAppSession).status === 'connected') {
              setQrCode(null);
              setIsConnecting(false);
              stopConnectionPolling();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConnectionPolling();
    };
  }, []);

  return {
    session,
    qrCode,
    isLoading,
    isConnecting,
    isConnected: session?.status === 'connected',
    createSession,
    refreshQRCode,
    checkConnectionStatus,
    disconnect,
    sendMessage,
    fetchSession,
  };
}
