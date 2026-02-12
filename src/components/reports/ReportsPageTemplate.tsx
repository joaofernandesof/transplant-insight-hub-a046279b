/**
 * ReportsPageTemplate - Componente reutilizável para páginas de Relatórios
 * Usado em todos os portais do sistema
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, FileText, Download } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: string;
}

interface ReportsPageTemplateProps {
  title?: string;
  subtitle?: string;
  reports: ReportDefinition[];
  /** Render the expanded report content when a report is selected */
  renderReport?: (reportId: string) => React.ReactNode;
  /** Gradient classes for the header */
  headerGradient?: string;
  /** Header icon */
  headerIcon?: LucideIcon;
}

export function ReportsPageTemplate({
  title = 'Relatórios',
  subtitle = 'Visualize e exporte seus dados',
  reports,
  renderReport,
  headerGradient = 'from-primary to-primary/80',
  headerIcon: HeaderIcon = FileText,
}: ReportsPageTemplateProps) {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  // Group reports by category
  const categories = reports.reduce<Record<string, ReportDefinition[]>>((acc, report) => {
    if (!acc[report.category]) acc[report.category] = [];
    acc[report.category].push(report);
    return acc;
  }, {});

  const activeReportDef = reports.find(r => r.id === activeReport);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${headerGradient} rounded-2xl p-6 text-white`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <HeaderIcon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="opacity-90 text-sm">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Report Cards by Category */}
      {Object.entries(categories).map(([category, catReports]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catReports.map((report) => {
              const Icon = report.icon;
              const isActive = activeReport === report.id;
              return (
                <Card
                  key={report.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${isActive ? 'border-primary ring-1 ring-primary/30' : ''}`}
                  onClick={() => setActiveReport(isActive ? null : report.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{report.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Expanded Report View */}
      {activeReport && activeReportDef && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {activeReportDef.title}
              </CardTitle>
              <CardDescription>{activeReportDef.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setActiveReport(null)}>
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderReport ? (
              renderReport(activeReport)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um relatório para visualizar os dados</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
