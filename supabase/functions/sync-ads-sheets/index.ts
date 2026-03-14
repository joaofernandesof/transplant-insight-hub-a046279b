// ============================================
// Edge Function: sync-ads-sheets
// Fetches campaign cost data from Google Sheets
// and upserts into the campaign_costs table
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SheetConfig {
  id: string;
  name: string;
  spreadsheet_id: string;
  gids: { gid: string; type: 'summary' | 'detail'; label: string }[];
  business_unit: string; // e.g. 'neofolic', 'ibramec'
}

// Parse Brazilian currency "R$ 40.945,20" → 40945.20
function parseBRL(val: string): number {
  if (!val || val.trim() === '' || val === '-') return 0;
  return parseFloat(
    val.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  ) || 0;
}

// Parse date formats: "2025-06-03" or "01/10/2025"
function parseDate(val: string): string | null {
  if (!val) return null;
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  // BR format dd/mm/yyyy
  const parts = val.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  return null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

// Process DETAIL sheet (daily Google Ads keyword-level)
// Columns: Data, Campanha, Conjunto de Anúncios, Palavra-chave, Correspondência, Termo de Pesquisa, Investimento, Impressões, Cliques, Contatos
function processDetailSheet(rows: Record<string, string>[], businessUnit: string) {
  return rows
    .filter(r => r['Data'] && r['Campanha'])
    .map(r => {
      const date = parseDate(r['Data']);
      if (!date) return null;
      const campaignName = r['Campanha'] || '';
      // Detect platform from campaign name pattern
      const platform = campaignName.includes('_LEADS_F') || campaignName.includes('_SEARCH_') ? 'google' : 'meta';
      return {
        platform,
        campaign_name: campaignName,
        campaign_id: campaignName, // use name as ID since sheets don't have platform IDs
        adset_name: r['Conjunto de Anúncios'] || '',
        ad_name: r['Palavra-chave'] || '',
        date,
        impressions: parseInt(r['Impressões'] || '0') || 0,
        clicks: parseInt(r['Cliques'] || '0') || 0,
        spend: parseBRL(r['Investimento']),
        conversions: parseInt(r['Contatos'] || '0') || 0,
        utm_source: platform === 'google' ? 'google' : 'facebook',
        utm_medium: platform === 'google' ? 'cpc' : 'paid',
        utm_campaign: campaignName,
        utm_content: r['Termo de Pesquisa'] || null,
        raw_data: {
          keyword: r['Palavra-chave'] || null,
          match_type: r['Correspondência'] || null,
          search_term: r['Termo de Pesquisa'] || null,
          business_unit: businessUnit,
          source: 'google_sheets_detail',
        },
      };
    })
    .filter(Boolean);
}

// Process SUMMARY sheet (monthly by branch)
// Columns: Ano, Mês, Data Inicial, Data Final, Filial, Investimento Total, Investimento Conteúdo, Investimento Leads, Leads Totais, Leads Anúncios, Agendamentos, Consultas, Fechamentos, Faturamento
function processSummarySheet(rows: Record<string, string>[], businessUnit: string) {
  return rows
    .filter(r => r['Ano'] && r['Mês'] && r['Filial'])
    .map(r => {
      const year = r['Ano'];
      const month = r['Mês'].padStart(2, '0');
      const date = `${year}-${month}-01`;
      const filial = r['Filial'] || '';
      const campaignName = `${businessUnit}_${filial}_mensal`;
      return {
        platform: 'other' as const,
        campaign_name: campaignName,
        campaign_id: `${businessUnit}_${filial}_${year}${month}`,
        adset_name: filial,
        ad_name: '',
        date,
        impressions: 0,
        clicks: 0,
        spend: parseBRL(r['Investimento Total']),
        conversions: parseInt(r['Leads Totais'] || '0') || 0,
        conversion_value: parseBRL(r['Faturamento']),
        utm_source: null,
        utm_medium: null,
        utm_campaign: campaignName,
        utm_content: null,
        raw_data: {
          filial,
          business_unit: businessUnit,
          investimento_conteudo: parseBRL(r['Investimento Conteúdo']),
          investimento_leads: parseBRL(r['Investimento Leads']),
          leads_totais: parseInt(r['Leads Totais'] || '0') || 0,
          leads_anuncios: parseInt(r['Leads Anúncios'] || '0') || 0,
          agendamentos: parseInt(r['Agendamentos'] || '0') || 0,
          consultas: parseInt(r['Consultas'] || r['Reuniões'] || '0') || 0,
          fechamentos: parseInt(r['Fechamentos'] || '0') || 0,
          faturamento: parseBRL(r['Faturamento']),
          data_inicial: r['Data Inicial'],
          data_final: r['Data Final'],
          source: 'google_sheets_summary',
        },
      };
    })
    .filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    
    // Get sheet configs from ads_integration_config table
    const { data: configs, error: configErr } = await supabase
      .from('ads_integration_config')
      .select('*')
      .eq('platform', 'google_sheets' as any)
      .eq('is_active', true);
    
    if (configErr) throw configErr;

    // Also accept direct configs from request body for initial setup
    const sheetConfigs: SheetConfig[] = [];

    if (body.sheets && Array.isArray(body.sheets)) {
      sheetConfigs.push(...body.sheets);
    }

    // Convert DB configs to SheetConfig format
    if (configs && configs.length > 0) {
      for (const c of configs) {
        const cfg = (c.config || {}) as any;
        sheetConfigs.push({
          id: c.id,
          name: c.account_name || c.account_id,
          spreadsheet_id: c.account_id,
          gids: cfg.gids || [],
          business_unit: cfg.business_unit || 'unknown',
        });
      }
    }

    if (sheetConfigs.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhuma planilha configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, any> = {};
    let totalUpserted = 0;

    for (const sheet of sheetConfigs) {
      const sheetResult: any = { gids: {} };

      for (const gidConfig of sheet.gids) {
        // Try multiple URL formats for Google Sheets export
        const urls = [
          `https://docs.google.com/spreadsheets/d/${sheet.spreadsheet_id}/export?format=csv&gid=${gidConfig.gid}`,
          `https://docs.google.com/spreadsheets/d/${sheet.spreadsheet_id}/gviz/tq?tqx=out:csv&gid=${gidConfig.gid}`,
        ];
        
        let csvText = '';
        let fetchSuccess = false;
        for (const csvUrl of urls) {
          console.log(`Trying ${sheet.name} / ${gidConfig.label}: ${csvUrl}`);
          const resp = await fetch(csvUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            redirect: 'follow',
          });
          if (resp.ok) {
            csvText = await resp.text();
            // Check it's not an HTML login page
            if (!csvText.includes('<!DOCTYPE') && !csvText.includes('<html')) {
              fetchSuccess = true;
              break;
            }
          }
          // Consume body to avoid resource leak
          if (!fetchSuccess) try { await resp.text(); } catch (_) {}
        }

        if (!fetchSuccess) {
          sheetResult.gids[gidConfig.gid] = { error: 'Could not fetch sheet - check sharing permissions' };
          continue;
        }

        const rows = parseCSV(csvText);

        let records: any[];
        if (gidConfig.type === 'detail') {
          records = processDetailSheet(rows, sheet.business_unit);
        } else {
          records = processSummarySheet(rows, sheet.business_unit);
        }

        // Aggregate duplicates by unique key before upserting
        const aggregated = new Map<string, any>();
        for (const r of records) {
          const key = `${r.platform}|${r.campaign_id}|${r.adset_name}|${r.ad_name}|${r.date}`;
          const existing = aggregated.get(key);
          if (existing) {
            existing.spend += r.spend || 0;
            existing.clicks += r.clicks || 0;
            existing.impressions += r.impressions || 0;
            existing.conversions += r.conversions || 0;
          } else {
            aggregated.set(key, { ...r });
          }
        }
        const dedupedRecords = Array.from(aggregated.values());

        // Upsert in batches of 200
        let upserted = 0;
        const batchSize = 200;
        for (let i = 0; i < dedupedRecords.length; i += batchSize) {
          const batch = dedupedRecords.slice(i, i + batchSize);
          const { error: upsertErr } = await supabase
            .from('campaign_costs')
            .upsert(batch as any, { 
              onConflict: 'platform,campaign_id,adset_name,ad_name,date',
              ignoreDuplicates: false 
            });
          
          if (upsertErr) {
            console.error(`Upsert error for ${sheet.name}/${gidConfig.label}:`, upsertErr);
            sheetResult.gids[gidConfig.gid] = { error: upsertErr.message, rows_parsed: records.length, deduped: dedupedRecords.length };
            break;
          }
          upserted += batch.length;
        }

        sheetResult.gids[gidConfig.gid] = { 
          label: gidConfig.label,
          rows_parsed: rows.length, 
          records_upserted: upserted 
        };
        totalUpserted += upserted;
      }

      results[sheet.name] = sheetResult;

      // Update last_sync_at
      if (sheet.id) {
        await supabase
          .from('ads_integration_config')
          .update({ last_sync_at: new Date().toISOString() } as any)
          .eq('id', sheet.id);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total_upserted: totalUpserted,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('sync-ads-sheets error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
