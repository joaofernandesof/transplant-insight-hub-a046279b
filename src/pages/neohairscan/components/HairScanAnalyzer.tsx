/**
 * HairScanAnalyzer - Main analysis component
 * Handles photo capture, progression simulation, and scan visualization
 */

import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ImageCropper from "./ImageCropper";

interface HairScanAnalyzerProps {
  onBack: () => void;
}

export default function HairScanAnalyzer({ onBack }: HairScanAnalyzerProps) {
  const [rawImage, setRawImage] = useState<string | null>(null); // Image before cropping
  const [originalImage, setOriginalImage] = useState<string | null>(null); // Cropped image for analysis
  const [progressionImage, setProgressionImage] = useState<string | null>(null);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [yearsProgression, setYearsProgression] = useState([0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState<"progression" | "scan">("progression");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraOpen(true);
      }
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
  const processImage = useCallback(async (action: "progression" | "scan") => {
    if (!originalImage) {
      toast.error("Capture ou faça upload de uma foto primeiro");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("hair-scan-analysis", {
        body: {
          action,
          imageBase64: originalImage,
          yearsProgression: yearsProgression[0],
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (action === "progression") {
        setProgressionImage(data.image);
        toast.success(`Simulação de ${yearsProgression[0]} anos gerada!`);
      } else {
        setScanImage(data.image);
        toast.success("Scan de densidade gerado!");
      }
    } catch (error: any) {
      console.error("Processing error:", error);
      const errorMessage = error?.message || "Erro ao processar imagem. Tente novamente.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, yearsProgression]);

  // Reset analysis
  const resetAnalysis = () => {
    setRawImage(null);
    setOriginalImage(null);
    setProgressionImage(null);
    setScanImage(null);
    setYearsProgression([0]);
    setShowCropper(false);
    stopCamera();
  };

  // Download image
  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = filename;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <ScanFace className="h-6 w-6 text-fuchsia-400" />
          <h1 className="text-xl font-bold text-white">NeoHairScan</h1>
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
            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as "progression" | "scan")}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-900/80">
                <TabsTrigger value="progression" className="gap-2 data-[state=active]:bg-orange-600">
                  <TrendingDown className="h-4 w-4" />
                  Progressão
                </TabsTrigger>
                <TabsTrigger value="scan" className="gap-2 data-[state=active]:bg-cyan-600">
                  <Zap className="h-4 w-4" />
                  Scan
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
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
