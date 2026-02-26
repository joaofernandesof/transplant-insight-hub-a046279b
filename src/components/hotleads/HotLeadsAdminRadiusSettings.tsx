import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Radar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useHotLeadsRadiusSetting } from '@/hooks/useHotLeadsRadiusSetting';

export function HotLeadsAdminRadiusSettings() {
  const { radiusKm, saveRadius, refetch } = useHotLeadsRadiusSetting();
  const [localRadius, setLocalRadius] = useState(radiusKm);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeTarget, setGeocodeTarget] = useState<'both' | 'leads' | 'users'>('both');
  const [geocodeResult, setGeocodeResult] = useState<{ geocoded: number; failed: number } | null>(null);

  // Sync local state when setting loads
  useState(() => { setLocalRadius(radiusKm); });

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveRadius(localRadius);
    setIsSaving(false);
    if (success) {
      toast.success(`Raio atualizado para ${localRadius} km`);
    } else {
      toast.error('Erro ao salvar o raio');
    }
  };

  const handleGeocode = async () => {
    setIsGeocoding(true);
    setGeocodeResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-cities', {
        body: { target: geocodeTarget, limit: 50 },
      });
      if (error) throw error;
      setGeocodeResult(data);
      toast.success(`Geocodificação: ${data.geocoded} registros atualizados, ${data.failed} falhas`);
    } catch (e: any) {
      toast.error('Erro na geocodificação: ' + (e.message || 'desconhecido'));
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radar className="h-5 w-5 text-primary" />
            Raio de Abrangência de Leads
          </CardTitle>
          <CardDescription>
            Define o raio máximo (em km) da cidade do licenciado para exibir leads disponíveis. 
            Leads fora deste raio não serão visíveis para o licenciado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Raio atual: <strong>{localRadius} km</strong></Label>
            <Slider
              value={[localRadius]}
              onValueChange={([v]) => setLocalRadius(v)}
              min={10}
              max={500}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>10 km</span>
              <span>100 km</span>
              <span>250 km</span>
              <span>500 km</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={1000}
              value={localRadius}
              onChange={(e) => setLocalRadius(Math.max(1, parseInt(e.target.value) || 100))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">km</span>
            <Button onClick={handleSave} disabled={isSaving || localRadius === radiusKm} size="sm">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </div>

          {localRadius !== radiusKm && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Alteração não salva. Clique em Salvar para aplicar.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Geocodificação de Coordenadas
          </CardTitle>
          <CardDescription>
            Para o filtro por raio funcionar, leads e licenciados precisam ter coordenadas geográficas. 
            Clique abaixo para geocodificar automaticamente (processa 50 registros por vez via OpenStreetMap).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={geocodeTarget === 'both' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGeocodeTarget('both')}
            >
              Ambos
            </Button>
            <Button
              variant={geocodeTarget === 'leads' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGeocodeTarget('leads')}
            >
              Apenas Leads
            </Button>
            <Button
              variant={geocodeTarget === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGeocodeTarget('users')}
            >
              Apenas Licenciados
            </Button>
          </div>

          <Button onClick={handleGeocode} disabled={isGeocoding} className="w-full sm:w-auto">
            {isGeocoding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isGeocoding ? 'Geocodificando...' : 'Geocodificar Agora'}
          </Button>

          {geocodeResult && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p>✅ <strong>{geocodeResult.geocoded}</strong> registros geocodificados</p>
              {geocodeResult.failed > 0 && (
                <p className="text-amber-600">⚠️ <strong>{geocodeResult.failed}</strong> falhas (cidades não encontradas)</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Execute novamente para processar mais registros pendentes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
