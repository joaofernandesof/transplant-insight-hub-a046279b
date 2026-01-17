import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Award, Download, Loader2 } from 'lucide-react';
import { downloadCertificate, generateCertificateId } from '@/utils/certificateGenerator';
import { toast } from 'sonner';

interface CertificateDownloadButtonProps {
  studentName: string;
  courseName: string;
  completionDate: Date | string;
  courseHours: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

export function CertificateDownloadButton({
  studentName,
  courseName,
  completionDate,
  courseHours,
  variant = 'default',
  size = 'default',
  showIcon = true,
  className = '',
}: CertificateDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const date = typeof completionDate === 'string' 
        ? new Date(completionDate) 
        : completionDate;

      downloadCertificate({
        studentName,
        courseName,
        completionDate: date,
        courseHours,
        certificateId: generateCertificateId(),
      });

      toast.success('Certificado gerado com sucesso!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Erro ao gerar certificado');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      className={`gap-2 ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          {showIcon && <Award className="h-4 w-4" />}
          <span>Baixar Certificado</span>
        </>
      )}
    </Button>
  );
}
