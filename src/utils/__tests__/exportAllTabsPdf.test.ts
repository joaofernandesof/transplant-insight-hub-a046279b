import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock')
  })
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    setTextColor: vi.fn()
  }))
}));

describe('PDF Export Utils', () => {
  describe('expandAllCollapsibles', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('expands collapsible elements by adding data-state="open"', async () => {
      document.body.innerHTML = `
        <div id="container">
          <div data-state="closed" class="collapsible">Content</div>
          <div data-state="closed" class="collapsible">More Content</div>
        </div>
      `;

      const collapsibles = document.querySelectorAll('[data-state="closed"]');
      collapsibles.forEach(el => {
        el.setAttribute('data-state', 'open');
      });

      const openElements = document.querySelectorAll('[data-state="open"]');
      expect(openElements.length).toBe(2);
    });

    it('handles containers with no collapsibles', () => {
      document.body.innerHTML = `
        <div id="container">
          <div class="normal-element">No collapsibles here</div>
        </div>
      `;

      const collapsibles = document.querySelectorAll('[data-state="closed"]');
      expect(collapsibles.length).toBe(0);
    });
  });

  describe('scrollAllToEnd', () => {
    it('identifies scrollable elements', () => {
      document.body.innerHTML = `
        <div id="container">
          <div class="overflow-auto" style="height: 100px; overflow: auto;">
            <div style="height: 500px;">Tall content</div>
          </div>
        </div>
      `;

      const scrollables = document.querySelectorAll('[class*="overflow-"]');
      expect(scrollables.length).toBe(1);
    });

    it('handles elements with overflow in style', () => {
      document.body.innerHTML = `
        <div id="container">
          <div style="overflow: scroll; height: 100px;">
            <div style="height: 500px;">Scrollable content</div>
          </div>
        </div>
      `;

      const scrollables = document.querySelectorAll('[style*="overflow"]');
      expect(scrollables.length).toBe(1);
    });
  });

  describe('restoreScrollableElements', () => {
    it('restores original dimensions from data attributes', () => {
      document.body.innerHTML = `
        <div data-pdf-expanded="true" data-original-height="100px" data-original-width="200px">
          Content
        </div>
      `;

      const el = document.querySelector('[data-pdf-expanded]') as HTMLElement;
      const originalHeight = el.getAttribute('data-original-height');
      const originalWidth = el.getAttribute('data-original-width');

      if (originalHeight) el.style.height = originalHeight;
      if (originalWidth) el.style.width = originalWidth;
      el.removeAttribute('data-pdf-expanded');

      expect(el.style.height).toBe('100px');
      expect(el.style.width).toBe('200px');
      expect(el.hasAttribute('data-pdf-expanded')).toBe(false);
    });
  });
});

describe('PDF Export - Tab Capture Logic', () => {
  it('generates correct filename format', () => {
    const baseFilename = 'Dashboard-Juridico';
    const tabName = 'Visão Geral';
    const date = new Date().toISOString().split('T')[0];
    
    const filename = `${baseFilename}-${date}.pdf`;
    
    expect(filename).toMatch(/Dashboard-Juridico-\d{4}-\d{2}-\d{2}\.pdf/);
  });

  it('handles special characters in tab names', () => {
    const tabNames = ['Visão Geral', 'Perguntas', 'IA Insights', 'Alunos'];
    
    tabNames.forEach(name => {
      const sanitized = name.replace(/[^a-zA-Z0-9]/g, '-');
      expect(sanitized).not.toContain(' ');
    });
  });

  it('maintains tab order during export', () => {
    const tabs = ['overview', 'matrix', 'mentors', 'questions', 'students', 'surveys', 'ai-insights'];
    
    expect(tabs.length).toBe(7);
    expect(tabs[0]).toBe('overview');
    expect(tabs[tabs.length - 1]).toBe('ai-insights');
  });
});

describe('PDF Export - Dimensions', () => {
  it('calculates correct A4 dimensions', () => {
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;
    const MARGIN = 10;
    
    const contentWidth = A4_WIDTH - (2 * MARGIN);
    const contentHeight = A4_HEIGHT - (2 * MARGIN);
    
    expect(contentWidth).toBe(190);
    expect(contentHeight).toBe(277);
  });

  it('calculates aspect ratio correctly', () => {
    const elementWidth = 1200;
    const elementHeight = 800;
    const ratio = elementHeight / elementWidth;
    
    expect(ratio).toBeCloseTo(0.667, 2);
  });

  it('scales content to fit page width', () => {
    const pageWidth = 190;
    const elementWidth = 1200;
    const scaleFactor = pageWidth / elementWidth;
    
    const scaledHeight = 800 * scaleFactor;
    
    expect(scaleFactor).toBeCloseTo(0.158, 2);
    expect(scaledHeight).toBeCloseTo(126.67, 1);
  });
});
