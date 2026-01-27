/**
 * Legal Print View - High-fidelity print component
 * Renders all tabs content for native browser printing
 */

import { forwardRef } from "react";
import { Scale, Star, GraduationCap, Flame, Users, HelpCircle, UserCheck, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LegalOverviewTab, 
  LegalMentorsTab, 
  LegalQuestionsTab,
  LegalStudentsTab,
  LegalFullSurveysTab,
  type LarissaMetrics,
  type LegalPerception,
  type ExamMetrics,
  type StudentWithScores
} from "./index";
import { 
  LegalWidgetInsight,
  generateLarisaOverallInsight,
  generateLegalScoreInsight,
  generateExamInsight,
  generateLeadsInsight,
} from "../LegalWidgetInsight";

interface LegalPrintViewProps {
  larisaMetrics: LarissaMetrics | null;
  legalPerception: LegalPerception | null;
  examMetrics: ExamMetrics | null;
  students: StudentWithScores[];
}

export const LegalPrintView = forwardRef<HTMLDivElement, LegalPrintViewProps>(
  ({ larisaMetrics, legalPerception, examMetrics, students }, ref) => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');

    return (
      <div ref={ref} className="print-container bg-white text-black p-8">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            .print-container {
              width: 100%;
              background: white !important;
              color: black !important;
              font-size: 11pt;
            }
            
            .print-container * {
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-section {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 20px;
            }
            
            .print-page-break {
              page-break-before: always;
              break-before: page;
            }
            
            .print-header {
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #6366f1;
            }
            
            .print-tab-title {
              background: #6366f1;
              color: white !important;
              padding: 10px 20px;
              margin: 30px 0 20px 0;
              border-radius: 8px;
              font-size: 14pt;
              font-weight: bold;
              page-break-after: avoid;
            }
            
            /* Force cards to have borders */
            .print-container [class*="Card"] {
              border: 1px solid #e5e7eb !important;
              box-shadow: none !important;
            }
            
            /* Fix grid layouts */
            .print-container .grid {
              gap: 10px !important;
            }
            
            /* Ensure badges are visible */
            .print-container [class*="Badge"] {
              border: 1px solid currentColor !important;
              padding: 2px 8px !important;
            }
            
            /* Avatar images */
            .print-container img {
              max-width: 32px;
              max-height: 32px;
            }
            
            /* Charts container */
            .recharts-wrapper {
              page-break-inside: avoid;
            }
            
            /* Hide interactive elements */
            .no-print,
            button:not(.print-keep),
            [role="tablist"],
            .animate-spin {
              display: none !important;
            }
            
            /* Expand all collapsibles */
            [data-state="closed"] {
              display: block !important;
            }
            
            [data-state="closed"] > [data-state="closed"] {
              display: block !important;
              height: auto !important;
              opacity: 1 !important;
            }
          }
          
          /* Screen preview styles */
          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              padding: 20mm;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
          }
        `}</style>

        {/* Header */}
        <div className="print-header">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl print:bg-indigo-100">
              <Scale className="h-8 w-8 text-primary print:text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Relatório Dashboard Jurídico</h1>
              <p className="text-muted-foreground text-sm print:text-gray-600">
                Análise do módulo de Direito Médico • Dra. Larissa e Dra. Caroline
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground print:text-gray-500">
            Gerado em {currentDate} às {currentTime}
          </p>
        </div>

        {/* KPI Cards Summary */}
        <div className="print-section">
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="border-l-4 border-l-violet-500">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground print:text-gray-600">Nota Geral</p>
                    <p className="text-2xl font-bold">{larisaMetrics?.overall.toFixed(1) || '-'}</p>
                  </div>
                  <Star className="h-6 w-6 text-violet-500 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 print:text-gray-600">Dra. Larissa</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground print:text-gray-600">Score Jurídico</p>
                    <p className="text-2xl font-bold">{legalPerception?.normalizedScore.toFixed(1) || '-'}</p>
                  </div>
                  <Scale className="h-6 w-6 text-amber-500 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 print:text-gray-600">Média da turma</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground print:text-gray-600">Aprovação Prova</p>
                    <p className="text-2xl font-bold">{examMetrics?.approvalRate.toFixed(0) || '-'}%</p>
                  </div>
                  <GraduationCap className="h-6 w-6 text-emerald-500 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 print:text-gray-600">Média: {examMetrics?.average.toFixed(0) || '-'}%</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground print:text-gray-600">Leads HOT</p>
                    <p className="text-2xl font-bold">{legalPerception?.leads.hot || 0}</p>
                  </div>
                  <Flame className="h-6 w-6 text-rose-500 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 print:text-gray-600">
                  {legalPerception ? Math.round((legalPerception.leads.hot / legalPerception.total) * 100) : 0}% do total
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 1: Visão Geral */}
        <div className="print-tab-title flex items-center gap-2">
          <Scale className="h-5 w-5" />
          1. Visão Geral
        </div>
        <div className="print-section">
          <LegalOverviewTab 
            larisaMetrics={larisaMetrics}
            legalPerception={legalPerception}
            examMetrics={examMetrics}
            students={students}
          />
        </div>

        {/* Section 2: Mentoras */}
        <div className="print-page-break" />
        <div className="print-tab-title flex items-center gap-2">
          <Users className="h-5 w-5" />
          2. Mentoras
        </div>
        <div className="print-section">
          <LegalMentorsTab larisaMetrics={larisaMetrics} />
        </div>

        {/* Section 3: Perguntas */}
        <div className="print-page-break" />
        <div className="print-tab-title flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          3. Análise das Perguntas
        </div>
        <div className="print-section">
          <LegalQuestionsTab 
            legalPerception={legalPerception}
            larisaMetrics={larisaMetrics}
          />
        </div>

        {/* Section 4: Alunos */}
        <div className="print-page-break" />
        <div className="print-tab-title flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          4. Alunos
        </div>
        <div className="print-section">
          <LegalStudentsTab 
            students={students}
            legalPerception={legalPerception}
          />
        </div>

        {/* Section 5: Pesquisas */}
        <div className="print-page-break" />
        <div className="print-tab-title flex items-center gap-2">
          <FileText className="h-5 w-5" />
          5. Pesquisas na Íntegra
        </div>
        <div className="print-section">
          <LegalFullSurveysTab students={students} />
        </div>

        {/* Footer */}
        <div className="print-page-break" />
        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground print:text-gray-500">
          <p>Dashboard Jurídico - NeoHub Academy</p>
          <p>Documento gerado automaticamente em {currentDate}</p>
        </div>
      </div>
    );
  }
);

LegalPrintView.displayName = 'LegalPrintView';
