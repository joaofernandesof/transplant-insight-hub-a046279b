/**
 * HairScanAnalyzer - Main analysis component
 * Handles photo capture, progression simulation, and scan visualization
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  ArrowLeft,
  TrendingDown,
  Zap,
  Loader2,
  RotateCcw,
  Download,
  ScanFace,
  Crop,
  Sparkles,
  Grid3X3,
  ImageDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ImageCropper from "./ImageCropper";
import { ScanCreditsDisplay } from "./ScanCreditsDisplay";
import { ScanPlansModal } from "./ScanPlansModal";
import { NewVersionGalleryModal } from "./NewVersionGalleryModal";
import { useScanCredits } from "../hooks/useScanCredits";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface HairScanAnalyzerProps {
  onBack: () => void;
}

export default function HairScanAnalyzer({ onBack }: HairScanAnalyzerProps) {
  const { session } = useUnifiedAuth();
  const userId = session?.user?.id;
  
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [progressionImage, setProgressionImage] = useState<string | null>(null);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [newVersionImages, setNewVersionImages] = useState<string[]>([]);
  const [yearsProgression, setYearsProgression] = useState([0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState<"progression" | "scan" | "newversion">("progression");
  const [selectedHairStyle, setSelectedHairStyle] = useState("natural");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  
  const { consumeCredit, refreshTrigger, refreshCredits } = useScanCredits(userId);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for open plans event
  useEffect(() => {
    const handleOpenPlans = () => setShowPlansModal(true);
    window.addEventListener('open-scan-plans', handleOpenPlans);
    return () => window.removeEventListener('open-scan-plans', handleOpenPlans);
  }, []);

  // Store stream reference for assignment after video element is ready
  const pendingStreamRef = useRef<MediaStream | null>(null);

  // Open camera
  const openCamera = async () => {
    try {
      // First check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Seu navegador não suporta acesso à câmera");
        return;
      }

      // Try to get the camera stream with fallback options
      let stream: MediaStream;
      try {
        // First try with environment camera (back camera for mobile)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: "environment" },
            width: { ideal: 720 },
            height: { ideal: 720 }
          }
        });
      } catch {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      // Store the stream and open camera UI
      // The video element will be rendered, then we assign the stream in useEffect
      pendingStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Camera error:", error);
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          toast.error("Permissão de câmera negada. Permita o acesso nas configurações.");
        } else if (error.name === "NotFoundError") {
          toast.error("Nenhuma câmera encontrada no dispositivo.");
        } else if (error.name === "NotReadableError") {
          toast.error("Câmera em uso por outro aplicativo.");
        } else {
          toast.error(`Erro ao acessar câmera: ${error.message}`);
        }
      } else {
        toast.error("Não foi possível acessar a câmera");
      }
    }
  };

  // Effect to attach stream to video element after it's rendered
  useEffect(() => {
    if (isCameraOpen && pendingStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = pendingStreamRef.current;
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
        toast.error("Erro ao iniciar vídeo da câmera");
      });
      pendingStreamRef.current = null;
    }
  }, [isCameraOpen]);

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setRawImage(imageData);
        setShowCropper(true);
        stopCamera();
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRawImage(e.target?.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle crop complete
  const handleCropComplete = (croppedImage: string) => {
    setOriginalImage(croppedImage);
    setShowCropper(false);
    setRawImage(null);
    toast.success("Área selecionada com sucesso!");
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropper(false);
    setRawImage(null);
  };

  // Re-crop the image
  const handleRecrop = () => {
    if (originalImage) {
      setRawImage(originalImage);
      setShowCropper(true);
    }
  };

  // Process with AI
  const processImage = useCallback(async (action: "progression" | "scan" | "newversion") => {
    if (!originalImage) {
      toast.error("Capture ou faça upload de uma foto primeiro");
      return;
    }

    setIsProcessing(true);

    try {
      if (action === "newversion") {
        // Generate multiple images to fill the grid (12 total)
        const remaining = 12 - newVersionImages.length;
        const toGenerate = Math.min(remaining, 12);
        
        if (toGenerate <= 0) {
          toast.info("Grid já está completo! Limpe para gerar novas variações.");
          setIsProcessing(false);
          return;
        }

        toast.info(`Gerando ${toGenerate} variações...`, { duration: 3000 });
        
        let successCount = 0;
        let rateLimitError = false;
        let creditsError = false;
        
        // Generate images one by one to show progress
        for (let i = 0; i < toGenerate; i++) {
          // Check credits for each generation
          const hasCredits = await consumeCredit(`scan_${action}`);
          if (!hasCredits) {
            toast.warning(`Geradas ${successCount} de ${toGenerate} variações. Créditos insuficientes.`);
            break;
          }

          try {
            const { data, error } = await supabase.functions.invoke("hair-scan-analysis", {
              body: {
                action,
                imageBase64: originalImage,
                hairStyle: selectedHairStyle,
              },
            });

            // Check for errors - either in error object or data.error
            const errorMessage = error?.message || data?.error || "";
            const errorContext = (error as any)?.context;
            const statusCode = errorContext?.status || 
                               (errorMessage.includes("402") ? 402 : 0) ||
                               (errorMessage.includes("429") ? 429 : 0);
            
            // Handle 402 - Insufficient credits
            if (statusCode === 402 || errorMessage.toLowerCase().includes("créditos insuficientes") || 
                errorMessage.toLowerCase().includes("payment required")) {
              creditsError = true;
              if (successCount === 0) {
                toast.error("Créditos Lovable AI insuficientes. Adicione créditos ao workspace.", {
                  duration: 8000,
                  action: {
                    label: "Saber mais",
                    onClick: () => window.open("https://docs.lovable.dev/features/ai", "_blank")
                  }
                });
              }
              break;
            }
            
            // Handle 429 - Rate limit
            if (statusCode === 429 || errorMessage.toLowerCase().includes("limite de requisições")) {
              rateLimitError = true;
              if (successCount === 0) {
                toast.error("Limite de requisições atingido. Aguarde alguns minutos.", { duration: 5000 });
              }
              break;
            }
            
            // Handle other errors
            if (error) {
              console.error("Generation error:", error);
              continue;
            }
            
            if (data?.error) {
              console.error("Generation error:", data.error);
              continue;
            }

            if (data?.image) {
              setNewVersionImages(prev => [...prev, data.image]);
              successCount++;
            }
          } catch (err: any) {
            console.error(`Error generating variation ${i + 1}:`, err);
            // Try to extract status from error
            if (err?.context?.status === 402 || err?.message?.includes("402")) {
              creditsError = true;
              toast.error("Créditos Lovable AI insuficientes. Adicione créditos ao workspace.", {
                duration: 5000,
                action: {
                  label: "Saber mais",
                  onClick: () => window.open("https://docs.lovable.dev/features/ai", "_blank")
                }
              });
              break;
            }
          }
        }
        
        // Show appropriate message based on result
        if (creditsError && successCount === 0) {
          // Already showed error toast above
        } else if (rateLimitError && successCount === 0) {
          // Already showed error toast above
        } else if (successCount > 0) {
          toast.success(`${successCount} variações geradas!`);
        } else {
          toast.error("Não foi possível gerar variações. Tente novamente.");
        }
      } else {
        // Single image processing (progression/scan)
        const hasCredits = await consumeCredit(`scan_${action}`);
        if (!hasCredits) {
          setIsProcessing(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke("hair-scan-analysis", {
          body: {
            action,
            imageBase64: originalImage,
            yearsProgression: yearsProgression[0],
            hairStyle: selectedHairStyle,
          },
        });

        if (error) throw error;

        if (data?.error) {
          toast.error(data.error);
          refreshCredits();
          return;
        }

        if (action === "progression") {
          setProgressionImage(data.image);
          toast.success(`Simulação de ${yearsProgression[0]} anos gerada!`);
        } else if (action === "scan") {
          setScanImage(data.image);
          toast.success("Scan de densidade gerado!");
        }
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      const errorMessage = error?.message || "Erro ao processar imagem. Tente novamente.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, yearsProgression, selectedHairStyle, newVersionImages.length, consumeCredit, refreshCredits]);

  // Reset analysis
  const resetAnalysis = () => {
    setRawImage(null);
    setOriginalImage(null);
    setProgressionImage(null);
    setScanImage(null);
    setNewVersionImages([]);
    setYearsProgression([0]);
    setShowCropper(false);
    setSelectedHairStyle("natural");
    stopCamera();
  };

  // Download image
  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = filename;
    link.click();
  };

  // Download composite image (before + after grid) with professional UI style
  const downloadCompositeImage = useCallback(async () => {
    if (!originalImage || newVersionImages.length === 0) {
      toast.error("Gere pelo menos uma variação antes de baixar");
      return;
    }

    toast.info("Gerando imagem composta...");

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // Professional layout dimensions
      const gridCols = 4;
      const gridRows = 3;
      const cellSize = 220;
      const cellGap = 4;
      const originalWidth = Math.floor(cellSize * 2.2);
      const gridWidth = cellSize * gridCols + cellGap * (gridCols - 1);
      const contentHeight = cellSize * gridRows + cellGap * (gridRows - 1);
      const headerHeight = 50;
      const labelHeight = 36;
      const footerHeight = 56;
      const middleGap = 8;
      
      canvas.width = originalWidth + middleGap + gridWidth;
      canvas.height = headerHeight + contentHeight + labelHeight + footerHeight;

      // Background - dark purple gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, "#1a0f2e");
      bgGradient.addColorStop(1, "#0d0618");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Helper function to load images
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // Helper to draw rounded rect
      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // ===== HEADER =====
      const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      headerGradient.addColorStop(0, "#7c3aed");
      headerGradient.addColorStop(0.5, "#a855f7");
      headerGradient.addColorStop(1, "#7c3aed");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, canvas.width, headerHeight);

      // NeoHairScan title (left)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("NeoHairScan", 16, 32);
      ctx.font = "12px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#e9d5ff";
      ctx.fillText("Simulação de Transplante Capilar", 16, 46);

      // by NeoFolic (right)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("by NeoFolic", canvas.width - 16, 28);
      ctx.font = "11px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#fde68a";
      ctx.fillText("www.neofolic.com.br", canvas.width - 16, 44);

      // ===== ORIGINAL IMAGE (left side) =====
      const origImg = await loadImage(originalImage);
      const origAspect = origImg.width / origImg.height;
      let drawWidth = originalWidth;
      let drawHeight = originalWidth / origAspect;
      
      if (drawHeight > contentHeight) {
        drawHeight = contentHeight;
        drawWidth = contentHeight * origAspect;
      }
      
      const origX = (originalWidth - drawWidth) / 2;
      const origY = headerHeight + (contentHeight - drawHeight) / 2;
      
      // Draw original with slight rounded corners
      ctx.save();
      roundRect(0, headerHeight, originalWidth, contentHeight, 0);
      ctx.clip();
      ctx.drawImage(origImg, origX, origY, drawWidth, drawHeight);
      ctx.restore();

      // ===== GRID OF VARIATIONS (right side) =====
      const gridStartX = originalWidth + middleGap;
      const gridStartY = headerHeight;

      for (let i = 0; i < 12; i++) {
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        const x = gridStartX + col * (cellSize + cellGap);
        const y = gridStartY + row * (cellSize + cellGap);

        if (newVersionImages[i]) {
          try {
            const varImg = await loadImage(newVersionImages[i]);
            const varAspect = varImg.width / varImg.height;
            let vw = cellSize;
            let vh = cellSize / varAspect;
            
            if (vh < cellSize) {
              vh = cellSize;
              vw = cellSize * varAspect;
            }
            
            const vx = x + (cellSize - vw) / 2;
            const vy = y + (cellSize - vh) / 2;
            
            // Clip to cell with rounded corners
            ctx.save();
            roundRect(x, y, cellSize, cellSize, 8);
            ctx.clip();
            ctx.drawImage(varImg, vx, vy, vw, vh);
            ctx.restore();
            
            // Numbered badge (purple circle)
            ctx.fillStyle = "#8b5cf6";
            ctx.beginPath();
            ctx.arc(x + 20, y + 20, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${i + 1}`, x + 20, y + 25);
          } catch {
            // Placeholder for failed image
            ctx.fillStyle = "#2d2d44";
            roundRect(x, y, cellSize, cellSize, 8);
            ctx.fill();
            ctx.fillStyle = "#666";
            ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${i + 1}`, x + cellSize / 2, y + cellSize / 2 + 6);
          }
        } else {
          // Empty placeholder with dashed border
          ctx.fillStyle = "#1e1b2e";
          roundRect(x, y, cellSize, cellSize, 8);
          ctx.fill();
          ctx.strokeStyle = "#4c4c6d";
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 4]);
          roundRect(x + 4, y + 4, cellSize - 8, cellSize - 8, 6);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#555";
          ctx.font = "14px 'Segoe UI', Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${i + 1}`, x + cellSize / 2, y + cellSize / 2 + 5);
        }
      }

      // ===== LABELS BAR =====
      const labelY = headerHeight + contentHeight;
      
      // "ANTES" label (coral/red)
      ctx.fillStyle = "#1a0f2e";
      ctx.fillRect(0, labelY, originalWidth, labelHeight);
      ctx.fillStyle = "#f97316";
      ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ANTES", originalWidth / 2, labelY + 24);

      // "POSSÍVEIS RESULTADOS PÓS-TRANSPLANTE" label (turquoise/green)
      ctx.fillStyle = "#1a0f2e";
      ctx.fillRect(gridStartX, labelY, gridWidth, labelHeight);
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 15px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("POSSÍVEIS RESULTADOS PÓS-TRANSPLANTE", gridStartX + gridWidth / 2, labelY + 24);

      // ===== FOOTER =====
      const footerY = labelY + labelHeight;
      
      // Footer background with gradient accent line
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, footerY, canvas.width, footerHeight);
      
      const footerLineGradient = ctx.createLinearGradient(0, footerY, canvas.width, footerY);
      footerLineGradient.addColorStop(0, "#7c3aed");
      footerLineGradient.addColorStop(0.5, "#d946ef");
      footerLineGradient.addColorStop(1, "#7c3aed");
      ctx.fillStyle = footerLineGradient;
      ctx.fillRect(0, footerY, canvas.width, 2);

      // Website URL
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("www.neofolic.com.br", canvas.width / 2, footerY + 26);
      
      // Disclaimer
      ctx.fillStyle = "#9ca3af";
      ctx.font = "11px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Simulação ilustrativa • Resultados podem variar • Consulte seu médico", canvas.width / 2, footerY + 44);

      // Download the image
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `neohairscan-comparativo-${Date.now()}.jpg`;
      link.click();

      toast.success("Imagem composta baixada!");
    } catch (error) {
      console.error("Error generating composite:", error);
      toast.error("Erro ao gerar imagem composta");
    }
  }, [originalImage, newVersionImages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4">
      {/* Plans Modal */}
      <ScanPlansModal 
        open={showPlansModal} 
        onOpenChange={setShowPlansModal}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="hover:bg-muted">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <ScanFace className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">NeoHairScan</h1>
          </div>
        </div>
        
        {/* Credits Display */}
        <div className="flex-1 flex justify-end">
          <ScanCreditsDisplay 
            userId={userId}
            onUpgradeClick={() => setShowPlansModal(true)}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Image Cropper */}
        {showCropper && rawImage && (
          <div className="mb-6">
            <ImageCropper
              imageSrc={rawImage}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          </div>
        )}

        {/* Image Capture Section */}
        {!originalImage && !showCropper && (
          <Card className="bg-slate-900/80 border-purple-500/30 mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 text-center">
                Capture ou faça upload da foto do paciente
              </h2>

              {isCameraOpen ? (
                <div className="space-y-4">
                  <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Face guide overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-80 border-2 border-dashed border-white/50 rounded-[50%]" />
                    </div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button onClick={capturePhoto} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar
                    </Button>
                    <Button variant="outline" onClick={stopCamera} className="border-slate-600 text-slate-300">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={openCamera}
                    className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Usar Câmera
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload de Foto
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Canvas for capture (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Analysis Section */}
        {originalImage && (
          <div className="space-y-6">
          {/* Mode Tabs */}
            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as "progression" | "scan" | "newversion")}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-900/80">
                <TabsTrigger value="progression" className="gap-2 data-[state=active]:bg-orange-600">
                  <TrendingDown className="h-4 w-4" />
                  Progressão
                </TabsTrigger>
                <TabsTrigger value="scan" className="gap-2 data-[state=active]:bg-cyan-600">
                  <Zap className="h-4 w-4" />
                  Scan
                </TabsTrigger>
                <TabsTrigger value="newversion" className="gap-2 data-[state=active]:bg-emerald-600">
                  <Sparkles className="h-4 w-4" />
                  New Version
                </TabsTrigger>
              </TabsList>

              {/* Progression Mode */}
              <TabsContent value="progression" className="mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original */}
                  <Card className="bg-slate-900/80 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-white border-slate-600">
                          Original
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRecrop}
                            className="text-slate-400 hover:text-white"
                            title="Recortar área"
                          >
                            <Crop className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetAnalysis}
                            className="text-slate-400 hover:text-white"
                            title="Nova foto"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <img
                        src={originalImage}
                        alt="Original"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    </CardContent>
                  </Card>

                  {/* Progression Result */}
                  <Card className="bg-slate-900/80 border-orange-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-orange-600">
                          +{yearsProgression[0]} anos
                        </Badge>
                        {progressionImage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadImage(progressionImage, `progressao-${yearsProgression[0]}anos.jpg`)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                        {progressionImage ? (
                          <img
                            src={progressionImage}
                            alt="Progressão"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-slate-500 p-4">
                            <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Ajuste o slider e clique em simular</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Slider Control */}
                <Card className="bg-slate-900/80 border-purple-500/30 mt-6">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Anos de progressão</span>
                        <span className="text-2xl font-bold text-orange-400">
                          {yearsProgression[0]} anos
                        </span>
                      </div>
                      <Slider
                        value={yearsProgression}
                        onValueChange={setYearsProgression}
                        max={10}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Hoje</span>
                        <span>5 anos</span>
                        <span>10 anos</span>
                      </div>
                      <Button
                        onClick={() => processImage("progression")}
                        disabled={isProcessing || yearsProgression[0] === 0}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 mr-2" />
                            Simular Progressão
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scan Mode */}
              <TabsContent value="scan" className="mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original */}
                  <Card className="bg-slate-900/80 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-white border-slate-600">
                          Original
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRecrop}
                            className="text-slate-400 hover:text-white"
                            title="Recortar área"
                          >
                            <Crop className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetAnalysis}
                            className="text-slate-400 hover:text-white"
                            title="Nova foto"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <img
                        src={originalImage}
                        alt="Original"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    </CardContent>
                  </Card>

                  {/* Scan Result */}
                  <Card className="bg-slate-900/80 border-cyan-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-cyan-600">
                          Mapa de Densidade
                        </Badge>
                        {scanImage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadImage(scanImage, "scan-densidade.jpg")}
                            className="text-slate-400 hover:text-white"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                        {scanImage ? (
                          <img
                            src={scanImage}
                            alt="Scan"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-slate-500 p-4">
                            <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Clique para gerar o scan</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Scan Button */}
                <Card className="bg-slate-900/80 border-purple-500/30 mt-6">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-center text-slate-300 text-sm">
                        O scan analisa a densidade capilar e gera uma visualização em modo "raio-X"
                        para identificar áreas de maior e menor densidade folicular.
                      </div>
                      
                      {/* Legend */}
                      <div className="flex justify-center gap-6 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-cyan-500" />
                          <span className="text-xs text-slate-400">Alta densidade</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-r from-yellow-500 to-orange-500" />
                          <span className="text-xs text-slate-400">Média densidade</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-500 to-red-500" />
                          <span className="text-xs text-slate-400">Baixa densidade</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => processImage("scan")}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando Scan...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Gerar Scan de Densidade
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* New Version Mode */}
              <TabsContent value="newversion" className="mt-6">
                <div className="space-y-6">
                  {/* Hair Style Selector */}
                  <Card className="bg-slate-900/80 border-emerald-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                        <span className="text-white font-medium">Escolha o estilo de cabelo</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { id: "natural", label: "Natural" },
                          { id: "short", label: "Curto" },
                          { id: "slick", label: "Penteado" },
                          { id: "textured", label: "Texturizado" },
                          { id: "wavy", label: "Ondulado" },
                          { id: "classic", label: "Clássico" },
                        ].map((style) => (
                          <Button
                            key={style.id}
                            variant={selectedHairStyle === style.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedHairStyle(style.id)}
                            className={selectedHairStyle === style.id 
                              ? "bg-emerald-600 hover:bg-emerald-700" 
                              : "border-slate-600 text-slate-300 hover:bg-slate-800"
                            }
                          >
                            {style.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Grid Layout: Original (left) + 12 Variations (right) */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Original Photo - Takes ~40% width */}
                    <div className="lg:w-[40%] flex-shrink-0">
                      <Card className="bg-slate-900/80 border-purple-500/30 h-full">
                        <CardContent className="p-4 h-full flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-white border-slate-600">
                              Foto Original
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRecrop}
                                className="text-slate-400 hover:text-white"
                                title="Recortar área"
                              >
                                <Crop className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetAnalysis}
                                className="text-slate-400 hover:text-white"
                                title="Nova foto"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <img
                              src={originalImage}
                              alt="Original"
                              className="w-full max-h-[500px] object-contain rounded-lg"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Generated Variations Grid - 4 columns x 3 rows */}
                    <div className="lg:w-[60%]">
                      <Card className="bg-slate-900/80 border-emerald-500/30 h-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className="bg-emerald-600">
                              <Grid3X3 className="h-3 w-3 mr-1" />
                              Variações ({newVersionImages.length}/12)
                            </Badge>
                            <div className="flex items-center gap-1">
                              {newVersionImages.length > 0 && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowGalleryModal(true)}
                                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                                    title="Visualizar galeria"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={downloadCompositeImage}
                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                                    title="Baixar todas (antes + depois)"
                                  >
                                    <ImageDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setNewVersionImages([])}
                                    className="text-slate-400 hover:text-white"
                                    title="Limpar todas"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* 4x3 Grid */}
                          <div className="grid grid-cols-4 gap-1">
                            {Array.from({ length: 12 }).map((_, index) => {
                              const img = newVersionImages[index];
                              return (
                                <div 
                                  key={index} 
                                  className={`relative aspect-[3/4] rounded overflow-hidden ${
                                    img ? '' : 'bg-slate-800/50 border border-dashed border-slate-700'
                                  }`}
                                >
                                  {img ? (
                                    <div className="relative group w-full h-full">
                                      <img
                                        src={img}
                                        alt={`Versão ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => downloadImage(img, `new-version-${index + 1}.jpg`)}
                                          className="text-white hover:bg-white/20 h-6 w-6 p-0"
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                      <span className="text-xs">{index + 1}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Generate Button + Download All */}
                  <Card className="bg-slate-900/80 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 text-center sm:text-left text-slate-300 text-sm">
                          {newVersionImages.length === 0 
                            ? "Gera 12 simulações de como o paciente ficará após o transplante capilar."
                            : `${newVersionImages.length}/12 variações geradas. ${12 - newVersionImages.length} restantes.`
                          }
                        </div>
                        
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                          {newVersionImages.length > 0 && (
                            <>
                              <Button
                                onClick={() => setShowGalleryModal(true)}
                                variant="outline"
                                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Button>
                              <Button
                                onClick={downloadCompositeImage}
                                variant="outline"
                                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                              >
                                <ImageDown className="h-4 w-4 mr-2" />
                                Baixar Grade
                              </Button>
                            </>
                          )}
                          
                          <Button
                            onClick={() => processImage("newversion")}
                            disabled={isProcessing || newVersionImages.length >= 12}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 min-w-[180px]"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Gerando... ({newVersionImages.length + 1}/12)
                              </>
                            ) : newVersionImages.length >= 12 ? (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Grid Completo!
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                {newVersionImages.length === 0 ? "Gerar 12 Variações" : `Gerar Mais (+${12 - newVersionImages.length})`}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Gallery Modal */}
        <NewVersionGalleryModal
          open={showGalleryModal}
          onOpenChange={setShowGalleryModal}
          images={newVersionImages}
          originalImage={originalImage}
          onDownloadComposite={downloadCompositeImage}
        />
      </div>
    </div>
  );
}
