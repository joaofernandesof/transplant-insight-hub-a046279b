import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Loader2, 
  Users, 
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LicenseeStats {
  user_id: string;
  name: string;
  email: string;
  clinic_name: string | null;
  total_leads: number;
  converted_leads: number;
  total_revenue: number;
  courses_completed: number;
  total_points: number;
  usage_time_hours: number;
  sessions_count: number;
}

export default function WeeklyReports() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [allStats, setAllStats] = useState<LicenseeStats[]>([]);
  const [selectedTab, setSelectedTab] = useState('consolidated');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchAllStats();
  }, [isAdmin]);

  const fetchAllStats = async () => {
    setIsLoading(true);
    try {
      // Get all admin user_ids
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminIds = new Set(adminRoles?.map((r) => r.user_id) || []);

      // Get all licensee profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, clinic_name, total_points');

      if (profilesError) throw profilesError;

      const licenseeProfiles = (profiles || []).filter((p) => !adminIds.has(p.user_id));

      // Get date range for this week
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);

      // Collect stats for each licensee
      const statsPromises = licenseeProfiles.map(async (profile) => {
        // Get leads
        const { data: leads } = await supabase
          .from('leads')
          .select('id, status, converted_value')
          .eq('claimed_by', profile.user_id);

        const totalLeads = leads?.length || 0;
        const convertedLeads = leads?.filter((l) => l.status === 'converted').length || 0;
        const totalRevenue = leads?.reduce((acc, l) => acc + (l.converted_value || 0), 0) || 0;

        // Get completed courses
        const { data: enrollments } = await supabase
          .from('user_course_enrollments')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('status', 'completed');

        const coursesCompleted = enrollments?.length || 0;

        // Get usage time
        const { data: sessions } = await supabase
          .from('user_sessions')
          .select('duration_seconds')
          .eq('user_id', profile.user_id)
          .gte('started_at', weekStart.toISOString());

        const totalSeconds = sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
        const usageTimeHours = Math.round((totalSeconds / 3600) * 10) / 10;

        return {
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          clinic_name: profile.clinic_name,
          total_leads: totalLeads,
          converted_leads: convertedLeads,
          total_revenue: totalRevenue,
          courses_completed: coursesCompleted,
          total_points: profile.total_points || 0,
          usage_time_hours: usageTimeHours,
          sessions_count: sessions?.length || 0,
        };
      });

      const stats = await Promise.all(statsPromises);
      setAllStats(stats.sort((a, b) => b.total_revenue - a.total_revenue));
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const generateConsolidatedPDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const now = new Date();
      const reportDate = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      // Header
      doc.setFillColor(14, 165, 233); // sky-500
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Relatório Consolidado Semanal', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Todos os Licenciados - ${reportDate}`, 105, 30, { align: 'center' });

      // Summary Cards
      const totalLeads = allStats.reduce((acc, s) => acc + s.total_leads, 0);
      const totalConverted = allStats.reduce((acc, s) => acc + s.converted_leads, 0);
      const totalRevenue = allStats.reduce((acc, s) => acc + s.total_revenue, 0);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      // Summary boxes
      const boxY = 50;
      const boxWidth = 60;
      const boxHeight = 25;
      
      // Leads box
      doc.setFillColor(220, 252, 231); // green-100
      doc.roundedRect(15, boxY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52); // green-800
      doc.text('TOTAL LEADS', 45, boxY + 8, { align: 'center' });
      doc.setFontSize(18);
      doc.text(String(totalLeads), 45, boxY + 20, { align: 'center' });

      // Converted box
      doc.setFillColor(219, 234, 254); // blue-100
      doc.roundedRect(80, boxY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(30, 64, 175); // blue-800
      doc.text('CONVERTIDOS', 110, boxY + 8, { align: 'center' });
      doc.setFontSize(18);
      doc.text(String(totalConverted), 110, boxY + 20, { align: 'center' });

      // Revenue box
      doc.setFillColor(254, 249, 195); // yellow-100
      doc.roundedRect(145, boxY, boxWidth, boxHeight, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(161, 98, 7); // yellow-800
      doc.text('RECEITA TOTAL', 175, boxY + 8, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`R$ ${totalRevenue.toLocaleString('pt-BR')}`, 175, boxY + 20, { align: 'center' });

      // Table
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Ranking de Licenciados', 15, 90);

      const tableData = allStats.map((s, index) => {
        const convRate = s.total_leads > 0 ? Math.round((s.converted_leads / s.total_leads) * 100) : 0;
        return [
          String(index + 1),
          s.name,
          s.clinic_name || '-',
          String(s.total_leads),
          `${s.converted_leads} (${convRate}%)`,
          `R$ ${s.total_revenue.toLocaleString('pt-BR')}`,
          String(s.courses_completed),
          `${s.usage_time_hours}h`,
        ];
      });

      autoTable(doc, {
        startY: 95,
        head: [['#', 'Nome', 'Clínica', 'Leads', 'Convertidos', 'Receita', 'Cursos', 'Uso']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' },
          6: { cellWidth: 15, halign: 'center' },
          7: { cellWidth: 15, halign: 'center' },
        },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Relatório gerado em ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
        105,
        pageHeight - 10,
        { align: 'center' }
      );

      doc.save(`relatorio-consolidado-${now.toISOString().split('T')[0]}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIndividualPDF = (stats: LicenseeStats) => {
    const doc = new jsPDF();
    const now = new Date();
    const reportDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const conversionRate = stats.total_leads > 0
      ? Math.round((stats.converted_leads / stats.total_leads) * 100)
      : 0;

    // Header
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('📊 Relatório Semanal', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Portal ByNeofolic', 105, 28, { align: 'center' });
    doc.setFontSize(10);
    doc.text(reportDate, 105, 38, { align: 'center' });

    // Greeting
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.text(`Olá, ${stats.name}! 👋`, 15, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${stats.clinic_name || 'Sua Clínica'} - ${stats.email}`, 15, 68);

    // Stats Cards
    const cardY = 80;
    const cardWidth = 45;
    const cardHeight = 35;
    const cardGap = 3;

    // Leads
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(15, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(22, 101, 52);
    doc.text('LEADS TOTAIS', 15 + cardWidth/2, cardY + 10, { align: 'center' });
    doc.setFontSize(20);
    doc.text(String(stats.total_leads), 15 + cardWidth/2, cardY + 26, { align: 'center' });

    // Converted
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(15 + cardWidth + cardGap, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(30, 64, 175);
    doc.text('CONVERTIDOS', 15 + cardWidth + cardGap + cardWidth/2, cardY + 10, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`${stats.converted_leads} (${conversionRate}%)`, 15 + cardWidth + cardGap + cardWidth/2, cardY + 26, { align: 'center' });

    // Revenue
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(15 + (cardWidth + cardGap) * 2, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(161, 98, 7);
    doc.text('RECEITA TOTAL', 15 + (cardWidth + cardGap) * 2 + cardWidth/2, cardY + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`R$ ${stats.total_revenue.toLocaleString('pt-BR')}`, 15 + (cardWidth + cardGap) * 2 + cardWidth/2, cardY + 26, { align: 'center' });

    // Points
    doc.setFillColor(250, 245, 255);
    doc.roundedRect(15 + (cardWidth + cardGap) * 3, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(124, 58, 237);
    doc.text('PONTOS', 15 + (cardWidth + cardGap) * 3 + cardWidth/2, cardY + 10, { align: 'center' });
    doc.setFontSize(20);
    doc.text(String(stats.total_points), 15 + (cardWidth + cardGap) * 3 + cardWidth/2, cardY + 26, { align: 'center' });

    // Training & Engagement section
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 125, 180, 55, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('📚 Treinamento & Engajamento', 25, 138);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    
    doc.text('Cursos Concluídos', 25, 152);
    doc.setTextColor(30, 41, 59);
    doc.text(String(stats.courses_completed), 175, 152, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text('Tempo de Uso (semana)', 25, 162);
    doc.setTextColor(30, 41, 59);
    doc.text(`${stats.usage_time_hours}h`, 175, 162, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text('Sessões', 25, 172);
    doc.setTextColor(30, 41, 59);
    doc.text(String(stats.sessions_count), 175, 172, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Continue assim! 🚀 Acesse o portal para ver mais detalhes.', 105, 200, { align: 'center' });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(
      `Relatório gerado em ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      105,
      pageHeight - 10,
      { align: 'center' }
    );

    doc.save(`relatorio-${stats.name.toLowerCase().replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.pdf`);
    toast.success(`PDF de ${stats.name} gerado!`);
  };

  const totalLeads = allStats.reduce((acc, s) => acc + s.total_leads, 0);
  const totalConverted = allStats.reduce((acc, s) => acc + s.converted_leads, 0);
  const totalRevenue = allStats.reduce((acc, s) => acc + s.total_revenue, 0);
  const avgConversion = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Relatórios Semanais</h1>
              <p className="text-sm text-muted-foreground">Gere e baixe relatórios em PDF</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAllStats} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={generateConsolidatedPDF} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Baixar Consolidado
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allStats.length}</p>
                  <p className="text-xs text-muted-foreground">Licenciados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                  <p className="text-xs text-muted-foreground">Leads Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgConversion}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {(totalRevenue / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-muted-foreground">Receita Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="consolidated">Visão Consolidada</TabsTrigger>
            <TabsTrigger value="individual">Relatórios Individuais</TabsTrigger>
          </TabsList>

          <TabsContent value="consolidated">
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Licenciados</CardTitle>
                <CardDescription>
                  Ordenado por receita total gerada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">#</th>
                        <th className="p-3 text-left font-medium">Nome</th>
                        <th className="p-3 text-left font-medium">Clínica</th>
                        <th className="p-3 text-center font-medium">Leads</th>
                        <th className="p-3 text-center font-medium">Convertidos</th>
                        <th className="p-3 text-right font-medium">Receita</th>
                        <th className="p-3 text-center font-medium">Cursos</th>
                        <th className="p-3 text-center font-medium">Uso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStats.map((stats, index) => {
                        const convRate = stats.total_leads > 0 
                          ? Math.round((stats.converted_leads / stats.total_leads) * 100) 
                          : 0;
                        return (
                          <tr key={stats.user_id} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-medium">{index + 1}</td>
                            <td className="p-3">{stats.name}</td>
                            <td className="p-3 text-muted-foreground">{stats.clinic_name || '-'}</td>
                            <td className="p-3 text-center">{stats.total_leads}</td>
                            <td className="p-3 text-center">
                              {stats.converted_leads}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {convRate}%
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-medium text-green-600 dark:text-green-400">
                              R$ {stats.total_revenue.toLocaleString('pt-BR')}
                            </td>
                            <td className="p-3 text-center">{stats.courses_completed}</td>
                            <td className="p-3 text-center">{stats.usage_time_hours}h</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Individuais</CardTitle>
                <CardDescription>
                  Clique para baixar o PDF de cada licenciado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {allStats.map((stats) => {
                    const convRate = stats.total_leads > 0 
                      ? Math.round((stats.converted_leads / stats.total_leads) * 100) 
                      : 0;
                    return (
                      <div 
                        key={stats.user_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{stats.name}</p>
                            {stats.total_revenue > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                R$ {stats.total_revenue.toLocaleString('pt-BR')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {stats.clinic_name || stats.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {stats.total_leads}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {convRate}%
                          </div>
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            {stats.courses_completed}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {stats.usage_time_hours}h
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => generateIndividualPDF(stats)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
