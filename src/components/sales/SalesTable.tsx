import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sale } from "@/hooks/useSales";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, CheckCircle2, XCircle, ArrowUpDown } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SalesTableProps {
  sales: Sale[];
}

type SortField = 'sale_date' | 'patient_name' | 'vgv_initial' | 'service_type';
type SortDirection = 'asc' | 'desc';

export function SalesTable({ sales }: SalesTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('sale_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredSales = sales
    .filter((sale) => {
      const searchLower = search.toLowerCase();
      return (
        sale.patient_name?.toLowerCase().includes(searchLower) ||
        sale.service_type?.toLowerCase().includes(searchLower) ||
        sale.sold_by?.toLowerCase().includes(searchLower) ||
        sale.branch?.toLowerCase().includes(searchLower) ||
        sale.category?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'sale_date':
          comparison = new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime();
          break;
        case 'patient_name':
          comparison = (a.patient_name || '').localeCompare(b.patient_name || '');
          break;
        case 'vgv_initial':
          comparison = (a.vgv_initial || 0) - (b.vgv_initial || 0);
          break;
        case 'service_type':
          comparison = (a.service_type || '').localeCompare(b.service_type || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const getContractStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('finalizado')) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{status}</Badge>;
    }
    if (statusLower.includes('aguardando')) {
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{status}</Badge>;
    }
    if (statusLower.includes('distratado')) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{status}</Badge>;
    }
    if (statusLower.includes('não precisa')) {
      return <Badge variant="secondary">{status}</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category || category === '-') return null;
    
    const categoryUpper = category.toUpperCase();
    if (categoryUpper.includes('CATEGORIA A')) {
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-[10px]">Cat A</Badge>;
    }
    if (categoryUpper.includes('CATEGORIA B')) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[10px]">Cat B</Badge>;
    }
    if (categoryUpper.includes('CATEGORIA C')) {
      return <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-[10px]">Cat C</Badge>;
    }
    if (categoryUpper.includes('CATEGORIA D')) {
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-[10px]">Cat D</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">{category.substring(0, 10)}</Badge>;
  };

  const BooleanIcon = ({ value }: { value: boolean }) => (
    value ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground/30" />
    )
  );

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, serviço, vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredSales.length} de {sales.length} vendas
        </span>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">
                <SortButton field="sale_date">Data</SortButton>
              </TableHead>
              <TableHead className="min-w-[180px]">
                <SortButton field="patient_name">Paciente</SortButton>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <SortButton field="service_type">Serviço</SortButton>
              </TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Filial</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">
                <SortButton field="vgv_initial">VGV</SortButton>
              </TableHead>
              <TableHead className="text-right">Sinal</TableHead>
              <TableHead>Status Contrato</TableHead>
              <TableHead className="text-center">CU</TableHead>
              <TableHead className="text-center">CA</TableHead>
              <TableHead className="text-center">Ag</TableHead>
              <TableHead className="text-center">Fe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="text-xs">{formatDate(sale.sale_date)}</TableCell>
                <TableCell className="font-medium text-xs max-w-[200px] truncate">
                  {sale.patient_name}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {sale.service_type}
                  </Badge>
                </TableCell>
                <TableCell>{getCategoryBadge(sale.category)}</TableCell>
                <TableCell className="text-xs">{sale.branch || '-'}</TableCell>
                <TableCell className="text-xs">{sale.sold_by || '-'}</TableCell>
                <TableCell className="text-right font-medium text-xs">
                  {formatCurrency(sale.vgv_initial)}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatCurrency(sale.deposit_paid)}
                </TableCell>
                <TableCell>{getContractStatusBadge(sale.contract_status)}</TableCell>
                <TableCell className="text-center">
                  <BooleanIcon value={sale.in_clickup} />
                </TableCell>
                <TableCell className="text-center">
                  <BooleanIcon value={sale.in_conta_azul} />
                </TableCell>
                <TableCell className="text-center">
                  <BooleanIcon value={sale.in_surgery_schedule} />
                </TableCell>
                <TableCell className="text-center">
                  <BooleanIcon value={sale.in_feegow} />
                </TableCell>
              </TableRow>
            ))}
            {filteredSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  Nenhuma venda encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
