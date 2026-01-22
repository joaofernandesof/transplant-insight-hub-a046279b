import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Heading1,
  Heading2
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Digite sua mensagem...',
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML, editorRef.current.innerText);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const sanitized = sanitizeHtml(editorRef.current.innerHTML);
      onChange(sanitized, editorRef.current.innerText);
    }
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = prompt('Digite a URL do link:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-muted/50 border-b">
        <Toggle
          size="sm"
          aria-label="Negrito"
          onPressedChange={() => execCommand('bold')}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          aria-label="Itálico"
          onPressedChange={() => execCommand('italic')}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          aria-label="Sublinhado"
          onPressedChange={() => execCommand('underline')}
        >
          <Underline className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        <Toggle
          size="sm"
          aria-label="Título 1"
          onPressedChange={() => execCommand('formatBlock', 'h1')}
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          aria-label="Título 2"
          onPressedChange={() => execCommand('formatBlock', 'h2')}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        <Toggle
          size="sm"
          aria-label="Lista"
          onPressedChange={() => execCommand('insertUnorderedList')}
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          aria-label="Lista numerada"
          onPressedChange={() => execCommand('insertOrderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        <Toggle
          size="sm"
          aria-label="Alinhar à esquerda"
          onPressedChange={() => execCommand('justifyLeft')}
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          aria-label="Centralizar"
          onPressedChange={() => execCommand('justifyCenter')}
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          aria-label="Alinhar à direita"
          onPressedChange={() => execCommand('justifyRight')}
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1 self-center" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          className="h-8 px-2"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[150px] p-3 focus:outline-none prose prose-sm max-w-none"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        style={{
          minHeight: '150px'
        }}
      />
    </div>
  );
};

export default RichTextEditor;
