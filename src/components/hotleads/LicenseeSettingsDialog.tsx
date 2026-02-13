import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, AlertTriangle } from 'lucide-react';
import type { HotLeadsSettings } from '@/hooks/useHotLeadsSettings';

interface LicenseeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: HotLeadsSettings | null;
  onSave: (values: { licensee_name: string; clinic_name: string; clinic_city: string }) => Promise<boolean>;
  required?: boolean; // If true, user can't dismiss without saving
}

export function LicenseeSettingsDialog({ open, onOpenChange, settings, onSave, required }: LicenseeSettingsDialogProps) {
  const [licenseeName, setLicenseeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLicenseeName(settings.licensee_name);
      setClinicName(settings.clinic_name);
      setClinicCity(settings.clinic_city);
    }
  }, [settings]);

  const isValid = licenseeName.trim().length >= 2 && clinicName.trim().length >= 2 && clinicCity.trim().length >= 2;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    const success = await onSave({
      licensee_name: licenseeName.trim(),
      clinic_name: clinicName.trim(),
      clinic_city: clinicCity.trim(),
    });
    setIsSaving(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={required ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={required ? (e) => e.preventDefault() : undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {required ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <Settings className="h-5 w-5 text-primary" />
            )}
            {required ? 'Configure seus dados antes de continuar' : 'Configurações de Contato'}
          </DialogTitle>
          <DialogDescription>
            {required
              ? 'Para adquirir leads, preencha seus dados que serão usados na mensagem padronizada de primeiro contato via WhatsApp.'
              : 'Esses dados serão usados na mensagem padronizada enviada aos leads via WhatsApp.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="licensee_name">Seu Nome (Licenciado)</Label>
            <Input
              id="licensee_name"
              placeholder="Ex: Dr. João Silva"
              value={licenseeName}
              onChange={(e) => setLicenseeName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic_name">Nome da Clínica</Label>
            <Input
              id="clinic_name"
              placeholder="Ex: Clínica Capilar Premium"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic_city">Cidade da Clínica</Label>
            <Input
              id="clinic_city"
              placeholder="Ex: São Paulo - SP"
              value={clinicCity}
              onChange={(e) => setClinicCity(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
        <DialogFooter>
          {!required && (
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !isValid}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
