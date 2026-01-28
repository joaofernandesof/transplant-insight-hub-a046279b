/**
 * NewVersionGalleryModal - Full-size gallery viewer for generated variations
 * Allows viewing, navigating, and downloading individual or all images
 * Downloads always include branding with "Antes/Depois" comparison
 */

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Grid3X3,
  Maximize2,
  ImageDown,
} from "lucide-react";
import { toast } from "sonner";

interface NewVersionGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  originalImage: string | null;
  onDownloadComposite: () => void;
  initialIndex?: number | null;
}

/**
 * Creates a branded "Antes/Depois" image with NeoFolic branding
 */
async function createBrandedComparison(
  originalImageSrc: string,
  generatedImageSrc: string,
  variationNumber: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const originalImg = new Image();
    const generatedImg = new Image();
    originalImg.crossOrigin = "anonymous";
    generatedImg.crossOrigin = "anonymous";

    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount < 2) return;

      try {
        // Canvas dimensions
        const imgWidth = 400;
        const imgHeight = 500;
        const headerHeight = 80;
        const footerHeight = 60;
        const gap = 20;
        const padding = 30;
        
        const canvasWidth = (imgWidth * 2) + gap + (padding * 2);
        const canvasHeight = imgHeight + headerHeight + footerHeight + (padding * 2);

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        bgGradient.addColorStop(0, "#1e1b4b");
        bgGradient.addColorStop(0.5, "#312e81");
        bgGradient.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Header - NeoFolic branding
        ctx.fillStyle = "#c9a86c";
        ctx.font = "bold 28px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Neo Folic", canvasWidth / 2, 40);
        
        ctx.fillStyle = "#a78bfa";
        ctx.font = "16px Arial, sans-serif";
        ctx.fillText("Saúde Capilar • www.neofolic.com.br", canvasWidth / 2, 65);

        // Draw "ANTES" image (original)
        const beforeX = padding;
        const beforeY = headerHeight + padding;
        
        // Image container with rounded corners effect
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(beforeX - 4, beforeY - 4, imgWidth + 8, imgHeight + 8);
        
        // Draw original image
        const origAspect = originalImg.width / originalImg.height;
        let drawOrigW = imgWidth;
        let drawOrigH = imgHeight;
        let origOffsetX = 0;
        let origOffsetY = 0;
        
        if (origAspect > imgWidth / imgHeight) {
          drawOrigH = imgWidth / origAspect;
          origOffsetY = (imgHeight - drawOrigH) / 2;
        } else {
          drawOrigW = imgHeight * origAspect;
          origOffsetX = (imgWidth - drawOrigW) / 2;
        }
        
        ctx.drawImage(originalImg, beforeX + origOffsetX, beforeY + origOffsetY, drawOrigW, drawOrigH);
        
        // "ANTES" label
        ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
        ctx.fillRect(beforeX, beforeY + imgHeight - 40, 100, 32);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("ANTES", beforeX + 15, beforeY + imgHeight - 17);

        // Draw "DEPOIS" image (generated)
        const afterX = padding + imgWidth + gap;
        const afterY = headerHeight + padding;
        
        // Image container
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(afterX - 4, afterY - 4, imgWidth + 8, imgHeight + 8);
        
        // Draw generated image
        const genAspect = generatedImg.width / generatedImg.height;
        let drawGenW = imgWidth;
        let drawGenH = imgHeight;
        let genOffsetX = 0;
        let genOffsetY = 0;
        
        if (genAspect > imgWidth / imgHeight) {
          drawGenH = imgWidth / genAspect;
          genOffsetY = (imgHeight - drawGenH) / 2;
        } else {
          drawGenW = imgHeight * genAspect;
          genOffsetX = (imgWidth - drawGenW) / 2;
        }
        
        ctx.drawImage(generatedImg, afterX + genOffsetX, afterY + genOffsetY, drawGenW, drawGenH);
        
        // "DEPOIS" label with variation number
        ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
        ctx.fillRect(afterX, afterY + imgHeight - 40, 140, 32);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`DEPOIS #${variationNumber}`, afterX + 12, afterY + imgHeight - 17);

        // Footer
        ctx.fillStyle = "#6b7280";
        ctx.font = "12px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "Simulação ilustrativa gerada por IA • Resultados podem variar",
          canvasWidth / 2,
          canvasHeight - 25
        );
        
        ctx.fillStyle = "#9ca3af";
        ctx.font = "11px Arial, sans-serif";
        ctx.fillText(
          "NeoHairScan - Tecnologia NeoFolic © 2026",
          canvasWidth / 2,
          canvasHeight - 10
        );

        resolve(canvas.toDataURL("image/jpeg", 0.95));
      } catch (error) {
        reject(error);
      }
    };

    originalImg.onload = onLoad;
    generatedImg.onload = onLoad;
    originalImg.onerror = () => reject(new Error("Failed to load original image"));
    generatedImg.onerror = () => reject(new Error("Failed to load generated image"));
    
    originalImg.src = originalImageSrc;
    generatedImg.src = generatedImageSrc;
  });
}

export function NewVersionGalleryModal({
  open,
  onOpenChange,
  images,
  originalImage,
  onDownloadComposite,
  initialIndex = null,
}: NewVersionGalleryModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Update when modal opens with initialIndex
  useEffect(() => {
    if (open && initialIndex !== null) {
      setSelectedIndex(initialIndex);
      setViewMode("single");
    } else if (!open) {
      // Reset when modal closes
      setSelectedIndex(null);
      setViewMode("grid");
    }
  }, [open, initialIndex]);

  // Download individual image with branding
  const downloadImage = useCallback(async (imageData: string, index: number) => {
    if (!originalImage) {
      toast.error("Imagem original não disponível");
      return;
    }

    setIsDownloading(true);
    try {
      const brandedImage = await createBrandedComparison(originalImage, imageData, index + 1);
      
      const link = document.createElement("a");
      link.href = brandedImage;
      link.download = `neofolic-antes-depois-variacao-${index + 1}.jpg`;
      link.click();
      toast.success(`Comparação ${index + 1} baixada com sucesso!`);
    } catch (error) {
      console.error("Error creating branded image:", error);
      toast.error("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  }, [originalImage]);

  // Navigate to next/previous image
  const navigateImage = useCallback((direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    
    if (direction === "prev") {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1);
    } else {
      setSelectedIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0);
    }
  }, [selectedIndex, images.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (viewMode === "single" && selectedIndex !== null) {
      if (e.key === "ArrowLeft") navigateImage("prev");
      if (e.key === "ArrowRight") navigateImage("next");
      if (e.key === "Escape") setViewMode("grid");
    }
  }, [viewMode, selectedIndex, navigateImage]);

  // Open single view
  const openSingleView = (index: number) => {
    setSelectedIndex(index);
    setViewMode("single");
  };

  // Back to grid
  const backToGrid = () => {
    setViewMode("grid");
    setSelectedIndex(null);
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl w-[95vw] max-h-[90vh] bg-slate-950 border-purple-500/30 p-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/50 to-fuchsia-900/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Grid3X3 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-lg font-semibold">Galeria de Variações</span>
                <p className="text-sm text-purple-300 font-normal">
                  {images.length} {images.length === 1 ? "imagem gerada" : "imagens geradas"}
                </p>
              </div>
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              {viewMode === "single" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={backToGrid}
                  className="text-purple-300 hover:text-white hover:bg-purple-500/20"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Ver Grade
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadComposite}
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
              >
                <ImageDown className="h-4 w-4 mr-2" />
                Baixar Todas
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === "grid" ? (
            /* Grid View - 2x3 layout for 6 variations */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/20"
                  onClick={() => openSingleView(index)}
                >
                  <img
                    src={img}
                    alt={`Variação ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Number badge */}
                  <Badge className="absolute top-2 left-2 bg-black/70 text-white text-xs">
                    {index + 1}
                  </Badge>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                      <span className="text-white text-sm font-medium">
                        Variação {index + 1}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(img, index);
                          }}
                          disabled={isDownloading}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSingleView(index);
                          }}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Single Image View */
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
              {selectedIndex !== null && images[selectedIndex] && (
                <>
                  {/* Navigation and image container */}
                  <div className="relative w-full flex items-center justify-center">
                    {/* Previous button */}
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => navigateImage("prev")}
                      className="absolute left-0 z-10 h-16 w-16 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>

                    {/* Image */}
                    <div className="max-w-3xl w-full mx-16">
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-purple-500/30">
                        <img
                          src={images[selectedIndex]}
                          alt={`Variação ${selectedIndex + 1}`}
                          className="w-full h-auto max-h-[60vh] object-contain bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Next button */}
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => navigateImage("next")}
                      className="absolute right-0 z-10 h-16 w-16 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </div>

                  {/* Image info and actions */}
                  <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-emerald-600 text-white px-4 py-1">
                        Variação {selectedIndex + 1} de {images.length}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => downloadImage(images[selectedIndex], selectedIndex)}
                        disabled={isDownloading}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isDownloading ? "Gerando..." : "Baixar Antes/Depois"}
                      </Button>
                    </div>
                    
                    {/* Info about download */}
                    <p className="text-xs text-slate-500 text-center max-w-md">
                      O download inclui comparação "Antes e Depois" com a marca Neo Folic
                    </p>

                    {/* Thumbnail navigation */}
                    <div className="flex gap-2 mt-4 overflow-x-auto max-w-full pb-2">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedIndex(index)}
                          className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === selectedIndex
                              ? "border-emerald-500 ring-2 ring-emerald-500/50"
                              : "border-slate-700 hover:border-purple-500"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumb ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer with tips */}
        <div className="px-6 py-3 border-t border-purple-500/20 bg-slate-900/50">
          <p className="text-xs text-slate-500 text-center">
            {viewMode === "single" 
              ? "Use as setas ← → do teclado para navegar • ESC para voltar à grade"
              : "Clique em uma imagem para ampliar • Downloads incluem branding NeoFolic"
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
