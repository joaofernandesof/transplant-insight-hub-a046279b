import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  MousePointerClick, 
  Eye,
  Target,
  Calendar
} from 'lucide-react';
import { useBannerClicksAnalytics, useAllBanners } from '@/hooks/useBanners';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export function BannerAnalyticsDashboard() {
  const [period, setPeriod] = useState(30);
  const { data: analytics, isLoading: analyticsLoading } = useBannerClicksAnalytics(period);
  const { data: banners, isLoading: bannersLoading } = useAllBanners();

  const isLoading = analyticsLoading || bannersLoading;

  // Calculate metrics
  const totalClicks = analytics?.totalClicks || 0;
  const activeBanners = banners?.filter(b => b.is_active).length || 0;
  const avgClicksPerBanner = activeBanners > 0 ? (totalClicks / activeBanners).toFixed(1) : '0';
  
  // Calculate trend (compare last 7 days vs previous 7 days)
  const last7Days = analytics?.dailyClicks.slice(-7).reduce((sum, d) => sum + d.clicks, 0) || 0;
  const prev7Days = analytics?.dailyClicks.slice(-14, -7).reduce((sum, d) => sum + d.clicks, 0) || 0;
  const trendPercent = prev7Days > 0 ? (((last7Days - prev7Days) / prev7Days) * 100).toFixed(1) : '0';
  const trendPositive = Number(trendPercent) >= 0;

  // Prepare data for banner performance chart
  const bannerPerformance = banners?.map(b => ({
    name: b.highlight || b.title || 'Sem título',
    clicks: b.click_count || 0,
    active: b.is_active
  })).sort((a, b) => b.clicks - a.clicks).slice(0, 6) || [];

  // CTR calculation (simulated - would need impression data for real CTR)
  const estimatedImpressions = totalClicks * 15; // Estimate: 1 click per 15 views
  const ctr = estimatedImpressions > 0 ? ((totalClicks / estimatedImpressions) * 100).toFixed(2) : '0';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Período:</span>
        {[7, 14, 30, 90].map(days => (
          <Button
            key={days}
            variant={period === days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(days)}
          >
            {days} dias
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalClicks}</p>
                <p className="text-xs text-muted-foreground">Cliques no Período</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MousePointerClick className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs",
              trendPositive ? "text-green-600" : "text-red-600"
            )}>
              {trendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trendPositive ? '+' : ''}{trendPercent}% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{avgClicksPerBanner}</p>
                <p className="text-xs text-muted-foreground">Média por Banner</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Target className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{ctr}%</p>
                <p className="text-xs text-muted-foreground">CTR Estimado</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{activeBanners}</p>
                <p className="text-xs text-muted-foreground">Banners Ativos</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clicks Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cliques por Dia</CardTitle>
            <CardDescription>Evolução de engajamento no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.dailyClicks || []}>
                  <defs>
                    <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), 'dd/MM', { locale: ptBR })}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    labelFormatter={(val) => format(new Date(val), "d 'de' MMMM", { locale: ptBR })}
                    formatter={(value) => [`${value} cliques`, 'Cliques']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#clicksGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Banner Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Performance por Banner</CardTitle>
            <CardDescription>Top banners por cliques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bannerPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => val.length > 15 ? val.slice(0, 15) + '...' : val}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} cliques`, 'Cliques']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="clicks" 
                    fill="#f59e0b" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ranking de Banners</CardTitle>
          <CardDescription>Todos os banners ordenados por engajamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {banners?.sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).map((banner, idx) => (
              <div 
                key={banner.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  idx === 0 && "bg-amber-500 text-white",
                  idx === 1 && "bg-gray-400 text-white",
                  idx === 2 && "bg-amber-700 text-white",
                  idx > 2 && "bg-muted text-muted-foreground"
                )}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {banner.highlight || banner.title || 'Sem título'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {banner.route}
                  </p>
                </div>
                <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                  {banner.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                <div className="text-right">
                  <p className="font-bold">{banner.click_count || 0}</p>
                  <p className="text-xs text-muted-foreground">cliques</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
