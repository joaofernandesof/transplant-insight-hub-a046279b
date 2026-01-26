import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeMessageHtml } from '../sanitizeHtml';

describe('sanitizeHtml', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      expect(sanitizeHtml(html)).toBe('<p>Hello <strong>World</strong></p>');
    });

    it('should remove script tags', () => {
      const html = '<script>alert("xss")</script><p>Safe</p>';
      expect(sanitizeHtml(html)).toBe('<p>Safe</p>');
    });

    it('should remove iframe tags', () => {
      const html = '<iframe src="malicious.com"></iframe><p>Safe</p>';
      expect(sanitizeHtml(html)).toBe('<p>Safe</p>');
    });

    it('should remove event handlers', () => {
      const html = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onclick');
    });

    it('should remove onerror handler', () => {
      const html = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onerror');
    });

    it('should allow href on anchor tags', () => {
      const html = '<a href="https://example.com">Link</a>';
      expect(sanitizeHtml(html)).toContain('href="https://example.com"');
    });

    it('should block javascript: URLs', () => {
      const html = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('javascript:');
    });

    it('should allow table elements', () => {
      const html = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<table>');
      expect(result).toContain('<th>Header</th>');
      expect(result).toContain('<td>Cell</td>');
    });

    it('should allow heading tags', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>';
      expect(sanitizeHtml(html)).toContain('<h1>Title</h1>');
      expect(sanitizeHtml(html)).toContain('<h2>Subtitle</h2>');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should return empty string for null/undefined input', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('should remove form elements', () => {
      const html = '<form action="/submit"><input type="text"><button>Submit</button></form>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<form');
      expect(result).not.toContain('<input');
    });

    it('should allow lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(sanitizeHtml(html)).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
    });

    it('should allow blockquote and code', () => {
      const html = '<blockquote>Quote</blockquote><pre><code>code</code></pre>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<blockquote>Quote</blockquote>');
      expect(result).toContain('<code>code</code>');
    });
  });

  describe('sanitizeMessageHtml', () => {
    it('should be more restrictive than sanitizeHtml', () => {
      // Tables are not allowed in messages
      const html = '<table><tr><td>Cell</td></tr></table>';
      const result = sanitizeMessageHtml(html);
      expect(result).not.toContain('<table>');
    });

    it('should allow basic formatting', () => {
      const html = '<strong>Bold</strong> <em>Italic</em> <b>B</b> <i>I</i>';
      const result = sanitizeMessageHtml(html);
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>Italic</em>');
    });

    it('should allow links', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizeMessageHtml(html);
      expect(result).toContain('href="https://example.com"');
    });

    it('should allow code tags', () => {
      const html = '<code>const x = 1;</code>';
      expect(sanitizeMessageHtml(html)).toContain('<code>const x = 1;</code>');
    });

    it('should allow paragraphs and line breaks', () => {
      const html = '<p>Paragraph</p><br>';
      const result = sanitizeMessageHtml(html);
      expect(result).toContain('<p>Paragraph</p>');
      expect(result).toContain('<br>');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeMessageHtml('')).toBe('');
    });

    it('should block javascript in href', () => {
      const html = '<a href="javascript:void(0)">Click</a>';
      const result = sanitizeMessageHtml(html);
      expect(result).not.toContain('javascript:');
    });
  });
});
