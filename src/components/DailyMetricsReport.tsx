import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles } from 'lucide-react';
import { DailyMetricsReportPreview } from './DailyMetricsReportPreview';

interface DailyMetricsReportProps {
  currentWeekNumber: number;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  clinicName?: string;
}

export function DailyMetricsReport({
  currentWeekNumber,
  getWeekValues,
  clinicName = 'Clínica'
}: DailyMetricsReportProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsPreviewOpen(true)}
        variant="default"
        size="sm"
        className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
      >
        <Sparkles className="w-4 h-4" />
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">Relatório PDF</span>
      </Button>

      <DailyMetricsReportPreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        currentWeekNumber={currentWeekNumber}
        getWeekValues={getWeekValues}
        clinicName={clinicName}
      />
    </>
  );
}
