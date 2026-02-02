/**
 * Kanban de Conferência Contratual
 */

import { useMemo } from "react";
import { useContractReviewRequests, CONTRACT_STATUS_CONFIG, ContractReviewStatus } from "@/hooks/useContractReview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractReviewCard } from "./ContractReviewCard";
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, Search, Loader2 } from "lucide-react";

const KANBAN_COLUMNS: { status: ContractReviewStatus; icon: React.ReactNode }[] = [
  { status: 'rascunho', icon: <FileText className="h-4 w-4" /> },
  { status: 'aguardando_validacao', icon: <Clock className="h-4 w-4" /> },
  { status: 'em_analise', icon: <Search className="h-4 w-4" /> },
  { status: 'aguardando_ajustes', icon: <AlertTriangle className="h-4 w-4" /> },
  { status: 'aprovado', icon: <CheckCircle className="h-4 w-4" /> },
  { status: 'reprovado', icon: <XCircle className="h-4 w-4" /> },
];

export function ContractReviewKanban() {
  const { data: requests, isLoading } = useContractReviewRequests();

  const groupedRequests = useMemo(() => {
    if (!requests) return {};
    
    return requests.reduce((acc, req) => {
      if (!acc[req.status]) acc[req.status] = [];
      acc[req.status].push(req);
      return acc;
    }, {} as Record<ContractReviewStatus, typeof requests>);
  }, [requests]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="min-w-[300px]">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-32 w-full mb-2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
        {KANBAN_COLUMNS.map(({ status, icon }) => {
          const config = CONTRACT_STATUS_CONFIG[status];
          const items = groupedRequests[status] || [];
          
          return (
            <div key={status} className="w-[320px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span>{config.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="space-y-2 p-1">
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma solicitação
                        </div>
                      ) : (
                        items.map((request) => (
                          <ContractReviewCard key={request.id} request={request} />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
