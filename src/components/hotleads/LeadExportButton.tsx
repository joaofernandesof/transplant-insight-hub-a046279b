import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { HotLead } from '@/hooks/useHotLeads';

interface LeadExportButtonProps {
  leads: HotLead[];
  getClaimerName: (userId: string | null) => string;
}

export function LeadExportButton({ leads, getClaimerName }: LeadExportButtonProps) {
  const handleExport = () => {
    const rows = leads.map(l => ({
      Nome: l.name,
      Telefone: l.phone,
      Email: l.email || '',
      Estado: l.state || '',
      Cidade: l.city || '',
      Status: l.claimed_by ? 'Adquirido' : 'Disponível',
      'Adquirido por': l.claimed_by ? getClaimerName(l.claimed_by) : '',
      'Data de aquisição': l.claimed_at
        ? new Date(l.claimed_at).toLocaleDateString('pt-BR')
        : '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `hotleads-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Exportar
    </Button>
  );
}
