/**
 * ScanHistoryPanel - Shows user's previous scan analysis history
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Image as ImageIcon, 
  Trash2, 
  ChevronRight, 
  Calendar,
  Loader2,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScanHistoryItem {
  id: string;
  user_id: string;
  original_image_url: string;
  analysis_type: string;
  generated_images: string[];
  hair_style: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ScanHistoryPanelProps {
  userId: string;
  onLoadHistory: (item: ScanHistoryItem) => void;
}

export function ScanHistoryPanel({ userId, onLoadHistory }: ScanHistoryPanelProps) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch scan history
  const { data: history, isLoading } = useQuery({
    queryKey: ['scan-history', userId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('neohairscan_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ScanHistoryItem[];
    },
    enabled: !!userId,
  });

  // Delete history item
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('neohairscan_history')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-history', userId] });
      toast.success("Análise removida do histórico");
    },
    onError: () => {
      toast.error("Erro ao remover análise");
    },
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'progression': return 'Progressão';
      case 'scan': return 'Scan Densidade';
      case 'newversion': return 'New Version';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'progression': return 'bg-orange-600';
      case 'scan': return 'bg-cyan-600';
      case 'newversion': return 'bg-emerald-600';
      default: return 'bg-slate-600';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/80 border-slate-700">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="bg-slate-900/80 border-slate-700">
        <CardContent className="p-6 text-center">
          <FolderOpen className="h-10 w-10 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Nenhuma análise salva ainda</p>
          <p className="text-slate-500 text-xs mt-1">
            Suas análises aparecerão aqui após gerar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/80 border-purple-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-purple-400" />
          Histórico de Análises
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 hover:border-purple-500/30 transition-colors"
              >
                {/* Header */}
                <div 
                  className="p-3 cursor-pointer flex items-center gap-3"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                    <img 
                      src={item.original_image_url} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${getTypeColor(item.analysis_type)} text-xs`}>
                        {getTypeLabel(item.analysis_type)}
                      </Badge>
                      {item.generated_images?.length > 0 && (
                        <span className="text-xs text-slate-400">
                          {item.generated_images.length} imgs
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>

                  {/* Actions */}
                  <ChevronRight 
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      expandedId === item.id ? 'rotate-90' : ''
                    }`} 
                  />
                </div>

                {/* Expanded Content */}
                {expandedId === item.id && (
                  <div className="px-3 pb-3 border-t border-slate-700/50 pt-3">
                    {/* Generated images grid */}
                    {item.generated_images?.length > 0 && (
                      <div className="grid grid-cols-4 gap-1 mb-3">
                        {item.generated_images.slice(0, 8).map((img, idx) => (
                          <div key={idx} className="aspect-square rounded overflow-hidden bg-slate-700">
                            <img src={img} alt={`Result ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLoadHistory(item)}
                        className="flex-1 border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Carregar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}