/**
 * Bloco 7: Anexos obrigatórios
 */

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, AlertTriangle, CheckCircle } from "lucide-react";

interface Bloco7Props {
  files: { file: File; tipo: string }[];
  setFiles: React.Dispatch<React.SetStateAction<{ file: File; tipo: string }[]>>;
}

const FILE_TYPES = [
  { 
    tipo: 'contrato_pdf', 
    label: 'Contrato em PDF', 
    required: true,
    accept: '.pdf',
    description: 'Arquivo PDF do contrato a ser analisado'
  },
  { 
    tipo: 'contrato_editavel', 
    label: 'Versão Editável', 
    required: false,
    accept: '.doc,.docx,.odt',
    description: 'Word ou outro formato editável (se existir)'
  },
  { 
    tipo: 'registro_negociacao', 
    label: 'Registros de Negociação', 
    required: false,
    accept: '.pdf,.png,.jpg,.jpeg,.doc,.docx',
    description: 'Prints de WhatsApp, e-mails, etc.'
  },
  { 
    tipo: 'documento_complementar', 
    label: 'Documentos Complementares', 
    required: false,
    accept: '*',
    description: 'Outros documentos citados no contrato'
  },
];

export function Bloco7Anexos({ files, setFiles }: Bloco7Props) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (tipo: string, selectedFile: File) => {
    // Remove arquivo anterior do mesmo tipo
    setFiles(prev => [...prev.filter(f => f.tipo !== tipo), { file: selectedFile, tipo }]);
  };

  const removeFile = (tipo: string) => {
    setFiles(prev => prev.filter(f => f.tipo !== tipo));
  };

  const getFileForType = (tipo: string) => files.find(f => f.tipo === tipo);

  const hasPdf = files.some(f => f.tipo === 'contrato_pdf');

  return (
    <div className="space-y-4">
      {!hasPdf && (
        <div className="p-4 border border-destructive rounded-md bg-destructive/10 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">PDF do contrato é obrigatório</p>
            <p className="text-xs text-muted-foreground">
              Sem o PDF, a solicitação não poderá ser enviada
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {FILE_TYPES.map((fileType) => {
          const existingFile = getFileForType(fileType.tipo);
          
          return (
            <div 
              key={fileType.tipo}
              className={`p-4 border rounded-md ${
                existingFile 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                  : fileType.required 
                    ? 'border-destructive/50' 
                    : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">
                      {fileType.label}
                      {fileType.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {existingFile && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fileType.description}
                  </p>
                </div>
                
                <input
                  type="file"
                  ref={(el) => { inputRefs.current[fileType.tipo] = el; }}
                  accept={fileType.accept}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(fileType.tipo, file);
                  }}
                />
                
                {existingFile ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span className="max-w-[150px] truncate">{existingFile.file.name}</span>
                      <span className="text-muted-foreground">
                        ({(existingFile.file.size / 1024).toFixed(0)} KB)
                      </span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(fileType.tipo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => inputRefs.current[fileType.tipo]?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Anexar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border rounded-md bg-muted/30">
        <h4 className="font-medium text-sm mb-2">📎 Resumo dos anexos:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          {files.length === 0 ? (
            <li>Nenhum arquivo anexado ainda</li>
          ) : (
            files.map((f) => (
              <li key={f.tipo} className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {f.file.name}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
