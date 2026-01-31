/**
 * StepKnowledge - Etapa de Upload de Base de Conhecimento
 */

import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle2, Info, Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KnowledgeFile {
  name: string;
  size: number;
  content: string;
  type: string;
}

interface StepKnowledgeProps {
  knowledgeFiles: KnowledgeFile[];
  onChange: (files: KnowledgeFile[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx'];

export function StepKnowledge({ knowledgeFiles, onChange }: StepKnowledgeProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [extractProgress, setExtractProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return 'Formato inválido. Use .txt, .md, .pdf ou .docx';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Máximo 10MB';
    }
    
    // Check if file already exists
    if (knowledgeFiles.some(f => f.name === file.name)) {
      return 'Arquivo já adicionado';
    }
    
    return null;
  };

  const extractPDFText = async (file: File): Promise<string> => {
    setExtractProgress(10);
    
    try {
      const pdfjsLib = (window as any).pdfjsLib;
      
      if (!pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Falha ao carregar PDF.js'));
          document.head.appendChild(script);
        });
      }
      
      setExtractProgress(20);
      
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      setExtractProgress(30);
      
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;
      
      let fullText = '';
      const numPages = pdfDocument.numPages;
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
        
        setExtractProgress(30 + Math.round((i / numPages) * 60));
      }
      
      setExtractProgress(100);
      return fullText.trim();
      
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      throw new Error('Erro ao processar PDF. Tente outro arquivo.');
    }
  };

  const extractDocxText = async (file: File): Promise<string> => {
    setExtractProgress(20);
    
    try {
      // Load mammoth.js dynamically
      if (!(window as any).mammoth) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Falha ao carregar mammoth.js'));
          document.head.appendChild(script);
        });
      }
      
      setExtractProgress(40);
      
      const arrayBuffer = await file.arrayBuffer();
      setExtractProgress(60);
      
      const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
      setExtractProgress(100);
      
      return result.value.trim();
      
    } catch (error) {
      console.error('Erro ao extrair texto do DOCX:', error);
      throw new Error('Erro ao processar DOCX. Tente outro arquivo.');
    }
  };

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    setProcessingFile(file.name);
    setExtractProgress(0);
    
    try {
      let text: string;
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (extension === '.pdf') {
        text = await extractPDFText(file);
      } else if (extension === '.docx') {
        text = await extractDocxText(file);
      } else {
        setExtractProgress(50);
        text = await readTextFile(file);
        setExtractProgress(100);
      }
      
      if (!text.trim()) {
        throw new Error('Arquivo está vazio ou não foi possível extrair texto');
      }
      
      const newFile: KnowledgeFile = {
        name: file.name,
        size: file.size,
        content: text,
        type: extension
      };
      
      onChange([...knowledgeFiles, newFile]);
      toast.success(`"${file.name}" processado com sucesso!`);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo');
    } finally {
      setIsProcessing(false);
      setProcessingFile(null);
    }
  };

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => processFile(file));
  }, [knowledgeFiles]);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => processFile(file));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileName: string) => {
    onChange(knowledgeFiles.filter(f => f.name !== fileName));
    toast.info(`"${fileName}" removido`);
  };

  const totalCharacters = knowledgeFiles.reduce((acc, f) => acc + f.content.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
          <FileText className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
        </div>
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Base de Conhecimento
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Envie documentos para treinar sua IA com informações específicas
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-300 text-sm">
          A IA usará estes documentos como referência para responder perguntas sobre seus serviços, 
          protocolos, preços e outras informações específicas do seu negócio.
        </AlertDescription>
      </Alert>

      {/* PDF Warning */}
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-amber-300 text-sm">
          <strong>Sobre PDFs:</strong> PDFs com texto selecionável funcionam bem. 
          PDFs escaneados ou com muitas imagens podem ter extração de texto limitada. 
          Para melhor resultado, prefira arquivos .txt, .md ou .docx.
        </AlertDescription>
      </Alert>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all",
          isProcessing ? "cursor-wait" : "cursor-pointer",
          isDragActive 
            ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]" 
            : "border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx"
          onChange={handleFileSelect}
          multiple
          className="hidden"
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 mx-auto text-[hsl(var(--avivar-primary))] animate-spin" />
            <div className="space-y-2">
              <p className="text-[hsl(var(--avivar-foreground))] font-medium">
                Processando: {processingFile}
              </p>
              <Progress value={extractProgress} className="h-2 max-w-xs mx-auto" />
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {extractProgress}%
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))]" />
            <div>
              {isDragActive ? (
                <p className="text-[hsl(var(--avivar-primary))] font-medium">
                  Solte os arquivos aqui...
                </p>
              ) : (
                <>
                  <p className="text-[hsl(var(--avivar-foreground))] font-medium">
                    Arraste arquivos ou clique para selecionar
                  </p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1">
                    Múltiplos arquivos permitidos
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {/* File type badges */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {ACCEPTED_EXTENSIONS.map(ext => (
          <Badge 
            key={ext}
            variant="outline" 
            className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]"
          >
            <File className="h-3 w-3 mr-1" />
            {ext}
          </Badge>
        ))}
        <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
          • Máx 10MB por arquivo
        </span>
      </div>

      {/* Uploaded files list */}
      {knowledgeFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Arquivos adicionados ({knowledgeFiles.length})
          </h3>
          
          <div className="space-y-2">
            {knowledgeFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                      {file.name}
                    </p>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      {(file.size / 1024).toFixed(1)} KB • {file.content.length.toLocaleString()} caracteres
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(file.name)}
                  className="text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-green-300">
              <strong>Total:</strong> {knowledgeFiles.length} arquivo(s) • {totalCharacters.toLocaleString()} caracteres de conhecimento
            </p>
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {knowledgeFiles.length === 0 && (
        <p className="text-center text-sm text-[hsl(var(--avivar-muted-foreground))]">
          Esta etapa é opcional. Você pode adicionar documentos depois nas configurações.
        </p>
      )}
    </div>
  );
}
