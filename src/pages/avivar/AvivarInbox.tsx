/**
 * AvivarInbox - Caixa de entrada de mensagens com suporte a tema claro/escuro
 * Suporta query params:
 * - ?leadId para abrir conversa específica de um lead
 * - ?phone para abrir conversa pelo telefone do contato
 */

import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CrmInbox } from '@/components/crm/CrmInbox';

export default function AvivarInbox() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const phone = searchParams.get('phone');

  // Nesta tela queremos evitar o scroll da página inteira e manter apenas os scrolls das colunas.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <div className="h-full lg:h-screen overflow-hidden flex flex-col min-h-0">
      <div className="flex-1 min-h-0 [&_.bg-background]:bg-[hsl(var(--avivar-card))] [&_.bg-card]:bg-[hsl(var(--avivar-card))] [&_.border]:border-[hsl(var(--avivar-border))] [&_.text-foreground]:text-[hsl(var(--avivar-foreground))] [&_.text-muted-foreground]:text-[hsl(var(--avivar-muted-foreground))] [&_.text-card-foreground]:text-[hsl(var(--avivar-card-foreground))]">
        <CrmInbox initialLeadId={leadId || undefined} initialPhone={phone || undefined} />
      </div>
    </div>
  );
}
