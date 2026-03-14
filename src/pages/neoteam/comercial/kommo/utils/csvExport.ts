// ====================================
// CSV Export Utility for Kommo dashboards
// ====================================

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          // Escape quotes and wrap in quotes if contains comma/quote/newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Pre-built exports
export function exportLeadsCSV(leads: any[]) {
  exportToCSV(
    leads.map(l => ({
      ID: l.kommo_id,
      Nome: l.name || '',
      Valor: l.price || 0,
      Pipeline: l.pipeline_kommo_id || '',
      Etapa: l.stage_kommo_id || '',
      Responsável: l.responsible_user_kommo_id || '',
      Origem: l.source_name || l.source || '',
      Status: l.is_won ? 'Ganho' : l.is_lost ? 'Perdido' : 'Aberto',
      Motivo_Perda: l.loss_reason || '',
      Tags: (l.tags || []).join('; '),
      UTM_Source: l.utm_source || '',
      UTM_Medium: l.utm_medium || '',
      UTM_Campaign: l.utm_campaign || '',
      Criado_Em: l.created_at_kommo || '',
      Fechado_Em: l.closed_at || '',
    })),
    'kommo_leads'
  );
}

export function exportPerformanceCSV(users: any[]) {
  exportToCSV(
    users.map(u => ({
      Nome: u.name,
      Função: u.role || '',
      Leads_Recebidos: u.leadsReceived || u.total || 0,
      Ganhos: u.won || 0,
      Perdidos: u.lost || 0,
      Taxa_Conversão: u.conversionRate || '0',
      Receita: u.revenue || 0,
      Tarefas_OK: u.tasksCompleted || 0,
      Tarefas_Pendentes: u.tasksPending || 0,
    })),
    'kommo_performance'
  );
}
