/**
 * Export All Tabs to Single PDF Utility
 * Captures each tab content and merges into a single PDF document
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export interface ExportAllTabsOptions {
  tabs: string[];
  tabNames: Record<string, string>;
  setActiveTab: (tab: string) => void;
  setIsExporting: (exporting: boolean) => void;
  filename: string;
  tabSelector?: string;
}

/**
 * Exports all tabs to a single merged PDF document
 */
export async function exportAllTabsToPdf({
  tabs,
  tabNames,
  setActiveTab,
  setIsExporting,
  filename,
  tabSelector = '[role="tabpanel"][data-state="active"]'
}: ExportAllTabsOptions): Promise<void> {
  setIsExporting(true);
  toast.info('Capturando todas as abas para PDF único...');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  
  let isFirstPage = true;
  
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    setActiveTab(tab);
    
    // Wait for tab content to fully render (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabDisplayName = tabNames[tab] || tab;
    toast.info(`Capturando ${tabDisplayName} (${i + 1}/${tabs.length})...`);
    
    // Find the main content area
    const contentArea = document.querySelector(tabSelector) as HTMLElement;
    
    if (!contentArea) {
      console.warn(`Tab content not found for: ${tab}`);
      continue;
    }
    
    try {
      // Capture the tab content
      const canvas = await html2canvas(contentArea, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: contentArea.scrollWidth,
        windowHeight: contentArea.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add new page if not first
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;
      
      // Add tab title header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${filename} - ${tabDisplayName}`, margin, margin + 5);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, margin + 10);
      
      // Calculate how many pages this image needs
      const headerHeight = 15;
      const availableHeight = pageHeight - (margin * 2) - headerHeight;
      let yOffset = margin + headerHeight;
      let remainingHeight = imgHeight;
      
      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, availableHeight);
        
        // Add the image slice
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          yOffset,
          imgWidth,
          sliceHeight,
          undefined,
          'FAST',
          0
        );
        
        remainingHeight -= sliceHeight;
        
        // If more content remains, add a new page
        if (remainingHeight > 0) {
          pdf.addPage();
          yOffset = margin;
        }
      }
      
    } catch (err) {
      console.error(`Error capturing tab ${tab}:`, err);
    }
    
    // Small delay between captures
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Save the merged PDF
  pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
  
  setIsExporting(false);
  toast.success('PDF completo exportado com sucesso!');
}
