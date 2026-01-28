/**
 * Vision - Portal Home
 * AI-powered hair analysis and baldness progression simulation
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingDown, 
  Zap, 
  Camera, 
  ArrowRight
} from "lucide-react";
import HairScanAnalyzer from "./components/HairScanAnalyzer";
import { ScanCreditsDisplay } from "./components/ScanCreditsDisplay";
import { VisionLayout } from "./components/VisionLayout";
import { VisionIcon } from "@/components/icons/VisionIcon";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export default function VisionHome() {
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const { user } = useUnifiedAuth();

  if (showAnalyzer) {
    return <HairScanAnalyzer onBack={() => setShowAnalyzer(false)} />;
  }

  return (
    <VisionLayout onStartAnalysis={() => setShowAnalyzer(true)}>
      <div className="p-6 lg:p-8">
        {/* Credits Display */}
        <div className="flex justify-end mb-6">
          {user && (
            <ScanCreditsDisplay 
              userId={user.id}
              onUpgradeClick={() => window.dispatchEvent(new CustomEvent('open-scan-plans'))}
            />
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl mb-4">
            <VisionIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Vision</h1>
          <p className="text-lg text-purple-200">
            Análise Capilar com Inteligência Artificial
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="bg-slate-900/80 border-purple-500/30 text-white">
            <CardHeader>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl w-fit mb-2">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Simulador de Progressão</CardTitle>
              <CardDescription className="text-slate-400">
                Visualize a evolução da calvície ao longo dos anos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Slider interativo de 0 a 10 anos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Simulação realista baseada em IA
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Demonstração visual para o paciente
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-purple-500/30 text-white">
            <CardHeader>
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl w-fit mb-2">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Modo Scan / Raio-X</CardTitle>
              <CardDescription className="text-slate-400">
                Mapeamento de densidade do couro cabeludo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Visualização em negativo médico
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Mapa de calor de densidade
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Identificação de áreas de alopecia
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setShowAnalyzer(true)}
            className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white px-8 py-6 text-lg gap-3"
          >
            <Camera className="h-5 w-5" />
            Iniciar Análise
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-sm text-slate-500">
          <p>Tecnologia de IA para auxílio diagnóstico</p>
          <p className="mt-1">As simulações são ilustrativas e não substituem avaliação médica</p>
        </div>
      </div>
    </VisionLayout>
  );
}
