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
    
    const message = `Olá, ${leadName}, tudo bem?\n\nSou ${settings.licensee_name} e falo da clínica ${settings.clinic_name}, localizada em ${settings.clinic_city}!\n\nSomos uma clínica credenciada à *Licença Neo Folic* de Transplante Capilar e recebemos o seu cadastro através do site da Neo Folic para receber mais informações sobre procedimentos capilares.\n\nVocê prefere que eu te *ligue* ou continuamos *por aqui*?`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  }, [settings]);

  return { settings, isLoading, saveSettings, generateWhatsAppUrl };
}
