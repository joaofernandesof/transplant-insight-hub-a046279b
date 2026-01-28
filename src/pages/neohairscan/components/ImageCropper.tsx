/**
 * ImageCropper - Component for selecting and cropping image area
 * Uses react-easy-crop for zoom and pan functionality
 */

import { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  Move,
  Maximize2,
} from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

// Helper function to create cropped image
const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
};

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      const croppedImage = await createCroppedImage(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Card className="bg-slate-900/95 border-purple-500/30">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge className="bg-fuchsia-600">
            <Maximize2 className="h-3 w-3 mr-1" />
            Selecionar Área
          </Badge>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Move className="h-3 w-3" />
            Arraste para posicionar
          </div>
        </div>

        {/* Zoom Control - ABOVE the image */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ZoomOut className="h-4 w-4" />
              <span>Zoom</span>
            </div>
            <span className="text-sm text-fuchsia-400 font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <ZoomIn className="h-4 w-4 text-slate-300" />
          </div>
          <Slider
            value={[zoom]}
            onValueChange={(value) => setZoom(value[0])}
            min={1}
            max={3}
            step={0.1}
            className="py-2"
          />
        </div>

        {/* Action Buttons - ABOVE the image */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {isProcessing ? "Aplicando..." : "Confirmar"}
          </Button>
        </div>

        {/* Instructions */}
        <p className="text-xs text-center text-slate-500">
          Selecione a área do couro cabeludo que deseja analisar
        </p>

        {/* Cropper Container - NOW at the bottom */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: {
                borderRadius: "0.75rem",
              },
              cropAreaStyle: {
                border: "2px solid #d946ef",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
