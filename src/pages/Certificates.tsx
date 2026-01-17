import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  Download, 
  CheckCircle2, 
  Clock, 
  Lock,
  GraduationCap
} from "lucide-react";

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

const mockCertificates: Certificate[] = [
  {
    id: '1',
    courseName: 'Técnicas Avançadas de Transplante Capilar',
    category: 'Técnico',
    status: 'completed',
    progress: 100,
    completedAt: '2025-12-15',
    hoursTotal: 40,
    hoursCompleted: 40
  },
  {
    id: '2',
    courseName: 'Gestão Comercial para Clínicas',
    category: 'Comercial',
    status: 'completed',
    progress: 100,
    completedAt: '2025-11-20',
    hoursTotal: 20,
    hoursCompleted: 20
  },
  {
    id: '3',
    courseName: 'Marketing Digital para Saúde',
    category: 'Marketing',
    status: 'in_progress',
    progress: 65,
    hoursTotal: 30,
    hoursCompleted: 19
  },
  {
    id: '4',
    courseName: 'Atendimento e Experiência do Paciente',
    category: 'Atendimento',
    status: 'in_progress',
    progress: 30,
    hoursTotal: 15,
    hoursCompleted: 4
  },
  {
    id: '5',
    courseName: 'Liderança e Gestão de Equipes',
    category: 'Gestão',
    status: 'locked',
    progress: 0,
    hoursTotal: 25,
    hoursCompleted: 0
  },
  {
    id: '6',
    courseName: 'Finanças para Clínicas de Estética',
    category: 'Financeiro',
    status: 'locked',
    progress: 0,
    hoursTotal: 20,
    hoursCompleted: 0
  }
];

const categoryColors: Record<string, string> = {
  'Técnico': 'bg-purple-100 text-purple-700',
  'Comercial': 'bg-blue-100 text-blue-700',
  'Marketing': 'bg-pink-100 text-pink-700',
  'Atendimento': 'bg-green-100 text-green-700',
  'Gestão': 'bg-amber-100 text-amber-700',
  'Financeiro': 'bg-emerald-100 text-emerald-700'
};

export default function Certificates() {
  const navigate = useNavigate();

  const completedCount = mockCertificates.filter(c => c.status === 'completed').length;
  const inProgressCount = mockCertificates.filter(c => c.status === 'in_progress').length;
  const totalHours = mockCertificates.reduce((acc, c) => acc + c.hoursCompleted, 0);

  const handleDownload = (certificate: Certificate) => {
    // Simular download do certificado
    console.log('Downloading certificate:', certificate.courseName);
  };

  return (
    <ModuleLayout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 pl-12 lg:pl-0">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Meus Certificados
              </h1>
              <p className="text-sm text-muted-foreground">Acompanhe seu progresso e baixe seus certificados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl overflow-x-hidden">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{completedCount}</p>
              <p className="text-xs text-green-600">Concluídos</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{inProgressCount}</p>
              <p className="text-xs text-amber-600">Em Andamento</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{totalHours}h</p>
              <p className="text-xs text-purple-600">Horas Certificadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Certificates List */}
        <div className="space-y-4">
          {mockCertificates.map((certificate) => (
            <Card 
              key={certificate.id} 
              className={`transition-all ${certificate.status === 'locked' ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    certificate.status === 'completed' 
                      ? 'bg-green-100' 
                      : certificate.status === 'in_progress' 
                        ? 'bg-amber-100' 
                        : 'bg-muted'
                  }`}>
                    {certificate.status === 'completed' ? (
                      <Award className="h-6 w-6 text-green-600" />
                    ) : certificate.status === 'in_progress' ? (
                      <Clock className="h-6 w-6 text-amber-600" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{certificate.courseName}</h3>
                      <Badge className={categoryColors[certificate.category] || 'bg-gray-100 text-gray-700'}>
                        {certificate.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>{certificate.hoursCompleted}h / {certificate.hoursTotal}h</span>
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

                  {certificate.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(certificate)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </Button>
                  )}
                  
                  {certificate.status === 'in_progress' && (
                    <Button 
                      size="sm"
                      onClick={() => navigate('/university')}
                    >
                      Continuar
                    </Button>
                  )}
                  
                  {certificate.status === 'locked' && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Bloqueado
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </ModuleLayout>
  );
}
