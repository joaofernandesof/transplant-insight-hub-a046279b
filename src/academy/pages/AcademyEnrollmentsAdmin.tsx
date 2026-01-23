import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RefreshCw,
  GraduationCap,
  FileSpreadsheet,
  ArrowLeft
} from "lucide-react";

interface EnrollmentResult {
  email: string;
  status: string;
  classId?: string;
  error?: string;
}

interface EnrollmentSummary {
  total: number;
  enrolled: number;
  skipped: number;
  errors: number;
}

export function AcademyEnrollmentsAdmin() {
  const navigate = useNavigate();
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<EnrollmentResult[]>([]);
  const [summary, setSummary] = useState<EnrollmentSummary | null>(null);

  // Fetch current enrollments
  const { data: enrollments, isLoading, refetch } = useQuery({
    queryKey: ["academy-all-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          id,
          status,
          enrolled_at,
          user_id,
          course_classes (
            id,
            name,
            courses (
              id,
              title
            )
          )
        `)
        .order("enrolled_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  // Fetch students count
  const { data: studentsCount } = useQuery({
    queryKey: ["academy-students-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("neohub_user_profiles")
        .select("id", { count: "exact" })
        .eq("profile", "aluno");

      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ["academy-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_classes")
        .select(`
          id,
          name,
          status,
          courses (
            id,
            title
          )
        `)
        .eq("status", "active");

      if (error) throw error;
      return data;
    }
  });

  const handleBulkImport = async () => {
    setIsImporting(true);
    setImportResults([]);
    setSummary(null);

    try {
      const response = await supabase.functions.invoke("bulk-enroll-students");
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.success) {
        setSummary(data.summary);
        setImportResults(data.results);
        toast.success(`Importação concluída! ${data.summary.enrolled} alunos matriculados.`);
        refetch();
      } else {
        throw new Error(data.error || "Erro na importação");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Erro na importação: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enrolled":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled":
        return <Badge className="bg-emerald-100 text-emerald-700">Matriculado</Badge>;
      case "skipped":
        return <Badge className="bg-amber-100 text-amber-700">Ignorado</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="pl-12 lg:pl-0">
            <GlobalBreadcrumb />
            <div className="flex items-center gap-3 mt-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/academy")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Gestão de Matrículas
                </h1>
                <p className="text-sm text-muted-foreground">Importe e gerencie matrículas em massa</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 overflow-x-hidden w-full max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950/50 dark:to-green-950/50 dark:border-emerald-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{studentsCount || 0}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">Total de Alunos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{enrollments?.length || 0}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">Matrículas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 dark:from-purple-950/50 dark:to-violet-950/50 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{classes?.length || 0}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-500">Turmas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {(studentsCount || 0) - (enrollments?.length || 0)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Sem Matrícula</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="bg-emerald-50 dark:bg-emerald-950/30">
            <TabsTrigger value="import" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <Upload className="h-4 w-4" />
              Importar Matrículas
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <Users className="h-4 w-4" />
              Matrículas Atuais ({enrollments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            {/* Import Card */}
            <Card className="border-2 border-dashed border-emerald-300 dark:border-emerald-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  Importar Matrículas da Planilha IBRAMEC
                </CardTitle>
                <CardDescription>
                  Esta ação irá vincular automaticamente os alunos às turmas baseado nos dados da planilha original.
                  Cursos mapeados: FORMAÇÃO 360, INSTRUMENTADOR, FELLOWSHIP, LICENÇA, MONITOR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>⚠️ Atenção:</strong> Esta operação irá criar matrículas para todos os alunos 
                    que ainda não estão matriculados. Alunos já matriculados serão ignorados.
                  </p>
                </div>

                <Button
                  onClick={handleBulkImport}
                  disabled={isImporting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Executar Importação em Massa
                    </>
                  )}
                </Button>

                {/* Results Summary */}
                {summary && (
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Resultado da Importação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold">{summary.total}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <p className="text-2xl font-bold text-emerald-600">{summary.enrolled}</p>
                          <p className="text-xs text-emerald-600">Matriculados</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                          <p className="text-2xl font-bold text-amber-600">{summary.skipped}</p>
                          <p className="text-xs text-amber-600">Ignorados</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
                          <p className="text-xs text-red-600">Erros</p>
                        </div>
                      </div>

                      <Progress 
                        value={(summary.enrolled / summary.total) * 100} 
                        className="h-3 mb-4"
                      />

                      {/* Detailed Results */}
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">Status</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Detalhe</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResults.map((result, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{getStatusIcon(result.status)}</TableCell>
                                <TableCell className="font-mono text-sm">{result.email}</TableCell>
                                <TableCell>
                                  {result.status === "enrolled" ? (
                                    <span className="text-emerald-600 text-sm">Matrícula criada</span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">{result.error}</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Matrículas Atuais</CardTitle>
                  <CardDescription>Lista de todas as matrículas ativas no sistema</CardDescription>
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Turma</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments?.map((enrollment: any) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              {enrollment.course_classes?.name || "—"}
                            </TableCell>
                            <TableCell>
                              {enrollment.course_classes?.courses?.title || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-100 text-emerald-700">
                                {enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {enrollment.enrolled_at 
                                ? new Date(enrollment.enrolled_at).toLocaleDateString("pt-BR")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!enrollments || enrollments.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhuma matrícula encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
