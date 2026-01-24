import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUniversity } from "@/hooks/useUniversity";

import { 
  Award, 
  Download, 
  CheckCircle2, 
  Clock, 
  Lock,
  GraduationCap,
  Trophy,
  Share2,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_COMMERCIAL = "5511503914006";

interface Certificate {
  id: string;
  courseName: string;
  category: string;
  status: 'completed' | 'in_progress' | 'locked';
  progress: number;
  completedAt?: string;
  hoursTotal: number;
  hoursCompleted: number;
}

const categoryColors: Record<string, string> = {
  'Técnico': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  'Comercial': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'Marketing': 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  'Atendimento': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  'Gestão': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'Financeiro': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
};

export function AcademyCertificates() {
  const navigate = useNavigate();
  const { courses } = useUniversity();

  // Generate certificates from courses
  const certificates: Certificate[] = courses.map(course => ({
    id: course.id,
    courseName: course.title,
    category: course.difficulty === 'advanced' ? 'Técnico' : 
              course.difficulty === 'intermediate' ? 'Comercial' : 'Atendimento',
    status: course.enrollment?.status === 'completed' ? 'completed' : 
            course.enrollment ? 'in_progress' : 'locked',
    progress: course.enrollment?.progress_percent || 0,
    completedAt: course.enrollment?.status === 'completed' ? 
                 course.enrollment?.completed_at?.split('T')[0] : undefined,
    hoursTotal: course.duration_hours || 20,
    hoursCompleted: Math.round((course.enrollment?.progress_percent || 0) * (course.duration_hours || 20) / 100)
  }));

  // Add mock certificates if no real data
  const displayCertificates = certificates.length > 0 ? certificates : [
    {
      id: '1',
      courseName: 'Técnicas Avançadas de Transplante Capilar',
      category: 'Técnico',
      status: 'completed' as const,
      progress: 100,
      completedAt: '2025-12-15',
      hoursTotal: 40,
      hoursCompleted: 40
    },
    {
      id: '2',
      courseName: 'Gestão Comercial para Clínicas',
      category: 'Comercial',
      status: 'completed' as const,
      progress: 100,
      completedAt: '2025-11-20',
      hoursTotal: 20,
      hoursCompleted: 20
    },
    {
      id: '3',
      courseName: 'Marketing Digital para Saúde',
      category: 'Marketing',
      status: 'in_progress' as const,
      progress: 65,
      hoursTotal: 30,
      hoursCompleted: 19
    },
    {
      id: '4',
      courseName: 'Atendimento e Experiência do Paciente',
      category: 'Atendimento',
      status: 'in_progress' as const,
      progress: 30,
      hoursTotal: 15,
      hoursCompleted: 4
    },
  ];

  const completedCount = displayCertificates.filter(c => c.status === 'completed').length;
  const inProgressCount = displayCertificates.filter(c => c.status === 'in_progress').length;
  const totalHours = displayCertificates.reduce((acc, c) => acc + c.hoursCompleted, 0);

  const handleDownload = (certificate: Certificate) => {
    toast.success('Baixando certificado...', {
      description: `${certificate.courseName}`,
    });
  };

  const handleShare = (certificate: Certificate) => {
    toast.success('Link copiado!', {
      description: 'Compartilhe seu certificado nas redes sociais',
    });
  };

  const handleEnrollWhatsApp = (courseName: string) => {
    const message = encodeURIComponent(`Olá! Tenho interesse em me matricular no curso "${courseName}". Gostaria de mais informações.`);
    window.open(`https://wa.me/${WHATSAPP_COMMERCIAL}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pt-16 lg:pt-6 pb-6 overflow-x-hidden w-full">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            Meus Certificados
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe seu progresso e baixe seus certificados</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{completedCount}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Concluídos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{inProgressCount}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Em Andamento</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 dark:from-purple-950/50 dark:to-violet-950/50 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{totalHours}h</p>
              <p className="text-xs text-purple-600 dark:text-purple-500">Horas Certificadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Banner */}
        {completedCount > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-amber-500 to-yellow-500 border-none text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Parabéns! 🎉</h3>
                  <p className="text-white/90">Você concluiu {completedCount} {completedCount === 1 ? 'curso' : 'cursos'} e acumulou {totalHours} horas de certificação!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates List */}
        <div className="space-y-4">
          {displayCertificates.map((certificate) => (
            <Card 
              key={certificate.id} 
              className={`transition-all hover:shadow-md ${certificate.status === 'locked' ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    certificate.status === 'completed' 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                      : certificate.status === 'in_progress' 
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500' 
                        : 'bg-muted'
                  }`}>
                    {certificate.status === 'completed' ? (
                      <Award className="h-6 w-6 text-white" />
                    ) : certificate.status === 'in_progress' ? (
                      <Clock className="h-6 w-6 text-white" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{certificate.courseName}</h3>
                      <Badge className={categoryColors[certificate.category] || 'bg-gray-100 text-gray-700'}>
                        {certificate.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {certificate.hoursCompleted}h / {certificate.hoursTotal}h
                      </span>
                      {certificate.completedAt && (
                        <span>Concluído em {new Date(certificate.completedAt).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>

                    {certificate.status !== 'completed' && (
                      <div className="flex items-center gap-2">
                        <Progress value={certificate.progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">{certificate.progress}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {certificate.status === 'completed' && (
                      <>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleDownload(certificate)}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Download className="h-4 w-4" />
                          Baixar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleShare(certificate)}
                          className="flex items-center gap-2"
                        >
                          <Share2 className="h-4 w-4" />
                          Compartilhar
                        </Button>
                      </>
                    )}
                    
                    {certificate.status === 'in_progress' && (
                      <Button 
                        size="sm"
                        onClick={() => navigate('/academy/courses')}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Continuar
                      </Button>
                    )}
                    
                    {certificate.status === 'locked' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnrollWhatsApp(certificate.courseName)}
                        className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Inscrever-se
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
