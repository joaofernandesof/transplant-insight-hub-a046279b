/**
 * Export All Tabs to Single PDF Utility
 * Captures each tab content section-by-section to avoid page breaks
 * Each logical section fits on a single page
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
 * Finds logical sections within a tab that should each fit on their own page
 * Looks for cards, grids, and other major content blocks
 */
function findLogicalSections(container: HTMLElement): HTMLElement[] {
  // Priority: find print-section markers first, then major grid rows, then cards
  const printSections = Array.from(container.querySelectorAll('.print-section')) as HTMLElement[];
  if (printSections.length > 0) {
    return printSections;
  }
  
  // Look for direct children that are grids or major sections
  const sections: HTMLElement[] = [];
  const children = Array.from(container.children) as HTMLElement[];
  
  for (const child of children) {
    if (child.classList.contains('space-y-6') || child.classList.contains('space-y-4')) {
      // This is a container with multiple sections, get its children
      sections.push(...Array.from(child.children) as HTMLElement[]);
    } else {
      sections.push(child);
    }
  }
  
  // If we have very few sections, just return the whole container
  if (sections.length <= 1) {
    return [container];
  }
  
  return sections;
}

/**
 * Exports all tabs to a single merged PDF document
 * Each major section is fit to a single page without page breaks
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
  toast.info('Preparando exportação de todas as abas...');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const headerHeight = 15;
  const availableWidth = pageWidth - (margin * 2);
  const availableHeight = pageHeight - (margin * 2) - headerHeight;
  
  let isFirstPage = true;
  let currentTabIndex = 0;
  
  for (const tab of tabs) {
    currentTabIndex++;
    setActiveTab(tab);
    
    // Wait for tab content to fully render (1.5 seconds for charts/animations)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const tabDisplayName = tabNames[tab] || tab;
    toast.info(`Capturando ${tabDisplayName} (${currentTabIndex}/${tabs.length})...`);
    
    // Find the main content area
    const contentArea = document.querySelector(tabSelector) as HTMLElement;
    
    if (!contentArea) {
      console.warn(`Tab content not found for: ${tab}`);
      continue;
    }
    
    try {
      // Find sections within this tab
      const sections = findLogicalSections(contentArea);
      let sectionIndex = 0;
      
      for (const section of sections) {
        sectionIndex++;
        
        // Skip empty or hidden sections
        if (!section || section.offsetHeight === 0) continue;
        
        // Force scroll to section
        section.scrollIntoView({ block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Capture section with high quality
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: section.scrollWidth,
          height: section.scrollHeight,
        });
        
        // Calculate scaling to fit section on one page
        const imgAspectRatio = canvas.width / canvas.height;
        let imgWidth = availableWidth;
        let imgHeight = imgWidth / imgAspectRatio;
        
        // If height exceeds available space, scale down to fit
        if (imgHeight > availableHeight) {
          imgHeight = availableHeight;
          imgWidth = imgHeight * imgAspectRatio;
          
          // Center horizontally if scaled down
          // (will be adjusted in addImage)
        }
        
        // Add new page if not first
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;
        
        // Add header with tab name
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const sectionIndicator = sections.length > 1 ? ` (${sectionIndex}/${sections.length})` : '';
        pdf.text(`${filename} - ${tabDisplayName}${sectionIndicator}`, margin, margin + 4);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, margin + 9);
        pdf.setTextColor(0, 0, 0);
        
        // Calculate centered position
        const xPos = margin + (availableWidth - imgWidth) / 2;
        
        // Add image centered on page
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(
          imgData,
          'JPEG',
          xPos,
          margin + headerHeight,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
      }
      
    } catch (err) {
      console.error(`Error capturing tab ${tab}:`, err);
    }
    
    // Delay between tabs
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Save the PDF
  pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
  
  setIsExporting(false);
  toast.success('PDF completo exportado com sucesso!');
}

/**
 * Alternative: Export current view with smart page breaks
 * Uses CSS print-section markers
 */
export async function exportSingleViewToPdf(
  containerSelector: string,
  filename: string
): Promise<void> {
  const container = document.querySelector(containerSelector) as HTMLElement;
  if (!container) {
    toast.error('Conteúdo não encontrado');
    return;
  }
  
  toast.info('Gerando PDF...');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const availableWidth = pageWidth - (margin * 2);
  const availableHeight = pageHeight - (margin * 2);
  
  const sections = findLogicalSections(container);
  let isFirst = true;
  
  for (const section of sections) {
    if (!section || section.offsetHeight === 0) continue;
    
    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });
    
    // Scale to fit
    const imgAspectRatio = canvas.width / canvas.height;
    let imgWidth = availableWidth;
    let imgHeight = imgWidth / imgAspectRatio;
    
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = imgHeight * imgAspectRatio;
    }
    
    if (!isFirst) pdf.addPage();
    isFirst = false;
    
    const xPos = margin + (availableWidth - imgWidth) / 2;
    const yPos = margin + (availableHeight - imgHeight) / 2;
    
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      xPos,
      yPos,
      imgWidth,
      imgHeight
    );
  }
  
  pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
  toast.success('PDF exportado com sucesso!');
}
