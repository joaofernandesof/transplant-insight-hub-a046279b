/**
 * KnowledgeUpload - Upload de Arquivos para Base de Conhecimento
 * Suporta: TXT, MD, PDF com extração de texto
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Folder, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KnowledgeUploadProps {
  onFileProcessed: (content: string, filename: string, fileSize: number) => void;
  isProcessing?: boolean;
}

const ACCEPTED_TYPES = {
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'application/pdf': ['.pdf']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function KnowledgeUpload({ onFileProcessed, isProcessing }: KnowledgeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ['text/plain', 'text/markdown', 'application/pdf'];
    const validExtensions = ['.txt', '.md', '.pdf'];
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = validTypes.includes(file.type) || validExtensions.includes(extension);
    
    if (!isValidType) {
      return 'Formato inválido. Use .txt, .md ou .pdf';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Máximo 10MB';
    }
    
    return null;
  };

  const extractPDFText = async (file: File): Promise<string> => {
    setExtractProgress(10);
    
    try {
      // Usando PDF.js via CDN
      const pdfjsLib = (window as any).pdfjsLib;
      
      if (!pdfjsLib) {
        // Carregar dinamicamente se não estiver disponível
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

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  };

  const processFile = async (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setIsExtracting(true);
    setExtractProgress(0);
    
    try {
      let text: string;
      const extension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (selectedFile.type === 'application/pdf' || extension === '.pdf') {
        text = await extractPDFText(selectedFile);
      } else {
        setExtractProgress(50);
        text = await readTextFile(selectedFile);
        setExtractProgress(100);
      }
      
      if (!text.trim()) {
        throw new Error('Arquivo está vazio ou não foi possível extrair texto');
      }
      
      setExtractedText(text);
      onFileProcessed(text, selectedFile.name, selectedFile.size);
      toast.success(`Arquivo "${selectedFile.name}" processado com sucesso!`);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo');
      setFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExtractedText('');
    setError(null);
    setExtractProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
          isDragActive 
            ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]" 
            : "border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]",
          file && "border-green-500/50 bg-green-500/5"
        )}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isExtracting ? (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 mx-auto text-[hsl(var(--avivar-primary))] animate-spin" />
            <div className="space-y-2">
              <p className="text-[hsl(var(--avivar-foreground))] font-medium">
                Extraindo texto...
              </p>
              <Progress value={extractProgress} className="h-2 max-w-xs mx-auto" />
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {extractProgress}%
              </p>
            </div>
          </div>
        ) : file ? (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="text-[hsl(var(--avivar-foreground))] font-medium">
                {file.name}
              </p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {(file.size / 1024).toFixed(2)} KB • {extractedText.length} caracteres
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))]" />
            <div>
              {isDragActive ? (
                <p className="text-[hsl(var(--avivar-primary))] font-medium">
                  Solte o arquivo aqui...
                </p>
              ) : (
                <>
                  <p className="text-[hsl(var(--avivar-foreground))] font-medium">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1">
                    Formatos aceitos: .txt, .md, .pdf
                  </p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Tamanho máximo: 10MB
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Open Directory Button */}
      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBrowseClick}
          className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
        >
          <Folder className="h-4 w-4 mr-2" />
          Abrir Diretório do PC
        </Button>
        
        {file && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemoveFile}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500"
          >
            <X className="h-4 w-4 mr-1" />
            Remover
          </Button>
        )}
      </div>

      {/* File type badges */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
          <FileText className="h-3 w-3 mr-1" />
          .txt
        </Badge>
        <Badge variant="outline" className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
          <FileText className="h-3 w-3 mr-1" />
          .md
        </Badge>
        <Badge variant="outline" className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
          <File className="h-3 w-3 mr-1" />
          .pdf
        </Badge>
      </div>
    </div>
  );
}
