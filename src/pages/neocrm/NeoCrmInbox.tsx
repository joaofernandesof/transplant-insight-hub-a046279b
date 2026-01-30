import React from 'react';
import { CrmInbox } from '@/components/crm/CrmInbox';

export default function NeoCrmInbox() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Caixa de Entrada</h1>
        <p className="text-muted-foreground">Conversas via WhatsApp e Instagram</p>
      </div>
      <CrmInbox />
    </div>
  );
}
