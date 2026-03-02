import { supabase } from '@/integrations/supabase/client';

const FIELD_LABELS: Record<string, string> = {
  surgeryDate: 'Data da Cirurgia',
  surgeryTime: 'Horário',
  procedure: 'Procedimento',
  category: 'Categoria',
  grade: 'Grau',
  medicalRecord: 'Prontuário',
  companionName: 'Acompanhante',
  companionPhone: 'Tel. Acompanhante',
  doctorOnDuty: 'Médico Plantonista',
  scheduleStatus: 'Status',
  notes: 'Observações',
  examsSent: 'Exames Enviados',
  contractSigned: 'Contrato Assinado',
  surgeryConfirmed: 'Cirurgia Confirmada',
  guidesSent: 'Guias Enviados',
  upgradeCategory: 'Upgrade Categoria',
  upgradeValue: 'Upgrade Valor',
  upsellCategory: 'Upsell Procedimento',
  upsellValue: 'Upsell Valor',
  branch: 'Filial',
  outsourcing: 'Outsourcing',
  expectedMonth: 'Mês Previsto',
  chartReady: 'Prontuário Pronto',
  lunchChoice: 'Almoço',
  bookingTermSigned: 'Termo de Reserva',
  dischargeTermSigned: 'Termo de Alta',
  gpiD1Done: 'GPI D+1',
  d20Contact: 'Contato D-20',
  d15Contact: 'Contato D-15',
  d10Contact: 'Contato D-10',
  d7Contact: 'Contato D-7',
  d2Contact: 'Contato D-2',
  d1Contact: 'Contato D-1',
};

function formatValue(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

export async function logSurgeryChanges(
  surgeryId: string,
  updates: Record<string, any>,
  previousValues: Record<string, any>
) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    
    // Get user profile name
    let userName = user?.email || 'Usuário';
    if (user?.id) {
      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile?.name) userName = profile.name;
    }

    const entries: any[] = [];

    for (const [field, newValue] of Object.entries(updates)) {
      const oldValue = previousValues[field];
      // Skip if values are the same
      if (String(oldValue ?? '') === String(newValue ?? '')) continue;

      entries.push({
        surgery_id: surgeryId,
        user_id: user?.id,
        user_name: userName,
        action: 'updated',
        field_name: field,
        field_label: FIELD_LABELS[field] || field,
        old_value: formatValue(oldValue),
        new_value: formatValue(newValue),
      });
    }

    if (entries.length > 0) {
      await supabase.from('clinic_surgery_audit_log').insert(entries);
    }
  } catch (e) {
    console.error('Failed to log surgery change:', e);
  }
}
