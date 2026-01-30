/**
 * AvivarAnalytics - Analytics e métricas com visual IA roxo/violeta
 */

import React from 'react';
import { CrmMetricsDashboard } from '@/components/crm/CrmMetricsDashboard';
import { Sparkles } from 'lucide-react';

export default function AvivarAnalytics() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Analytics
          <Sparkles className="h-5 w-5 text-purple-400" />
        </h1>
        <p className="text-purple-300/60">Métricas e indicadores de performance</p>
      </div>
      <div className="[&_.bg-background]:bg-[#0f0a1e]/80 [&_.border]:border-purple-500/20 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-purple-300/60">
        <CrmMetricsDashboard />
      </div>
    </div>
  );
}
