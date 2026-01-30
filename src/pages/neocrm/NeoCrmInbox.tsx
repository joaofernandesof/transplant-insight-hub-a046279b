import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { CrmInbox } from '@/components/crm/CrmInbox';

export default function NeoCrmInbox() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold">Caixa de Entrada</h1>
        <p className="text-muted-foreground">Conversas via WhatsApp e Instagram</p>
      </div>
      <div className="flex-1 min-h-0">
        <CrmInbox initialLeadId={leadId || undefined} />
      </div>
    </div>
  );
}
