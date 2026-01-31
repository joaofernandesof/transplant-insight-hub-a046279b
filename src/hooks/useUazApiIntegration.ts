/**
 * useUazApiIntegration - Hook para gerenciar integração WhatsApp via UazAPI
 * Permite criar, conectar e gerenciar instâncias de WhatsApp
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UazApiInstance {
  id: string;
  user_id: string;
  instance_id: string;
  instance_name: string;
  instance_token: string;
  status: 'disconnected' | 'connecting' | 'connected';
  phone_number: string | null;
  profile_name: string | null;
  profile_picture_url: string | null;
  is_business: boolean;
  last_sync_at: string | null;
  qr_code: string | null;
  pair_code: string | null;
  created_at: string;
  updated_at: string;
}

export function useUazApiIntegration() {
  const { user } = useAuth();
  const [instance, setInstance] = useState<UazApiInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch existing instance
  const fetchInstance = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Using raw query until types are regenerated
      const { data, error } = await supabase
        .from('avivar_uazapi_instances' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setInstance(data as unknown as UazApiInstance | null);
    } catch (error) {
      console.error('Error fetching UazAPI instance:', error);
    }
  }, [user?.id]);

  // Create new instance
  const createInstance = async (instanceName?: string): Promise<UazApiInstance | null> => {
    if (!user?.id) return null;

    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('avivar-uazapi/create-instance', {
        method: 'POST',
        body: { instanceName: instanceName || `avivar-${user.id.slice(0, 8)}` }
      });

      if (error) throw error;

      if (data.success) {
        setInstance(data.instance);
        toast.success('Instância criada com sucesso!', {
          description: 'Agora você pode conectar seu WhatsApp.'
        });
        return data.instance;
      } else {
        throw new Error(data.error || 'Falha ao criar instância');
      }
    } catch (error) {
      console.error('Error creating UazAPI instance:', error);
      toast.error('Erro ao criar instância', {
        description: (error as Error).message
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Connect instance (get QR code or pair code)
  const connectInstance = async (phone?: string): Promise<{ qrCode?: string; pairCode?: string } | null> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return null;
    }

    // First, ensure we have the latest instance data
    let currentInstance = instance;
    if (!currentInstance?.instance_token) {
      // Try to refetch instance from database
      const { data: fetchedInstance, error: fetchError } = await supabase
        .from('avivar_uazapi_instances' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError || !fetchedInstance) {
        toast.error('Nenhuma instância encontrada', {
          description: 'Crie uma instância primeiro clicando em "Criar Instância"'
        });
        return null;
      }
      
      currentInstance = fetchedInstance as unknown as UazApiInstance;
      setInstance(currentInstance);
    }

    if (!currentInstance?.instance_token) {
      toast.error('Instância inválida');
      return null;
    }

    setIsConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('avivar-uazapi/connect-instance', {
        method: 'POST',
        body: { phone }
      });

      if (error) throw error;

      if (data.success) {
        // Update local instance state
        if (data.qrCode || data.pairCode) {
          setInstance(prev => prev ? {
            ...prev,
            status: 'connecting',
            qr_code: data.qrCode || null,
            pair_code: data.pairCode || null
          } : null);
        }

        if (data.connected) {
          setInstance(prev => prev ? {
            ...prev,
            status: 'connected',
            phone_number: data.phoneNumber,
            profile_name: data.profileName
          } : null);
          toast.success('WhatsApp conectado!');
        }

        return {
          qrCode: data.qrCode,
          pairCode: data.pairCode
        };
      } else {
        throw new Error(data.error || 'Falha ao conectar');
      }
    } catch (error) {
      console.error('Error connecting UazAPI instance:', error);
      toast.error('Erro ao conectar WhatsApp', {
        description: (error as Error).message
      });
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Check instance status - returns true if connected
  const checkStatus = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    // If no instance in state, try to fetch from DB first
    let currentInstance = instance;
    if (!currentInstance?.instance_token) {
      const { data: fetchedInstance } = await supabase
        .from('avivar_uazapi_instances' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchedInstance) {
        currentInstance = fetchedInstance as unknown as UazApiInstance;
        setInstance(currentInstance);
      }
    }
    
    if (!currentInstance) return false;

    try {
      console.log('Checking UazAPI status...');
      const { data, error } = await supabase.functions.invoke('avivar-uazapi/check-status', {
        method: 'POST'
      });

      if (error) throw error;

      console.log('Status check response:', data);

      if (data.success && data.instance) {
        setInstance(data.instance);
        
        if (data.instance?.status === 'connected') {
          console.log('WhatsApp connected successfully!');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking UazAPI status:', error);
      return false;
    }
  }, [user?.id, instance]);

  // Disconnect instance
  const disconnectInstance = async () => {
    if (!user?.id || !instance) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('avivar-uazapi/disconnect-instance', {
        method: 'POST'
      });

      if (error) throw error;

      if (data.success) {
        setInstance(prev => prev ? { ...prev, status: 'disconnected' } : null);
        toast.success('WhatsApp desconectado');
      } else {
        throw new Error(data.error || 'Falha ao desconectar');
      }
    } catch (error) {
      console.error('Error disconnecting UazAPI instance:', error);
      toast.error('Erro ao desconectar');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete instance
  const deleteInstance = async () => {
    if (!user?.id || !instance) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('avivar-uazapi/delete-instance', {
        method: 'POST'
      });

      if (error) throw error;

      if (data.success) {
        setInstance(null);
        toast.success('Instância excluída');
      } else {
        throw new Error(data.error || 'Falha ao excluir');
      }
    } catch (error) {
      console.error('Error deleting UazAPI instance:', error);
      toast.error('Erro ao excluir instância');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  // Realtime subscription for status updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('uazapi-instance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'avivar_uazapi_instances' as any,
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('UazAPI instance update:', payload);
          if (payload.new) {
            setInstance(payload.new as UazApiInstance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    instance,
    isLoading,
    isCreating,
    isConnecting,
    isConnected: instance?.status === 'connected',
    createInstance,
    connectInstance,
    checkStatus,
    disconnectInstance,
    deleteInstance,
    refreshInstance: fetchInstance
  };
}
