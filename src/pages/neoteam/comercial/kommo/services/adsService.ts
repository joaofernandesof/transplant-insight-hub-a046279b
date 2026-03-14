import { supabase } from '@/integrations/supabase/client';

// =============================================
// Ads/Campaign Costs Service
// =============================================

export interface CampaignCost {
  id: string;
  platform: string;
  account_id: string | null;
  campaign_id: string | null;
  campaign_name: string;
  adset_name: string | null;
  ad_name: string | null;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversion_value: number;
  cpc: number;
  ctr: number;
  cpl: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  raw_data: Record<string, any>;
  synced_at: string;
}

export interface AdsIntegrationConfig {
  id: string;
  platform: string;
  account_id: string;
  account_name: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_from_date: string | null;
  config: Record<string, any>;
}

export interface SheetGidConfig {
  gid: string;
  type: 'summary' | 'detail';
  label: string;
}

export async function fetchCampaignCosts(): Promise<CampaignCost[]> {
  const allCosts: CampaignCost[] = [];
  const batchSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('campaign_costs')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + batchSize - 1);
    if (error) throw error;
    const batch = (data || []) as unknown as CampaignCost[];
    allCosts.push(...batch);
    if (batch.length < batchSize) break;
    offset += batchSize;
  }
  return allCosts;
}

export async function fetchAdsConfigs(): Promise<AdsIntegrationConfig[]> {
  const { data, error } = await supabase
    .from('ads_integration_config')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return (data || []) as unknown as AdsIntegrationConfig[];
}

export async function upsertAdsConfig(config: {
  platform: string;
  account_id: string;
  account_name: string;
  is_active: boolean;
  config: Record<string, any>;
}) {
  const { data, error } = await supabase
    .from('ads_integration_config')
    .upsert(config as any, { onConflict: 'platform,account_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAdsConfig(id: string) {
  const { error } = await supabase
    .from('ads_integration_config')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function triggerSheetSync(sheets?: Array<{
  name: string;
  spreadsheet_id: string;
  gids: SheetGidConfig[];
  business_unit: string;
}>) {
  const { data, error } = await supabase.functions.invoke('sync-ads-sheets', {
    body: sheets ? { sheets } : {},
  });
  if (error) throw error;
  return data;
}
