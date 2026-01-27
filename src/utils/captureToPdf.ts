/**
 * High-Fidelity PDF Export using html2canvas
 * Captures the exact visual representation of the screen
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export interface CaptureOptions {
  element: HTMLElement;
  filename: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  scale?: number;
  onProgress?: (step: string) => void;
}

/**
 * Captures an element exactly as rendered and exports to PDF
 */
export async function captureElementToPdf({
  element,
  filename,
  title,
  subtitle,
  orientation = 'portrait',
  scale = 2,
  onProgress
}: CaptureOptions): Promise<void> {
  try {
    onProgress?.('Preparando captura...');
    
    // Clone element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Apply print-friendly styles to clone
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = element.scrollWidth + 'px';
    clone.style.backgroundColor = 'white';
    document.body.appendChild(clone);
    
    // Expand all collapsibles in clone
    expandAllCollapsibles(clone);
    
    // Wait for any animations/transitions
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onProgress?.('Capturando conteúdo...');
    
    // Capture with html2canvas
    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });
    
    // Remove clone
    document.body.removeChild(clone);
    
    onProgress?.('Gerando PDF...');
    
    // Create PDF with proper dimensions
    const isLandscape = orientation === 'landscape';
    const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const headerHeight = title ? 20 : 0;
    
    const availableWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - (margin * 2) - headerHeight;
    
    // Calculate image dimensions to fit page while maintaining aspect ratio
    const imgAspectRatio = canvas.width / canvas.height;
    let imgWidth = availableWidth;
    let imgHeight = imgWidth / imgAspectRatio;
    
    // If content is taller than available height, we need to paginate
    const totalPages = Math.ceil(imgHeight / availableHeight);
    
    if (totalPages === 1) {
      // Single page - center content
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * imgAspectRatio;
      }
      
      // Add header if provided
      if (title) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, margin + 8);
        if (subtitle) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(subtitle, margin, margin + 14);
          pdf.setTextColor(0, 0, 0);
        }
      }
      
      const xPos = margin + (availableWidth - imgWidth) / 2;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', xPos, margin + headerHeight, imgWidth, imgHeight);
      
    } else {
      // Multi-page - slice the canvas
      const sliceHeight = Math.floor(canvas.height / totalPages);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        
        // Add header on each page
        if (title) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(title, margin, margin + 8);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Página ${page + 1} de ${totalPages}`, pageWidth - margin - 30, margin + 8);
          pdf.setTextColor(0, 0, 0);
        }
        
        // Create a canvas slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = page === totalPages - 1 
          ? canvas.height - (sliceHeight * page) 
          : sliceHeight;
        
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, page * sliceHeight,
            canvas.width, sliceCanvas.height,
            0, 0,
            canvas.width, sliceCanvas.height
          );
        }
        
        // Calculate dimensions for this slice
        const sliceAspectRatio = sliceCanvas.width / sliceCanvas.height;
        let sliceImgWidth = availableWidth;
        let sliceImgHeight = sliceImgWidth / sliceAspectRatio;
        
        if (sliceImgHeight > availableHeight) {
          sliceImgHeight = availableHeight;
          sliceImgWidth = sliceImgHeight * sliceAspectRatio;
        }
        
        const xPos = margin + (availableWidth - sliceImgWidth) / 2;
        const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', xPos, margin + headerHeight, sliceImgWidth, sliceImgHeight);
      }
    }
    
    // Save using blob for better compatibility
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    
    toast.success('PDF exportado com sucesso!');
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Erro ao exportar PDF. Tente novamente.');
    throw error;
  }
}

/**
 * Captures multiple tabs/sections to a single PDF
 */
export async function captureMultipleTabsToPdf({
  tabs,
  tabNames,
  setActiveTab,
  getTabContent,
  filename,
  title,
  onProgress
}: {
  tabs: string[];
  tabNames: Record<string, string>;
  setActiveTab: (tab: string) => void;
  getTabContent: () => HTMLElement | null;
  filename: string;
  title: string;
  onProgress?: (step: string) => void;
}): Promise<void> {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const headerHeight = 20;
    const availableWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - (margin * 2) - headerHeight;
    
    let isFirstPage = true;
    
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabName = tabNames[tab] || tab;
      
      onProgress?.(`Capturando ${tabName} (${i + 1}/${tabs.length})...`);
      
      // Switch to tab
      setActiveTab(tab);
      
      // Wait for content to render (charts, animations)
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Get tab content
      const content = getTabContent();
      if (!content) {
        console.warn(`Tab content not found for: ${tab}`);
        continue;
      }
      
      // Expand collapsibles
      expandAllCollapsibles(content);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: content.scrollWidth,
        height: content.scrollHeight,
      });
      
      // Calculate dimensions
      const imgAspectRatio = canvas.width / canvas.height;
      const contentHeight = (availableWidth / imgAspectRatio);
      const pagesNeeded = Math.ceil(contentHeight / availableHeight);
      
      // Add pages for this tab
      for (let page = 0; page < pagesNeeded; page++) {
        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;
        
        // Header
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${title} - ${tabName}`, margin, margin + 6);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        const dateStr = `Gerado em ${new Date().toLocaleDateString('pt-BR')}`;
        pdf.text(dateStr, margin, margin + 12);
        if (pagesNeeded > 1) {
          pdf.text(`Página ${page + 1} de ${pagesNeeded}`, pageWidth - margin - 25, margin + 6);
        }
        pdf.setTextColor(0, 0, 0);
        
        // Slice canvas for this page
        const sliceHeight = Math.floor(canvas.height / pagesNeeded);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = page === pagesNeeded - 1 
          ? canvas.height - (sliceHeight * page) 
          : sliceHeight;
        
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, page * sliceHeight,
            canvas.width, sliceCanvas.height,
            0, 0,
            canvas.width, sliceCanvas.height
          );
        }
        
        // Calculate image dimensions
        const sliceAspectRatio = sliceCanvas.width / sliceCanvas.height;
        let imgWidth = availableWidth;
        let imgHeight = imgWidth / sliceAspectRatio;
        
        if (imgHeight > availableHeight) {
          imgHeight = availableHeight;
          imgWidth = imgHeight * sliceAspectRatio;
        }
        
        const xPos = margin + (availableWidth - imgWidth) / 2;
        const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', xPos, margin + headerHeight, imgWidth, imgHeight);
      }
    }
    
    // Save
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    
    toast.success('PDF completo exportado com sucesso!');
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Erro ao exportar PDF. Tente novamente.');
    throw error;
  }
}

/**
 * Expands all collapsible elements
 */
function expandAllCollapsibles(container: HTMLElement): void {
  // Radix UI Collapsible/Accordion
  const closedTriggers = container.querySelectorAll('[data-state="closed"]');
  closedTriggers.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.setAttribute('data-state', 'open');
    }
  });
  
  // Force content visibility
  const closedContent = container.querySelectorAll('[data-state="closed"][data-radix-collapsible-content]');
  closedContent.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.setAttribute('data-state', 'open');
      el.style.display = 'block';
      el.style.height = 'auto';
    }
  });
  
  // HTML details elements
  const details = container.querySelectorAll('details:not([open])');
  details.forEach((el) => el.setAttribute('open', 'true'));
}
