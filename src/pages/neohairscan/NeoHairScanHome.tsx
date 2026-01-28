/**
 * NeoHairScan - Portal Home
 * AI-powered hair analysis and baldness progression simulation
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ScanFace, 
  TrendingDown, 
  Zap, 
  Camera, 
  ArrowRight, 
  User, 
  CreditCard, 
  History, 
  Settings, 
  LogOut,
  ChevronDown
} from "lucide-react";
import HairScanAnalyzer from "./components/HairScanAnalyzer";
import { ScanCreditsDisplay } from "./components/ScanCreditsDisplay";
import { ScanPlansModal } from "./components/ScanPlansModal";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export default function NeoHairScanHome() {
  const navigate = useNavigate();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const { user, logout } = useUnifiedAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (showAnalyzer) {
    return <HairScanAnalyzer onBack={() => setShowAnalyzer(false)} />;
  }

  const userInitials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Top Bar with Account Access */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-300">
            <ScanFace className="h-5 w-5" />
            <span className="font-medium text-white">NeoHairScan</span>
          </div>
          
          <div className="flex items-center gap-3">
            {user && (
              <ScanCreditsDisplay 
                userId={user.id}
                onUpgradeClick={() => setShowPlansModal(true)}
              />
            )}
            
            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/50 px-2"
                >
                  <Avatar className="h-8 w-8 border border-purple-500/30">
                    <AvatarImage src={user?.avatarUrl || ''} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                    {user?.fullName || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700">
                <DropdownMenuLabel className="text-slate-400 font-normal">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{user?.fullName || 'Usuário'}</span>
                    <span className="text-xs truncate">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                
                <DropdownMenuItem 
                  onClick={() => setShowPlansModal(true)}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Planos & Assinatura
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setShowAnalyzer(true)}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <History className="h-4 w-4 mr-2" />
                  Histórico de Análises
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-slate-700" />
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Plans Modal */}
      <ScanPlansModal 
        open={showPlansModal} 
        onOpenChange={setShowPlansModal}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl mb-4">
            <ScanFace className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">NeoHairScan</h1>
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
    </div>
  );
}
