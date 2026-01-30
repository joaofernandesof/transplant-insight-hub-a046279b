/**
 * AvivarInbox - Caixa de entrada de mensagens com visual IA roxo/violeta
 */

import React from 'react';
import { CrmInbox } from '@/components/crm/CrmInbox';
import { Sparkles } from 'lucide-react';

export default function AvivarInbox() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Caixa de Entrada
          <Sparkles className="h-5 w-5 text-purple-400" />
        </h1>
        <p className="text-purple-300/60">Conversas via WhatsApp e Instagram</p>
      </div>
      <div className="[&_.bg-background]:bg-[#0f0a1e]/80 [&_.border]:border-purple-500/20">
        <CrmInbox />
      </div>
    </div>
  );
}
