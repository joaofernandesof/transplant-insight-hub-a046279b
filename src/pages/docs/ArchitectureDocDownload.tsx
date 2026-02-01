import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, CheckCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ArchitectureDocDownload() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    fetch('/docs/neohub-architecture-guide.md')
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(console.error);
  }, []);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 6;
      let y = margin;

      // Helper para adicionar texto com quebra de linha
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        
        lines.forEach((line: string) => {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight * (fontSize / 10);
        });
      };

      // Processar o markdown
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('# ')) {
          y += 5;
          addText(line.replace('# ', ''), 18, true);
          y += 3;
        } else if (line.startsWith('## ')) {
          y += 8;
          addText(line.replace('## ', ''), 14, true);
          y += 2;
        } else if (line.startsWith('### ')) {
          y += 5;
          addText(line.replace('### ', ''), 12, true);
          y += 1;
        } else if (line.startsWith('```')) {
          // Skip code block markers
          continue;
        } else if (line.startsWith('|')) {
          // Tables - simplify
          const cells = line.split('|').filter(c => c.trim());
          if (cells.length > 0 && !cells[0].includes('---')) {
            addText(cells.join(' | '), 9);
          }
        } else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
          addText('  • ' + line.replace(/- \[.\] /, ''), 10);
        } else if (line.startsWith('- ')) {
          addText('  • ' + line.replace('- ', ''), 10);
        } else if (line.startsWith('   - ')) {
          addText('    ○ ' + line.replace('   - ', ''), 9);
        } else if (line.trim() === '---') {
          y += 3;
          doc.setDrawColor(200);
          doc.line(margin, y, pageWidth - margin, y);
          y += 5;
        } else if (line.trim()) {
          addText(line.replace(/\*\*/g, '').replace(/`/g, ''), 10);
        } else {
          y += 2;
        }
      }

      // Rodapé em todas as páginas
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128);
        doc.text(`NeoHub Architecture Guide - Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.setTextColor(0);
      }

      doc.save('NeoHub-Architecture-Guide.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Guia de Arquitetura NeoHub</CardTitle>
          <CardDescription>
            Documentação completa para desenvolvimento de portais e módulos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Estrutura completa do ecossistema (10 portais)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Sistema de autenticação unificado (UnifiedAuthContext)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Guards de proteção de rotas (RBAC)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Padrões para criar novos portais e módulos</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Estrutura de banco de dados e RLS policies</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Componentes UI e tokens de design</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Checklists e exemplos práticos</span>
            </div>
          </div>

          <Button 
            onClick={generatePDF} 
            disabled={isGenerating || !content}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Baixar PDF
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Documento atualizado em 01/02/2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
