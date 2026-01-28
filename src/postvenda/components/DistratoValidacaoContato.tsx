import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, FileCheck, CheckCircle2, XCircle, 
  AlertTriangle, Save, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidacaoContatoData {
  email_remetente?: string;
  nome_remetente?: string;
  contrato_localizado?: boolean;
  paciente_ativo?: boolean;
  remetente_titular?: boolean;
  email_resposta_enviado?: boolean;
}

interface DistratoValidacaoContatoProps {
  data: ValidacaoContatoData;
  onChange: (data: ValidacaoContatoData) => void;
  onSave: () => Promise<void>;
  isReadOnly?: boolean;
  isSaving?: boolean;
}

export function DistratoValidacaoContato({
  data,
  onChange,
  onSave,
  isReadOnly = false,
  isSaving = false
}: DistratoValidacaoContatoProps) {
  // Verificar se todas as condições foram atendidas
  const allConditionsMet = 
    data.contrato_localizado && 
    data.paciente_ativo && 
    data.remetente_titular;
  
  const needsProcuration = 
    data.contrato_localizado && 
    data.paciente_ativo && 
    !data.remetente_titular;

  const cannotProceed = 
    !data.contrato_localizado || 
    !data.paciente_ativo;

  const handleChange = (field: keyof ValidacaoContatoData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Validação do Contato</CardTitle>
          </div>
          {allConditionsMet && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Validado
            </Badge>
          )}
          {needsProcuration && (
            <Badge className="bg-amber-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Procuração Necessária
            </Badge>
          )}
          {cannotProceed && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          )}
        </div>
        <CardDescription>
          Valide os dados do contato antes de prosseguir com o checklist
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Dados do Remetente */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            Dados do Remetente
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_remetente">E-mail do Remetente</Label>
              <Input
                id="email_remetente"
                type="email"
                value={data.email_remetente || ''}
                onChange={(e) => handleChange('email_remetente', e.target.value)}
                placeholder="email@exemplo.com"
                disabled={isReadOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome_remetente">Nome do Remetente</Label>
              <Input
                id="nome_remetente"
                value={data.nome_remetente || ''}
                onChange={(e) => handleChange('nome_remetente', e.target.value)}
                placeholder="Nome completo"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>

        {/* Verificações */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <FileCheck className="h-4 w-4" />
            Verificações Obrigatórias
          </h4>
          
          <div className="space-y-3">
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              data.contrato_localizado 
                ? "bg-green-50 border-green-200" 
                : "bg-muted/50 border-border"
            )}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contrato_localizado"
                  checked={data.contrato_localizado ?? false}
                  onCheckedChange={(checked) => handleChange('contrato_localizado', checked)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="contrato_localizado" className="text-sm font-medium">
                  Contrato Localizado
                </Label>
              </div>
              {data.contrato_localizado ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              data.paciente_ativo 
                ? "bg-green-50 border-green-200" 
                : "bg-muted/50 border-border"
            )}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="paciente_ativo"
                  checked={data.paciente_ativo ?? false}
                  onCheckedChange={(checked) => handleChange('paciente_ativo', checked)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="paciente_ativo" className="text-sm font-medium">
                  Paciente Ativo no Sistema
                </Label>
              </div>
              {data.paciente_ativo ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              data.remetente_titular 
                ? "bg-green-50 border-green-200" 
                : data.contrato_localizado && data.paciente_ativo
                  ? "bg-amber-50 border-amber-200"
                  : "bg-muted/50 border-border"
            )}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remetente_titular"
                  checked={data.remetente_titular ?? false}
                  onCheckedChange={(checked) => handleChange('remetente_titular', checked)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="remetente_titular" className="text-sm font-medium">
                  Remetente é o Titular do Contrato
                </Label>
              </div>
              {data.remetente_titular ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </div>
        </div>

        {/* Resposta por E-mail */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            Resposta ao Paciente
          </h4>
          
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border",
            data.email_resposta_enviado 
              ? "bg-green-50 border-green-200" 
              : "bg-muted/50 border-border"
          )}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email_resposta_enviado"
                checked={data.email_resposta_enviado ?? false}
                onCheckedChange={(checked) => handleChange('email_resposta_enviado', checked)}
                disabled={isReadOnly}
              />
              <div>
                <Label htmlFor="email_resposta_enviado" className="text-sm font-medium">
                  E-mail de Resposta Enviado
                </Label>
                <p className="text-xs text-muted-foreground">
                  {data.remetente_titular 
                    ? 'Script de confirmação enviado' 
                    : 'Script de solicitação de procuração enviado'}
                </p>
              </div>
            </div>
            {data.email_resposta_enviado ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Avisos */}
        {cannotProceed && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-medium">Não é possível prosseguir</p>
                <p className="text-xs mt-1">
                  O contrato precisa ser localizado e o paciente precisa estar ativo no sistema.
                </p>
              </div>
            </div>
          </div>
        )}

        {needsProcuration && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Procuração Necessária</p>
                <p className="text-xs mt-1">
                  O remetente não é o titular. Solicite procuração antes de prosseguir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        {!isReadOnly && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Validação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
