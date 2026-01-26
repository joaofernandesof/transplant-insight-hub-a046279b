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
    
    // Wait for tab content to fully render (1.5 seconds for charts/animations)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const tabDisplayName = tabNames[tab] || tab;
    toast.info(`Capturando ${tabDisplayName} (${i + 1}/${tabs.length})...`);
    
    // Find the main content area
    const contentArea = document.querySelector(tabSelector) as HTMLElement;
    
    if (!contentArea) {
      console.warn(`Tab content not found for: ${tab}`);
      continue;
    }
    
    try {
      // Force scroll to top before capture
      contentArea.scrollTop = 0;
      
      // Small delay after scroll reset
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Capture the tab content with full dimensions
      const canvas = await html2canvas(contentArea, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: contentArea.scrollWidth,
        height: contentArea.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: contentArea.scrollWidth,
        windowHeight: contentArea.scrollHeight,
      });
      
      // Calculate dimensions
      const imgWidth = pageWidth - (margin * 2);
      const headerHeight = 18;
      const availableHeight = pageHeight - (margin * 2) - headerHeight;
      
      // Calculate the ratio to fit width
      const ratio = imgWidth / canvas.width;
      const scaledTotalHeight = canvas.height * ratio;
      
      // Calculate how many pages this content needs
      const pagesNeeded = Math.ceil(scaledTotalHeight / availableHeight);
      
      for (let pageNum = 0; pageNum < pagesNeeded; pageNum++) {
        // Add new page if not first
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;
        
        // Add tab title header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const pageIndicator = pagesNeeded > 1 ? ` (${pageNum + 1}/${pagesNeeded})` : '';
        pdf.text(`${filename} - ${tabDisplayName}${pageIndicator}`, margin, margin + 5);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, margin + 10);
        
        // Calculate the slice of the original canvas to use
        const sliceStartY = (pageNum * availableHeight) / ratio;
        const sliceHeight = Math.min(availableHeight / ratio, canvas.height - sliceStartY);
        
        // Create a new canvas for just this slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        
        const sliceCtx = sliceCanvas.getContext('2d');
        if (sliceCtx) {
          // Draw the slice from the original canvas
          sliceCtx.drawImage(
            canvas,
            0, sliceStartY, // Source x, y
            canvas.width, sliceHeight, // Source width, height
            0, 0, // Destination x, y
            canvas.width, sliceHeight // Destination width, height
          );
          
          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
          const sliceScaledHeight = sliceHeight * ratio;
          
          // Add the sliced image to PDF
          pdf.addImage(
            sliceImgData,
            'JPEG',
            margin,
            margin + headerHeight,
            imgWidth,
            sliceScaledHeight,
            undefined,
            'FAST'
          );
        }
      }
      
    } catch (err) {
      console.error(`Error capturing tab ${tab}:`, err);
    }
    
    // Delay between tab captures
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save the merged PDF
  pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
  
  setIsExporting(false);
  toast.success('PDF completo exportado com sucesso!');
}
