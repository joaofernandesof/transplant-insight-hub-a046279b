import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withCache } from '@/lib/queryClient';
import {
  fetchCampaignCosts,
  fetchAdsConfigs,
  upsertAdsConfig,
  deleteAdsConfig,
  triggerSheetSync,
} from '../services/adsService';
import { toast } from 'sonner';

const ADS_KEYS = {
  costs: ['ads', 'campaign-costs'] as const,
  configs: ['ads', 'configs'] as const,
};

export function useCampaignCosts() {
  return useQuery({
    queryKey: ADS_KEYS.costs,
    queryFn: fetchCampaignCosts,
    ...withCache('SHORT'),
  });
}

export function useAdsConfigs() {
  return useQuery({
    queryKey: ADS_KEYS.configs,
    queryFn: fetchAdsConfigs,
    ...withCache('MEDIUM'),
  });
}

export function useUpsertAdsConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertAdsConfig,
    onSuccess: () => {
      toast.success('Configuração salva');
      qc.invalidateQueries({ queryKey: ADS_KEYS.configs });
    },
    onError: (e: any) => toast.error('Erro ao salvar', { description: e.message }),
  });
}

export function useDeleteAdsConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdsConfig,
    onSuccess: () => {
      toast.success('Configuração removida');
      qc.invalidateQueries({ queryKey: ADS_KEYS.configs });
    },
    onError: (e: any) => toast.error('Erro ao remover', { description: e.message }),
  });
}

export function useSyncSheets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerSheetSync,
    onSuccess: (data: any) => {
      toast.success('Planilhas sincronizadas', {
        description: `${data?.total_upserted || 0} registros importados`,
      });
      qc.invalidateQueries({ queryKey: ADS_KEYS.costs });
    },
    onError: (e: any) => toast.error('Erro na sincronização', { description: e.message }),
  });
}
