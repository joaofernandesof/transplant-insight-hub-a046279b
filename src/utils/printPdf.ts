/**
 * Print CSS PDF Export Utility
 * Uses the browser's native print functionality with optimized CSS for 100% visual fidelity
 */

export interface PrintPdfOptions {
  title?: string;
  filename?: string;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margins?: 'default' | 'narrow' | 'none';
  hideElements?: string[]; // CSS selectors to hide during print
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Injects print-specific CSS styles into the document
 */
function injectPrintStyles(options: PrintPdfOptions): HTMLStyleElement {
  const styleEl = document.createElement('style');
  styleEl.id = 'print-pdf-styles';
  
  const hideSelectors = options.hideElements?.join(', ') || '';
  const marginValue = options.margins === 'narrow' ? '0.5cm' : options.margins === 'none' ? '0' : '1cm';
  
  styleEl.textContent = `
    @media print {
      /* Reset page settings */
      @page {
        size: ${options.pageSize || 'A4'} ${options.orientation || 'portrait'};
        margin: ${marginValue};
      }
      
      /* Hide browser UI elements */
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Ensure backgrounds print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Hide navigation and non-essential UI */
      header, footer, nav,
      [data-sidebar], [data-sidebar-wrapper],
      .sidebar, .no-print,
      button:not(.print-keep),
      [role="dialog"],
      .fixed:not(.print-keep),
      ${hideSelectors ? hideSelectors + ',' : ''}
      .toaster {
        display: none !important;
      }
      
      /* Main content takes full width */
      main, .main-content, [data-main-content] {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      
      /* Prevent page breaks inside important elements */
      .card, .chart-container, table, tr, 
      .no-break, [data-no-break] {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      /* Allow page breaks between cards */
      .card {
        break-before: auto;
        break-after: auto;
        margin-bottom: 1rem;
      }
      
      /* Force page breaks where needed */
      .page-break, [data-page-break] {
        break-before: page;
        page-break-before: always;
      }
      
      /* Ensure shadows don't print weird */
      .shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl {
        box-shadow: none !important;
        border: 1px solid #e5e7eb !important;
      }
      
      /* Handle dark mode - force light theme for printing */
      .dark {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --card: 0 0% 100%;
        --card-foreground: 222.2 84% 4.9%;
        --muted: 210 40% 96%;
        --muted-foreground: 215.4 16.3% 46.9%;
        --border: 214.3 31.8% 91.4%;
        color-scheme: light;
      }
      
      /* Ensure text is readable */
      body {
        font-size: 12pt;
        line-height: 1.4;
        color: #1f2937 !important;
        background: white !important;
      }
      
      /* Charts and SVGs */
      svg {
        max-width: 100%;
        height: auto;
      }
      
      .recharts-wrapper {
        max-width: 100% !important;
      }
      
      /* Tables */
      table {
        width: 100%;
        border-collapse: collapse;
      }
      
      th, td {
        border: 1px solid #e5e7eb;
        padding: 8px;
      }
      
      /* Print header */
      .print-header {
        display: block !important;
        text-align: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .print-header h1 {
        font-size: 18pt;
        font-weight: bold;
        margin: 0;
      }
      
      .print-header .print-date {
        font-size: 10pt;
        color: #6b7280;
      }
    }
    
    /* Hide print header on screen */
    @media screen {
      .print-header {
        display: none !important;
      }
    }
  `;
  
  document.head.appendChild(styleEl);
  return styleEl;
}

/**
 * Creates a temporary print header element
 */
function createPrintHeader(title: string): HTMLDivElement {
  const header = document.createElement('div');
  header.className = 'print-header';
  
  const h1 = document.createElement('h1');
  h1.textContent = title; // Safe - no HTML interpretation
  
  const p = document.createElement('p');
  p.className = 'print-date';
  p.textContent = `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
  
  header.appendChild(h1);
  header.appendChild(p);
  return header;
}

/**
 * Main function to trigger print-to-PDF with optimized styles
 */
export function printToPdf(options: PrintPdfOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    // Inject print styles
    const styleEl = injectPrintStyles(options);
    
    // Create and insert print header if title provided
    let headerEl: HTMLDivElement | null = null;
    if (options.title) {
      headerEl = createPrintHeader(options.title);
      document.body.insertBefore(headerEl, document.body.firstChild);
    }
    
    // Run before print callback
    options.onBeforePrint?.();
    
    // Set document title for PDF filename
    const originalTitle = document.title;
    if (options.filename) {
      document.title = options.filename;
    }
    
    // Handle after print cleanup
    const cleanup = () => {
      // Remove injected styles
      styleEl.remove();
      
      // Remove header
      headerEl?.remove();
      
      // Restore original title
      document.title = originalTitle;
      
      // Run after print callback
      options.onAfterPrint?.();
      
      resolve();
    };
    
    // Modern browsers
    if (window.matchMedia) {
      const mediaQueryList = window.matchMedia('print');
      const handleChange = (mql: MediaQueryListEvent | MediaQueryList) => {
        if (!mql.matches) {
          // Print dialog closed
          setTimeout(cleanup, 100);
          mediaQueryList.removeEventListener('change', handleChange);
        }
      };
      mediaQueryList.addEventListener('change', handleChange);
    }
    
    // Trigger print
    setTimeout(() => {
      window.print();
      // Fallback cleanup for browsers that don't trigger media query change
      setTimeout(cleanup, 1000);
    }, 100);
  });
}

/**
 * Print a specific element by ID or selector
 */
export function printElement(
  selector: string, 
  options: PrintPdfOptions = {}
): Promise<void> {
  const element = document.querySelector(selector);
  if (!element) {
    console.error(`Element not found: ${selector}`);
    return Promise.reject(new Error(`Element not found: ${selector}`));
  }
  
  // Add a class to isolate this element for printing
  const styleEl = document.createElement('style');
  styleEl.id = 'print-element-isolate';
  styleEl.textContent = `
    @media print {
      body > *:not(${selector}):not(.print-header):not(#print-pdf-styles):not(#print-element-isolate) {
        display: none !important;
      }
      ${selector} {
        position: static !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 1rem !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
  
  const extendedOptions: PrintPdfOptions = {
    ...options,
    onAfterPrint: () => {
      styleEl.remove();
      options.onAfterPrint?.();
    },
  };
  
  return printToPdf(extendedOptions);
}

/**
 * Print current tab content with proper isolation
 */
export function printCurrentView(title: string, options: PrintPdfOptions = {}): Promise<void> {
  return printToPdf({
    title,
    orientation: 'portrait',
    margins: 'default',
    hideElements: [
      '[data-sidebar]',
      'header',
      'nav',
      '.breadcrumb',
      '[role="tablist"]',
    ],
    ...options,
  });
}
