import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Users, GitMerge, ShieldAlert, Tag } from 'lucide-react';
import { useAccountSettings, type DuplicateAction, type DuplicateField } from '@/hooks/useAccountSettings';
import { cn } from '@/lib/utils';

const DUPLICATE_FIELDS: { value: DuplicateField; label: string; description: string }[] = [
  { value: 'phone', label: 'Telefone', description: 'Verifica apenas o número de telefone' },
  { value: 'email', label: 'Email', description: 'Verifica apenas o endereço de email' },
  { value: 'phone_or_email', label: 'Telefone OU Email', description: 'Verifica ambos os campos (recomendado)' },
];

const DUPLICATE_ACTIONS: { value: DuplicateAction; label: string; description: string; icon: typeof GitMerge }[] = [
  { value: 'block', label: 'Bloquear entrada', description: 'Impedir a criação do lead duplicado', icon: ShieldAlert },
  { value: 'merge', label: 'Mesclar dados', description: 'Atualizar os campos vazios do lead existente com os novos dados', icon: GitMerge },
  { value: 'allow_tagged', label: 'Permitir com tag', description: 'Criar o lead mesmo assim, mas marcar como "duplicado"', icon: Tag },
];

export function DuplicateSettingsTab() {
  const { duplicateSettings, isLoading, saveDuplicateSettings } = useAccountSettings();
  
  const [enabled, setEnabled] = useState(true);
  const [checkField, setCheckField] = useState<DuplicateField>('phone_or_email');
  const [action, setAction] = useState<DuplicateAction>('merge');

  useEffect(() => {
    if (duplicateSettings) {
      setEnabled(duplicateSettings.enabled);
      setCheckField(duplicateSettings.check_field);
      setAction(duplicateSettings.action);
    }
  }, [duplicateSettings]);

  const hasChanges =
    enabled !== duplicateSettings.enabled ||
    checkField !== duplicateSettings.check_field ||
    action !== duplicateSettings.action;

  const handleSave = () => {
    saveDuplicateSettings.mutate({ enabled, check_field: checkField, action });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--avivar-muted-foreground))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Duplicate Detection */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">Detecção de Duplicatas</CardTitle>
                <CardDescription>Configure como o sistema lida com leads duplicados</CardDescription>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardHeader>

        {enabled && (
          <CardContent className="space-y-6">
            {/* Check Field */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                Verificar por qual campo?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DUPLICATE_FIELDS.map(field => (
                  <button
                    key={field.value}
                    type="button"
                    onClick={() => setCheckField(field.value)}
                    className={cn(
                      'text-left p-3 rounded-xl border transition-all',
                      checkField === field.value
                        ? 'border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.08)]'
                        : 'border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] hover:border-[hsl(var(--avivar-primary)/0.3)]'
                    )}
                  >
                    <p className={cn(
                      'text-sm font-medium',
                      checkField === field.value
                        ? 'text-[hsl(var(--avivar-primary))]'
                        : 'text-[hsl(var(--avivar-foreground))]'
                    )}>
                      {field.label}
                    </p>
                    <p className="text-[11px] text-[hsl(var(--avivar-muted-foreground))] mt-0.5">
                      {field.description}
                    </p>
                    {field.value === 'phone_or_email' && (
                      <Badge variant="outline" className="mt-1.5 text-[9px] px-1.5 py-0 h-4 border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))]">
                        Recomendado
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                O que fazer ao detectar duplicata?
              </Label>
              <div className="space-y-3">
                {DUPLICATE_ACTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAction(opt.value)}
                      className={cn(
                        'w-full text-left flex items-center gap-3 p-4 rounded-xl border transition-all',
                        action === opt.value
                          ? 'border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.08)]'
                          : 'border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] hover:border-[hsl(var(--avivar-primary)/0.3)]'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        action === opt.value
                          ? 'bg-[hsl(var(--avivar-primary)/0.2)]'
                          : 'bg-[hsl(var(--avivar-muted))]'
                      )}>
                        <Icon className={cn(
                          'h-4 w-4',
                          action === opt.value
                            ? 'text-[hsl(var(--avivar-primary))]'
                            : 'text-[hsl(var(--avivar-muted-foreground))]'
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          'text-sm font-medium',
                          action === opt.value
                            ? 'text-[hsl(var(--avivar-primary))]'
                            : 'text-[hsl(var(--avivar-foreground))]'
                        )}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-[hsl(var(--avivar-muted-foreground))]">
                          {opt.description}
                        </p>
                      </div>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        action === opt.value
                          ? 'border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary))]'
                          : 'border-[hsl(var(--avivar-border))]'
                      )}>
                        {action === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save */}
            {hasChanges && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saveDuplicateSettings.isPending}
                  className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                >
                  {saveDuplicateSettings.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
