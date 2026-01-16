import { MetricDefinition, MetricStatus, metrics } from "@/data/metricsData";

export interface CalculatedMetrics {
  [key: string]: number | string | null;
}

export function calculateMetrics(inputValues: Record<string, number | string | null>): CalculatedMetrics {
  const result: CalculatedMetrics = { ...inputValues };
  
  const gastoMidia = Number(inputValues.gastoMidia) || 0;
  const impressoes = Number(inputValues.impressoes) || 0;
  const alcance = Number(inputValues.alcance) || 0;
  const cliques = Number(inputValues.cliques) || 0;
  const interacoes = Number(inputValues.interacoes) || 0;
  const visualizacoes = Number(inputValues.visualizacoes) || 0;
  const visualizacoes3s = Number(inputValues.visualizacoes3s) || 0;
  const visitas = Number(inputValues.visitas) || 0;
  const tempoCarregamento = Number(inputValues.tempoCarregamento) || 0;
  const saidasRapidas = Number(inputValues.saidasRapidas) || 0;
  const leadsTotal = Number(inputValues.leadsTotal) || 0;
  const leadsICP = Number(inputValues.leadsICP) || 0;
  const enviosForm = Number(inputValues.enviosForm) || 0;
  const acessosForm = Number(inputValues.acessosForm) || 0;
  const abandonosForm = Number(inputValues.abandonosForm) || 0;
  const cliquesWhats = Number(inputValues.cliquesWhats) || 0;
  const leadsContatados = Number(inputValues.leadsContatados) || 0;
  const leadsResponderam = Number(inputValues.leadsResponderam) || 0;
  const totalFollowUps = Number(inputValues.totalFollowUps) || 0;
  const agendamentosFollowUp = Number(inputValues.agendamentosFollowUp) || 0;
  const consultasAgendadas = Number(inputValues.consultasAgendadas) || 0;
  const consultasRealizadas = Number(inputValues.consultasRealizadas) || 0;
  const noShows = Number(inputValues.noShows) || 0;
  const MQLs = Number(inputValues.MQLs) || 0;
  const SQLs = Number(inputValues.SQLs) || 0;
  const propostas = Number(inputValues.propostas) || 0;
  const vendas = Number(inputValues.vendas) || 0;
  const receita = Number(inputValues.receita) || 0;
  const lucro = Number(inputValues.lucro) || 0;
  const leadsPerdidos = Number(inputValues.leadsPerdidos) || 0;
  const custoFixo = Number(inputValues.custoFixo) || 0;
  const custoVariavel = Number(inputValues.custoVariavel) || 0;

  // Cálculos automáticos
  
  // Tráfego
  result.Impr = impressoes;
  result.Reach = alcance;
  result.Freq = alcance > 0 ? impressoes / alcance : 0;
  result.CPM = impressoes > 0 ? (gastoMidia / (impressoes / 1000)) : 0;
  result.CTR = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
  result.CPC = cliques > 0 ? gastoMidia / cliques : 0;
  result.Eng = impressoes > 0 ? (interacoes / impressoes) * 100 : 0;
  result.VTR = impressoes > 0 ? (visualizacoes / impressoes) * 100 : 0;
  result.Hook = visualizacoes > 0 ? (visualizacoes3s / visualizacoes) * 100 : 0;
  
  // Landing Page
  result.PageSpeed = tempoCarregamento;
  result.Bounce = visitas > 0 ? (saidasRapidas / visitas) * 100 : 0;
  
  // Conversão
  result.LPCR = visitas > 0 ? (leadsTotal / visitas) * 100 : 0;
  result.FormCR = acessosForm > 0 ? (enviosForm / acessosForm) * 100 : 0;
  result.AbForm = (acessosForm - abandonosForm) > 0 ? (abandonosForm / (acessosForm - abandonosForm + abandonosForm)) * 100 : 0;
  result.WhatsCR = visitas > 0 ? (cliquesWhats / visitas) * 100 : 0;
  
  // Leads
  result.LeadDay = leadsTotal / 7;
  result.CPL = leadsTotal > 0 ? gastoMidia / leadsTotal : 0;
  result.MQL = leadsTotal > 0 ? (MQLs / leadsTotal) * 100 : 0;
  result.SQL = leadsTotal > 0 ? (SQLs / leadsTotal) * 100 : 0;
  
  // Atendimento
  result.RespRate = leadsContatados > 0 ? (leadsResponderam / leadsContatados) * 100 : 0;
  result.ConvFU = totalFollowUps > 0 ? (agendamentosFollowUp / totalFollowUps) * 100 : 0;
  
  // Agendamento/Consulta
  result.ConvCall = leadsTotal > 0 ? (consultasAgendadas / leadsTotal) * 100 : 0;
  result.Show = consultasAgendadas > 0 ? (consultasRealizadas / consultasAgendadas) * 100 : 0;
  result.NoShow = consultasAgendadas > 0 ? (noShows / consultasAgendadas) * 100 : 0;
  
  // Vendas
  result.Close = propostas > 0 ? (vendas / propostas) * 100 : 0;
  result.SaleLead = leadsTotal > 0 ? (vendas / leadsTotal) * 100 : 0;
  result.CostSale = vendas > 0 ? gastoMidia / vendas : 0;
  result.AOV = vendas > 0 ? receita / vendas : 0;
  result.CAC = vendas > 0 ? (gastoMidia + custoFixo + custoVariavel) / vendas : 0;
  
  // Financeiro
  result.ROAS = gastoMidia > 0 ? receita / gastoMidia : 0;
  result.ROI = gastoMidia > 0 ? lucro / gastoMidia : 0;
  result.Margin = receita > 0 ? (lucro / receita) * 100 : 0;
  
  // Gestão
  result.FunnelDrop = leadsTotal > 0 ? ((leadsTotal - vendas) / leadsTotal) * 100 : 0;
  result.LeadLoss = leadsTotal > 0 ? (leadsPerdidos / leadsTotal) * 100 : 0;
  
  // LTV e Payback
  const aov = result.AOV as number;
  result.LTV = aov * 1.5; // Estimativa simplificada
  const cac = result.CAC as number;
  const lucroMedioDiario = vendas > 0 ? lucro / (vendas * 30) : 0;
  result.Payback = lucroMedioDiario > 0 ? cac / lucroMedioDiario : 0;
  
  // Health Score (média ponderada simplificada)
  const healthFactors = [
    result.CPL && (result.CPL as number) < 50 ? 1 : 0,
    result.Show && (result.Show as number) > 85 ? 1 : 0,
    result.Close && (result.Close as number) > 12 ? 1 : 0,
    result.ROAS && (result.ROAS as number) > 2.5 ? 1 : 0,
  ];
  const healthScore = healthFactors.reduce((a, b) => a + b, 0);
  result.Health = healthScore >= 3 ? "Ótimo" : healthScore >= 2 ? "Bom" : healthScore >= 1 ? "Misto" : "Ruim";
  
  return result;
}

export function getMetricStatus(metricSigla: string, value: number | string | null): MetricStatus {
  if (value === null || value === undefined) return null;
  
  const metric = metrics.find(m => m.sigla === metricSigla);
  if (!metric) return null;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) {
    // Handle status metrics
    if (metric.formato === 'status') {
      const strValue = String(value).toLowerCase();
      if (strValue.includes('ótimo') || strValue.includes('folga') || strValue.includes('melhora')) return 'great';
      if (strValue.includes('bom') || strValue.includes('consistente')) return 'good';
      if (strValue.includes('médio') || strValue.includes('misto') || strValue.includes('oscila')) return 'medium';
      return 'bad';
    }
    return null;
  }
  
  // Parse range values
  const parseRange = (rangeStr: string): { min: number | null; max: number | null } => {
    const cleaned = rangeStr.replace(/[<>≤≥×%R$]/g, '').trim();
    
    if (rangeStr.includes('–')) {
      const parts = cleaned.split('–').map(p => parseFloat(p.replace(',', '.')));
      return { min: parts[0], max: parts[1] };
    }
    
    const num = parseFloat(cleaned.replace(',', '.'));
    if (rangeStr.includes('<') || rangeStr.includes('≤')) {
      return { min: null, max: num };
    }
    if (rangeStr.includes('>') || rangeStr.includes('≥')) {
      return { min: num, max: null };
    }
    
    return { min: num, max: num };
  };
  
  const ruimRange = parseRange(metric.ruim);
  const medioRange = parseRange(metric.medio);
  const bomRange = parseRange(metric.bom);
  const otimoRange = parseRange(metric.otimo);
  
  // Check ranges based on whether lower or higher is better
  // For most metrics, higher is better, but for some (like CPC, CPL, Bounce, etc.) lower is better
  const lowerIsBetter = ['Freq', 'CPM', 'CPC', 'Bounce', 'AbForm', 'NoShow', 'CAC', 'CostSale', 'FunnelDrop', 'LeadLoss', 'Payback', 'PageSpeed', 'SLA', 'TTF'].includes(metricSigla);
  
  if (lowerIsBetter) {
    if (otimoRange.max !== null && numValue <= otimoRange.max) return 'great';
    if (bomRange.min !== null && bomRange.max !== null && numValue >= bomRange.min && numValue <= bomRange.max) return 'good';
    if (medioRange.min !== null && medioRange.max !== null && numValue >= medioRange.min && numValue <= medioRange.max) return 'medium';
    return 'bad';
  } else {
    if (otimoRange.min !== null && numValue >= otimoRange.min) return 'great';
    if (bomRange.min !== null && bomRange.max !== null && numValue >= bomRange.min && numValue <= bomRange.max) return 'good';
    if (medioRange.min !== null && medioRange.max !== null && numValue >= medioRange.min && numValue <= medioRange.max) return 'medium';
    return 'bad';
  }
}

export function formatMetricValue(value: number | string | null, formato: string): string {
  if (value === null || value === undefined) return '-';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue) && typeof value === 'string') {
    return value;
  }
  
  switch (formato) {
    case 'percent':
      return `${numValue.toFixed(1)}%`;
    case 'currency':
      return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'decimal':
      return numValue.toFixed(2);
    case 'number':
      return Math.round(numValue).toLocaleString('pt-BR');
    case 'minutes':
      return `${numValue.toFixed(0)} min`;
    case 'days':
      return `${numValue.toFixed(0)} dias`;
    case 'index':
      return `${numValue.toFixed(2)}x`;
    case 'status':
      return String(value);
    default:
      return String(numValue);
  }
}

export function getStatusIcon(status: MetricStatus): string {
  switch (status) {
    case 'great': return '🟢';
    case 'good': return '🔵';
    case 'medium': return '🟡';
    case 'bad': return '🔴';
    default: return '⚪';
  }
}

export function getStatusLabel(status: MetricStatus): string {
  switch (status) {
    case 'great': return 'Ótimo';
    case 'good': return 'Bom';
    case 'medium': return 'Médio';
    case 'bad': return 'Ruim';
    default: return '-';
  }
}
