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
        <p className="text-slate-400">Conversas via WhatsApp e Instagram</p>
      </div>
      <div className="[&_.bg-background]:bg-slate-900/80 [&_.border]:border-slate-700/50 [&_.text-muted-foreground]:text-slate-400">
        <CrmInbox />
      </div>
    </div>
  );
}
