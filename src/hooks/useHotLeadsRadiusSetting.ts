import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useHotLeadsRadiusSetting() {
  const [radiusKm, setRadiusKm] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRadius = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'hotleads_radius_km')
        .maybeSingle();
      if (!error && data) {
        const val = typeof data.value === 'string' ? parseInt(data.value, 10) : Number(data.value);
        if (!isNaN(val) && val > 0) setRadiusKm(val);
      }
    } catch (e) {
      console.error('Error fetching radius setting:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRadius(); }, [fetchRadius]);

  const saveRadius = useCallback(async (newRadius: number) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value: newRadius, updated_at: new Date().toISOString() } as any)
        .eq('key', 'hotleads_radius_km');
      if (error) throw error;
      setRadiusKm(newRadius);
      return true;
    } catch (e) {
      console.error('Error saving radius:', e);
      return false;
    }
  }, []);

  return { radiusKm, isLoading, saveRadius, refetch: fetchRadius };
}
