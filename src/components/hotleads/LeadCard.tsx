import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lock, Phone, Mail, MapPin, Calendar, CheckCircle2, 
  Clock, XCircle, EyeOff, Flame, Timer, DollarSign,
  User, Briefcase
} from 'lucide-react';

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  state: string | null;
  source: string | null;
  interest_level: 'cold' | 'warm' | 'hot';
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  available_at: string | null;
  converted_value: number | null;
  procedures_sold: string[] | null;
  converted_at: string | null;
  procedure_interest: string | null;
  scheduled_at: string | null;
  discard_reason: string | null;
}

export const statusConfig = {
  new: { label: 'Lead Novo', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Clock },
  contacted: { label: 'Lead Captado', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Phone },
  scheduled: { label: 'Consulta Agendada', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Calendar },
  converted: { label: 'Vendido', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2 },
  lost: { label: 'Descartado', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle }
};

export const PROCEDURES = [
  'Transplante Capilar',
  'Transplante de Barba',
  'Transplante de Sobrancelhas',
  'Tratamento Capilar'
];

interface LeadCardProps {
  lead: Lead;
  isMine: boolean;
  isAdmin: boolean;
  canClaim: boolean;
  inPriority: boolean;
  onClaim: (lead: Lead) => void;
  onOpenDetails: (lead: Lead) => void;
  licenseName?: string;
  compact?: boolean;
}

export function LeadCard({
  lead,
  isMine,
  isAdmin,
  canClaim,
  inPriority,
  onClaim,
  onOpenDetails,
  licenseName,
  compact = true
}: LeadCardProps) {
  const isClaimed = !!lead.claimed_by;
  const showData = isMine || isAdmin || !isClaimed;
  const StatusIcon = statusConfig[lead.status].icon;

  if (compact) {
    return (
      <Card 
        className={`hover:shadow-md transition-all cursor-pointer group ${
          isMine ? 'ring-2 ring-primary/50 bg-primary/5' : ''
        } ${isClaimed && !isMine && !isAdmin ? 'opacity-75' : ''}`}
        onClick={() => showData && onOpenDetails(lead)}
      >
        <CardContent className="p-2 lg:p-3">
          {/* Header: Name + Status */}
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {isClaimed && !isMine ? (
                <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              ) : (
                <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              <span className="font-medium text-xs truncate">
                {showData ? lead.name : '••••••••'}
              </span>
            </div>
            <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 flex-shrink-0 ${statusConfig[lead.status].color}`}>
              <StatusIcon className="h-2.5 w-2.5" />
            </Badge>
          </div>

          {/* Procedure Interest */}
          {lead.procedure_interest && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{lead.procedure_interest}</span>
            </div>
          )}

          {/* Location */}
          {showData ? (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">
                {lead.city || 'Cidade'}{lead.state ? `, ${lead.state}` : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
              <EyeOff className="h-2.5 w-2.5 flex-shrink-0" />
              <span>Dados ocultos</span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
            <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
            <span>{new Date(lead.available_at || lead.created_at).toLocaleDateString('pt-BR')}</span>
          </div>

          {/* Converted Value */}
          {lead.status === 'converted' && lead.converted_value && (
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium mb-1.5">
              <DollarSign className="h-2.5 w-2.5 flex-shrink-0" />
              <span>R$ {lead.converted_value.toLocaleString('pt-BR')}</span>
            </div>
          )}

          {/* Owner/Priority Badge */}
          <div className="flex items-center gap-1 flex-wrap mb-1.5">
            {!isClaimed && inPriority && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-0.5 text-orange-600 border-orange-300">
                <Timer className="h-2.5 w-2.5" />
                {lead.state}
              </Badge>
            )}
            {isClaimed && isMine && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1 py-0 h-4">
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                Meu
              </Badge>
            )}
            {isClaimed && !isMine && isAdmin && licenseName && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                <Lock className="h-2.5 w-2.5 mr-0.5" />
                <span className="truncate max-w-[60px]">{licenseName}</span>
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            {!isClaimed && canClaim && (
              <Button 
                size="sm" 
                className="w-full h-6 text-[10px] px-2" 
                onClick={(e) => { e.stopPropagation(); onClaim(lead); }}
              >
                <Flame className="h-2.5 w-2.5 mr-0.5" />
                Captar
              </Button>
            )}
            {showData && isClaimed && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full h-6 text-[10px] px-2"
                onClick={(e) => { e.stopPropagation(); onOpenDetails(lead); }}
              >
                Detalhes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view (non-compact)
  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${isMine ? 'border-primary/50 bg-primary/5' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isClaimed && !isMine && !isAdmin ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : null}
              <h3 className="font-semibold text-lg">
                {showData ? lead.name : '••••••••'}
              </h3>
              <Badge className={statusConfig[lead.status].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[lead.status].label}
              </Badge>
              {lead.procedure_interest && (
                <Badge variant="secondary">{lead.procedure_interest}</Badge>
              )}
              {isMine && (
                <Badge className="bg-primary text-primary-foreground gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Meu Lead
                </Badge>
              )}
              {isClaimed && !isMine && isAdmin && licenseName && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  {licenseName}
                </Badge>
              )}
              {!isClaimed && inPriority && (
                <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300">
                  <Timer className="h-3 w-3" />
                  Prioridade {lead.state}
                </Badge>
              )}
            </div>
            
            {showData ? (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </a>
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-primary">
                    <Mail className="h-4 w-4" />
                    {lead.email}
                  </a>
                )}
                {lead.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {lead.city}{lead.state ? `, ${lead.state}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(lead.available_at || lead.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <EyeOff className="h-4 w-4" />
                <span>Dados ocultos - Lead já capturado</span>
              </div>
            )}
            
            {lead.status === 'converted' && lead.converted_value && (
              <div className="mt-2 flex items-center gap-2 text-green-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">R$ {lead.converted_value.toLocaleString('pt-BR')}</span>
                {lead.procedures_sold && lead.procedures_sold.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    • {lead.procedures_sold.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isClaimed && canClaim && (
              <Button onClick={() => onClaim(lead)}>
                <Flame className="h-4 w-4 mr-2" />
                Captar Lead
              </Button>
            )}
            {showData && isClaimed && (
              <Button variant="outline" onClick={() => onOpenDetails(lead)}>
                Detalhes
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
