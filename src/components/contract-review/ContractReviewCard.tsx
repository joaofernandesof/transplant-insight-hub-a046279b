/**
 * Card de solicitação de conferência contratual
 */

import { useState } from "react";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContractReviewRequest, CONTRACT_TYPES, CONTRACT_STATUS_CONFIG } from "@/hooks/useContractReview";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  User, 
  Building2, 
  Calendar,
  AlertTriangle,
  Paperclip,
  Eye
} from "lucide-react";
import { ContractReviewDetailDialog } from "./ContractReviewDetailDialog";

interface ContractReviewCardProps {
  request: ContractReviewRequest;
}

export function ContractReviewCard({ request }: ContractReviewCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const typeLabel = CONTRACT_TYPES.find(t => t.value === request.tipo_contrato)?.label || request.tipo_contrato;
  const statusConfig = CONTRACT_STATUS_CONFIG[request.status];
  
  const isSlaExpired = request.sla_deadline && isPast(new Date(request.sla_deadline));
  const slaUrgent = request.sla_deadline && !isSlaExpired && 
    new Date(request.sla_deadline).getTime() - Date.now() < 12 * 60 * 60 * 1000; // 12h

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
        style={{ 
          borderLeftColor: request.classificacao === 'estrategico' ? 'hsl(var(--primary))' : 'hsl(var(--muted))' 
        }}
        onClick={() => setIsDetailOpen(true)}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-muted-foreground">
                {request.request_number}
              </p>
              <p className="font-medium text-sm truncate">
                {request.nome_outra_parte}
              </p>
            </div>
            <Badge className={`text-xs ${statusConfig.color}`}>
              {request.classificacao === 'estrategico' ? '⭐' : ''} {typeLabel}
            </Badge>
          </div>

          {/* Info */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{request.area_empresa}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Assinatura: {format(new Date(request.data_assinatura_prevista), 'dd/MM/yyyy')}</span>
            </div>
            {request.creator && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{request.creator.full_name}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {request.attachments && request.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  <span>{request.attachments.length}</span>
                </div>
              )}
              
              {/* SLA Badge */}
              {request.sla_deadline && (
                <div className={`flex items-center gap-1 text-xs ${
                  isSlaExpired ? 'text-destructive' : slaUrgent ? 'text-orange-600' : 'text-muted-foreground'
                }`}>
                  {(isSlaExpired || slaUrgent) && <AlertTriangle className="h-3 w-3" />}
                  <Clock className="h-3 w-3" />
                  <span>
                    {isSlaExpired 
                      ? 'SLA vencido'
                      : formatDistanceToNow(new Date(request.sla_deadline), { locale: ptBR, addSuffix: true })
                    }
                  </span>
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2"
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailOpen(true);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContractReviewDetailDialog
        request={request}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}
