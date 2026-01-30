import React from 'react';
import { CrmMetricsDashboard } from '@/components/crm/CrmMetricsDashboard';

export default function NeoCrmAnalytics() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Métricas e indicadores de performance</p>
      </div>
      <CrmMetricsDashboard />
    </div>
  );
}
