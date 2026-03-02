import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SurgeryAuditEntry {
  id: string;
  surgery_id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  field_name: string | null;
  field_label: string | null;
  old_value: string | null;
  new_value: string | null;
  changes: Record<string, any> | null;
  created_at: string;
}

export function useSurgeryAuditLog(surgeryId: string | undefined) {
  const [logs, setLogs] = useState<SurgeryAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!surgeryId) {
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clinic_surgery_audit_log')
        .select('*')
        .eq('surgery_id', surgeryId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setLogs(data as SurgeryAuditEntry[]);
      }
      setIsLoading(false);
    };

    fetchLogs();
  }, [surgeryId]);

  return { logs, isLoading };
}
