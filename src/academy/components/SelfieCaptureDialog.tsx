import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, X, Loader2, User, Sun, Move, ZoomIn, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelfieCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (selfieBase64: string) => void;
  isProcessing: boolean;
}

interface FaceValidation {
  isValid: boolean;
  isCentered: boolean;
  isGoodSize: boolean;
  hasGoodLighting: boolean;
}

export function SelfieCaptureDialog({ open, onClose, onCapture, isProcessing }: SelfieCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [faceValidation, setFaceValidation] = useState<FaceValidation>({
    isValid: false,
    isCentered: false,
    isGoodSize: false,
    hasGoodLighting: false,
  });
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const validationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
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
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, [stream]);

  // Face detection and validation
  const validateFace = useCallback(() => {
    if (!videoRef.current || !detectionCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = detectionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple brightness analysis for lighting
    let totalBrightness = 0;
    let skinTonePixels = 0;
    let skinToneCenterX = 0;
    let skinToneCenterY = 0;
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;

        // Simple skin tone detection (works for various skin tones)
        const isSkinTone = 
          r > 60 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15 &&
          r - b > 15 && r - b < 170;

        if (isSkinTone) {
          skinTonePixels++;
          skinToneCenterX += x;
          skinToneCenterY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const avgBrightness = totalBrightness / (canvas.width * canvas.height);
    const hasGoodLighting = avgBrightness > 80 && avgBrightness < 220;

    // Check if face is detected and centered
    const hasFace = skinTonePixels > (canvas.width * canvas.height * 0.05);
    
    let isCentered = false;
    let isGoodSize = false;

    if (hasFace && skinTonePixels > 0) {
      const centerX = skinToneCenterX / skinTonePixels;
      const centerY = skinToneCenterY / skinTonePixels;
      
      const frameCenterX = canvas.width / 2;
      const frameCenterY = canvas.height / 2;
      
      // Check if face is centered (within 20% of center)
      const xOffset = Math.abs(centerX - frameCenterX) / canvas.width;
      const yOffset = Math.abs(centerY - frameCenterY) / canvas.height;
      isCentered = xOffset < 0.2 && yOffset < 0.25;

      // Check face size (should occupy 15-50% of frame)
      const faceWidth = maxX - minX;
      const faceHeight = maxY - minY;
      const faceArea = faceWidth * faceHeight;
      const frameArea = canvas.width * canvas.height;
      const faceRatio = faceArea / frameArea;
      isGoodSize = faceRatio > 0.08 && faceRatio < 0.5;
    }

    const isValid = hasFace && isCentered && isGoodSize && hasGoodLighting;

    setFaceValidation({
      isValid,
      isCentered: hasFace && isCentered,
      isGoodSize: hasFace && isGoodSize,
      hasGoodLighting,
    });

    return isValid;
  }, []);

  // Auto-capture when face is valid
  useEffect(() => {
    if (stream && !capturedImage && open) {
      validationIntervalRef.current = setInterval(() => {
        const isValid = validateFace();
        
        if (isValid && !autoCapturing && countdown === null) {
          setAutoCapturing(true);
          setCountdown(3);
        } else if (!isValid && autoCapturing) {
          setAutoCapturing(false);
          setCountdown(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      }, 200);
    }

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [stream, capturedImage, open, validateFace, autoCapturing, countdown]);

  // Countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleCapture();
      setCountdown(null);
      setAutoCapturing(false);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current);
      }
    };
  }, [countdown]);

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    } else if (!open) {
      stopCamera();
      setCapturedImage(null);
      setAutoCapturing(false);
      setCountdown(null);
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
    setAutoCapturing(false);
    setCountdown(null);
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

  const ValidationIndicator = ({ valid, label, icon: Icon }: { valid: boolean; label: string; icon: typeof Sun }) => (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
      valid 
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
        : "bg-white/10 text-white/60 border border-white/20"
    )}>
      <Icon className="h-3 w-3" />
      {label}
      {valid && <CheckCircle2 className="h-3 w-3" />}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">Capturar Selfie</DialogTitle>
        
        <div className="p-4 bg-background border-b">
          <h3 className="font-semibold text-lg">Tire uma selfie</h3>
          <p className="text-sm text-muted-foreground">
            Posicione seu rosto no círculo - foto automática quando estiver pronto
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
              
              {/* Face guide overlay with validation feedback */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={cn(
                  "w-48 h-56 border-2 rounded-full transition-all duration-300",
                  faceValidation.isValid 
                    ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]" 
                    : faceValidation.isCentered && faceValidation.isGoodSize
                      ? "border-yellow-400"
                      : "border-white/50"
                )} />
              </div>

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <div className="text-8xl font-bold text-white animate-pulse">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Validation indicators */}
              <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 justify-center">
                <ValidationIndicator 
                  valid={faceValidation.hasGoodLighting} 
                  label="Iluminação" 
                  icon={Sun} 
                />
                <ValidationIndicator 
                  valid={faceValidation.isCentered} 
                  label="Centralizado" 
                  icon={Move} 
                />
                <ValidationIndicator 
                  valid={faceValidation.isGoodSize} 
                  label="Distância" 
                  icon={ZoomIn} 
                />
              </div>

              {/* Tips panel */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1">
                  <p className="font-medium text-center mb-2">📸 Dicas para uma boa foto:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-2">
                      <Sun className="h-3 w-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                      <span>Boa iluminação frontal</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Move className="h-3 w-3 mt-0.5 text-blue-400 flex-shrink-0" />
                      <span>Rosto centralizado</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ZoomIn className="h-3 w-3 mt-0.5 text-green-400 flex-shrink-0" />
                      <span>Preencha o círculo</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-3 w-3 mt-0.5 text-purple-400 flex-shrink-0" />
                      <span>Fundo neutro/liso</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={detectionCanvasRef} className="hidden" />
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
                className={cn(
                  "rounded-full w-16 h-16 transition-all",
                  faceValidation.isValid 
                    ? "bg-emerald-500 hover:bg-emerald-600 animate-pulse" 
                    : "bg-emerald-600 hover:bg-emerald-700"
                )}
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
