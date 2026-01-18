import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreHorizontal, Edit, Trash2, Phone, User, Check, X, Loader2 } from "lucide-react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SurgerySchedule } from "@/hooks/useSurgerySchedule";

interface SurgeryTableProps {
  surgeries: SurgerySchedule[];
  isLoading: boolean;
  onEdit: (surgery: SurgerySchedule) => void;
  onDelete: (id: string) => void;
  onUpdate: (data: { id: string } & Partial<SurgerySchedule>) => Promise<any>;
}

export function SurgeryTable({ surgeries, isLoading, onEdit, onDelete, onUpdate }: SurgeryTableProps) {
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const getDayOfWeek = (dateStr: string) => {
    return format(parseISO(dateStr), "EEEE", { locale: ptBR });
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    const colors: Record<string, string> = {
      'CATEGORIA A': 'bg-red-100 text-red-700',
      'CATEGORIA B': 'bg-blue-100 text-blue-700',
      'CATEGORIA C': 'bg-amber-100 text-amber-700',
      'CATEGORIA D': 'bg-green-100 text-green-700',
    };
    const shortCategory = category.split(' - ')[0];
    return (
      <Badge variant="secondary" className={colors[shortCategory] || ''}>
        {shortCategory.replace('CATEGORIA ', 'Cat ')}
      </Badge>
    );
  };

  const handleCheckboxChange = async (id: string, field: string, value: boolean) => {
    setUpdatingField(`${id}-${field}`);
    try {
      await onUpdate({ id, [field]: value });
    } finally {
      setUpdatingField(null);
    }
  };

  const CheckboxCell = ({ id, field, value }: { id: string; field: string; value: boolean }) => {
    const isUpdating = updatingField === `${id}-${field}`;
    return (
      <div className="flex items-center justify-center">
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={value}
            onCheckedChange={(checked) => handleCheckboxChange(id, field, !!checked)}
          />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando agenda...</p>
        </CardContent>
      </Card>
    );
  }

  if (surgeries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Nenhuma cirurgia encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10">Data</TableHead>
              <TableHead className="min-w-[180px]">Paciente</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Grau</TableHead>
              <TableHead className="text-right">VGV Inicial</TableHead>
              <TableHead className="text-right">Upgrade</TableHead>
              <TableHead className="text-right">Upsell</TableHead>
              <TableHead className="text-right">VGV Final</TableHead>
              <TableHead className="text-right">Sinal</TableHead>
              <TableHead className="text-right">Restante</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-center">Confirmou</TableHead>
              <TableHead className="text-center">Exames</TableHead>
              <TableHead className="text-center">Contrato</TableHead>
              <TableHead className="text-center">D-7</TableHead>
              <TableHead className="text-center">D-2</TableHead>
              <TableHead className="text-center">D-1</TableHead>
              <TableHead className="text-center">Check-in</TableHead>
              <TableHead className="text-center">D-0</TableHead>
              <TableHead className="text-center">D+1 GPI</TableHead>
              <TableHead className="min-w-[150px]">Acompanhante</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="sticky right-0 bg-muted/50"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surgeries.map((surgery) => (
              <TableRow 
                key={surgery.id}
                className={isToday(parseISO(surgery.surgery_date)) ? 'bg-primary/5' : ''}
              >
                <TableCell className="sticky left-0 bg-background z-10 font-medium">
                  <div>
                    <p className="font-semibold">{formatDate(surgery.surgery_date)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{getDayOfWeek(surgery.surgery_date)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{surgery.patient_name}</p>
                    {surgery.patient_phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {surgery.patient_phone}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getCategoryBadge(surgery.category)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{surgery.procedure_type || '-'}</Badge>
                </TableCell>
                <TableCell className="text-center">{surgery.grade || '-'}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(surgery.initial_value)}</TableCell>
                <TableCell className="text-right text-purple-600">{formatCurrency(surgery.upgrade_value)}</TableCell>
                <TableCell className="text-right text-blue-600">{formatCurrency(surgery.upsell_value)}</TableCell>
                <TableCell className="text-right font-bold text-green-600">{formatCurrency(surgery.final_value)}</TableCell>
                <TableCell className="text-right">{formatCurrency(surgery.deposit_paid)}</TableCell>
                <TableCell className="text-right">{formatCurrency(surgery.remaining_paid)}</TableCell>
                <TableCell className="text-right">
                  <span className={surgery.balance_due > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {formatCurrency(surgery.balance_due)}
                  </span>
                </TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="confirmed" value={surgery.confirmed} /></TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="exams_sent" value={surgery.exams_sent} /></TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="contract_signed" value={surgery.contract_signed} /></TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="d7_contact" value={surgery.d7_contact} /></TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="d2_contact" value={surgery.d2_contact} /></TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="d1_contact" value={surgery.d1_contact} /></TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="checkin_sent" value={surgery.checkin_sent} /></TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="d0_discharge_form" value={surgery.d0_discharge_form} /></TableCell>
                <TableCell><CheckboxCell id={surgery.id} field="d1_gpi" value={surgery.d1_gpi} /></TableCell>
                <TableCell>
                  {surgery.companion_name && (
                    <div>
                      <p className="font-medium text-sm">{surgery.companion_name}</p>
                      {surgery.companion_phone && (
                        <p className="text-xs text-muted-foreground">{surgery.companion_phone}</p>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[150px]">
                          {surgery.observations || '-'}
                        </span>
                      </TooltipTrigger>
                      {surgery.observations && (
                        <TooltipContent className="max-w-xs">
                          <p>{surgery.observations}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="sticky right-0 bg-background">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(surgery)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(surgery.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
