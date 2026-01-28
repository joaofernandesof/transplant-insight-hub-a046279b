/**
 * Hook to save scan analysis to history
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveScanParams {
  userId: string;
  originalImageUrl: string;
  analysisType: 'progression' | 'scan' | 'newversion';
  generatedImages: string[];
  hairStyle?: string;
  metadata?: Record<string, unknown>;
}

export function useScanHistory(userId: string) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (params: SaveScanParams) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('neohairscan_history')
        .insert({
          user_id: params.userId,
          original_image_url: params.originalImageUrl,
          analysis_type: params.analysisType,
          generated_images: params.generatedImages,
          hair_style: params.hairStyle || null,
          metadata: params.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scan-history', userId] });
    },
    onError: (error) => {
      console.error('Error saving scan history:', error);
    },
  });

  const saveToHistory = async (
    originalImageUrl: string,
    analysisType: 'progression' | 'scan' | 'newversion',
    generatedImages: string[],
    hairStyle?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!userId || generatedImages.length === 0) return;

    try {
      await saveMutation.mutateAsync({
        userId,
        originalImageUrl,
        analysisType,
        generatedImages,
        hairStyle,
        metadata,
      });
      toast.success("Análise salva no histórico!");
    } catch (error) {
      // Silent fail - don't block the user experience
      console.error('Failed to save to history:', error);
    }
  };

  return {
    saveToHistory,
    isSaving: saveMutation.isPending,
  };
}