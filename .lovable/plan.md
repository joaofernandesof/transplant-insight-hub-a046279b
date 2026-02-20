

# Status de Saude da Fila de IA - Dashboard Admin

## Objetivo
Adicionar um widget de monitoramento em tempo real da fila de processamento de IA (Queue Mode) no Dashboard do Avivar, visivel exclusivamente para o super admin (adm@neofolic.com.br).

## O que sera exibido

O widget mostrara os dados retornados pela funcao `avivar_queue_stats` que ja existe no banco:

- **Status geral**: Healthy / Degraded / Critical (baseado em jobs aguardando, falhados e parados)
- **Jobs aguardando** (waiting)
- **Jobs ativos** (active) 
- **Jobs completados** (ultima hora)
- **Jobs falhados** (ultima hora)
- **Jobs parados** (stalled)
- **Tempo medio de processamento** (avg_processing_ms)
- **Throughput** (jobs/min nos ultimos 5 min)
- **Total hoje** (total_today)

O widget tera um indicador visual de saude (verde/amarelo/vermelho) e um botao de refresh manual.

## Regras de visibilidade

Visivel apenas quando o usuario autenticado for o super admin, verificado via RPC `is_avivar_super_admin` (ja existe no banco).

## Detalhes tecnicos

### Arquivo novo
- `src/pages/avivar/components/QueueHealthWidget.tsx` - Componente do widget

### Arquivo modificado
- `src/pages/avivar/AvivarDashboard.tsx` - Importar e renderizar o widget logo apos o card "Assistente AVIVAR IA" (linha ~485), condicionado a ser super admin

### Logica do componente
1. Verificar se o usuario eh super admin via `supabase.rpc('is_avivar_super_admin', { _user_id: user.id })`
2. Se sim, chamar `supabase.rpc('avivar_queue_stats')` a cada 30 segundos (polling com React Query `refetchInterval`)
3. Calcular status de saude:
   - **Healthy**: waiting < 10, failed = 0, stalled = 0
   - **Degraded**: waiting >= 10 ou failed > 0
   - **Critical**: stalled > 0 ou failed > 5 ou waiting > 50
4. Renderizar card compacto com metricas em grid, seguindo o design system Avivar (cores hsl var)

### Design visual
Card com borda colorida pelo status (verde/amarelo/vermelho), contendo:
- Header com icone de heartbeat + titulo "Saude da Fila IA" + badge de status + botao refresh
- Grid 3x3 com as metricas principais (icone + valor + label)
- Barra de progresso mostrando throughput relativo

