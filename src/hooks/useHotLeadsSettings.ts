import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface HotLeadsSettings {
  id: string;
  user_id: string;
  licensee_name: string;
  clinic_name: string;
  clinic_city: string;
}

export function useHotLeadsSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<HotLeadsSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hotleads_licensee_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as HotLeadsSettings | null);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(async (values: { licensee_name: string; clinic_name: string; clinic_city: string }) => {
    if (!user) return false;
    try {
      if (settings) {
        const { error } = await supabase
          .from('hotleads_licensee_settings')
          .update(values)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hotleads_licensee_settings')
          .insert({ ...values, user_id: user.id });
        if (error) throw error;
      }
      await fetchSettings();
      toast.success('Configurações salvas com sucesso!');
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
      return false;
    }
  }, [user, settings, fetchSettings]);

  const generateWhatsAppUrl = useCallback((leadPhone: string, leadName: string) => {
    if (!settings) return null;
    
    const phone = leadPhone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
    
    const imageUrl = `https://transplant-insight-hub.lovable.app/images/neofolic-licenca.jpeg`;
    
    const message = `Olá, ${leadName}, tudo bem?\n\nMeu nome é ${settings.licensee_name} e falo da clínica ${settings.clinic_name}.\n\nRecebemos seu contato através do seu cadastro no site da Neo Folic, onde você solicitou informações sobre transplante capilar. Somos a clínica credenciada da Neo Folic na sua região. Quero entender melhor o que você está buscando e te explicar como funciona o procedimento.\n\nVocê prefere que eu te *ligue* ou continuamos *por aqui*?\n\nSe em algum momento você preferir não receber mais mensagens, é só me avisar 😊\n\n${imageUrl}`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  }, [settings]);

  return { settings, isLoading, saveSettings, generateWhatsAppUrl };
}
