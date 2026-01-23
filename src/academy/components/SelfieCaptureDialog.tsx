import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, X, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface SelfieCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (selfieBase64: string) => void;
  isProcessing: boolean;
}

export function SelfieCaptureDialog({ open, onClose, onCapture, isProcessing }: SelfieCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }, [facingMode, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    } else if (!open) {
      stopCamera();
      setCapturedImage(null);
    }
    
    return () => {
      stopCamera();
    };
  }, [open, capturedImage]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally for selfie camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    stopCamera();
    setTimeout(() => startCamera(), 100);
  };

  return (
    <Dialog open={open} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">Capturar Selfie</DialogTitle>
        
        <div className="p-4 bg-background border-b">
          <h3 className="font-semibold text-lg">Tire uma selfie</h3>
          <p className="text-sm text-muted-foreground">
            Vamos encontrar as fotos em que você aparece
          </p>
        </div>

        <div className="relative bg-black aspect-[4/3] overflow-hidden">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
              <User className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-sm">{cameraError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={startCamera}
              >
                Tentar novamente
              </Button>
            </div>
          ) : capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Selfie capturada" 
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white/50 rounded-full" />
              </div>
            </>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 bg-background flex justify-center gap-3">
          {capturedImage ? (
            <>
              <Button
                variant="outline"
                onClick={handleRetake}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Tirar outra
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Buscar fotos
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwitchCamera}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCapture}
                disabled={!stream}
              >
                <Camera className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
