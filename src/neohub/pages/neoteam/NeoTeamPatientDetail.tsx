import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  User, Phone, Mail, MapPin, Calendar, FileText,
  ClipboardList, ArrowLeft, Edit, MessageCircle,
  AlertCircle, CheckCircle2, Clock, Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';

interface PatientData {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  address_city?: string;
  address_state?: string;
  address_street?: string;
  address_number?: string;
  address_neighborhood?: string;
  address_cep?: string;
  created_at?: string;
  surgery_date?: string;
  marital_status?: string;
  nationality?: string;
}

export default function NeoTeamPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('neohub_users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-4 lg:p-6">
        <NeoTeamBreadcrumb />
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Paciente não encontrado</h2>
            <p className="text-muted-foreground mb-4">O paciente solicitado não existe ou foi removido.</p>
            <Button onClick={() => navigate('/neoteam/patients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Pacientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = patient.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <NeoTeamBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/neoteam/patients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{patient.full_name}</h1>
            <p className="text-muted-foreground">
              #{id?.slice(0, 8).toUpperCase()} • Cadastrado em {patient.created_at 
                ? format(new Date(patient.created_at), "dd/MM/yyyy", { locale: ptBR }) 
                : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {patient.phone && (
            <Button variant="outline" onClick={() => openWhatsApp(patient.phone!)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          )}
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium">{patient.phone || 'Não informado'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="font-medium truncate">{patient.email || 'Não informado'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cidade</p>
              <p className="font-medium">
                {patient.address_city && patient.address_state 
                  ? `${patient.address_city}/${patient.address_state}` 
                  : 'Não informado'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data Cirurgia</p>
              <p className="font-medium">
                {patient.surgery_date 
                  ? format(new Date(patient.surgery_date), "dd/MM/yyyy", { locale: ptBR })
                  : 'Não agendada'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Prontuário
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="orientations" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Orientações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{patient.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{patient.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">
                      {patient.birth_date 
                        ? format(new Date(patient.birth_date), "dd/MM/yyyy", { locale: ptBR })
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado Civil</p>
                    <p className="font-medium">{patient.marital_status || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nacionalidade</p>
                    <p className="font-medium">{patient.nationality || 'Brasileira'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endereço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Logradouro</p>
                    <p className="font-medium">
                      {patient.address_street 
                        ? `${patient.address_street}, ${patient.address_number || 'S/N'}`
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bairro</p>
                    <p className="font-medium">{patient.address_neighborhood || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CEP</p>
                    <p className="font-medium">{patient.address_cep || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade</p>
                    <p className="font-medium">{patient.address_city || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium">{patient.address_state || 'Não informado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardContent className="p-8 text-center">
              <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Prontuário do Paciente</h3>
              <p className="text-muted-foreground">
                Histórico médico e registros clínicos do paciente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Documentos</h3>
              <p className="text-muted-foreground">
                Exames, contratos e outros documentos do paciente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orientations">
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Orientações</h3>
              <p className="text-muted-foreground">
                Orientações pré e pós-operatórias do paciente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
