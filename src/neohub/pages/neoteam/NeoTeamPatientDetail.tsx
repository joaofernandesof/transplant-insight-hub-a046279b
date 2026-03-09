import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  User, Phone, Mail, MapPin, Calendar, FileText,
  ArrowLeft, Edit, MessageCircle, Clock,
  AlertCircle, Stethoscope, ClipboardList,
  RefreshCw, History, CheckCircle, XCircle, CalendarCheck,
  DollarSign, CreditCard, AlertTriangle, Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { AddSurgeryDialog } from '@/clinic/components/AddSurgeryDialog';
import { toast } from 'sonner';

interface PatientData {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  notes?: string;
  created_at?: string;
  medical_record?: string;
  branch?: string;
  category?: string;
  baldnessGrade?: string;
  city?: string;
  state?: string;
  address?: string;
  birthDate?: string;
  nationality?: string;
  maritalStatus?: string;
  consultant?: string;
  seller?: string;
  surgeryDate?: string;
  leadSource?: string;
  observations?: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  type: 'appointment' | 'surgery' | 'registration';
  status?: string;
}

interface FinancialSummary {
  totalContract: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  installmentsCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

const parseNotes = (notes: string | null): Record<string, string> => {
  if (!notes) return {};
  const result: Record<string, string> = {};
  const pairs = notes.split('|');
  for (const pair of pairs) {
    const match = pair.match(/([^:]+):\s*(.+)/);
    if (match) {
      result[match[1].trim().toLowerCase()] = match[2].trim();
    }
  }
  return result;
};

const getCategoryColor = (category: string) => {
  if (!category) return 'bg-muted text-muted-foreground';
  const upper = category.toUpperCase();
  if (upper.includes('CATEGORIA A')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (upper.includes('CATEGORIA B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (upper.includes('CATEGORIA C')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (upper.includes('CATEGORIA D')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  return 'bg-muted text-muted-foreground';
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function NeoTeamPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSurgeryDialog, setShowSurgeryDialog] = useState(false);
  const [observationsText, setObservationsText] = useState('');
  const [savingObs, setSavingObs] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [financial, setFinancial] = useState<FinancialSummary>({
    totalContract: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0,
    installmentsCount: 0, paidCount: 0, pendingCount: 0, overdueCount: 0,
  });

  // Start in edit mode if ?edit=true
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && patient && !isEditing) {
      startEditing();
      setSearchParams({}, { replace: true });
    }
  }, [patient, searchParams]);

  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchTimeline();
      fetchFinancial();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      // Try clinic_patients first
      const { data, error } = await supabase
        .from('clinic_patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const parsed = parseNotes(data.notes);
        const obs = parsed['observações'] || parsed['obs'] || '';
        setObservationsText(obs);

        // Enrich with clinic_surgeries data (has branch, category, procedure, grade, etc.)
        let surgeryData: any = null;
        if (data.full_name) {
          const { data: surgeries } = await supabase
            .from('clinic_surgeries')
            .select('branch, category, procedure, grade, surgery_date, companion_name, companion_phone, medical_record')
            .eq('patient_name', data.full_name)
            .order('created_at', { ascending: false })
            .limit(1);
          if (surgeries && surgeries.length > 0) {
            surgeryData = surgeries[0];
          }
        }

        setPatient({
          id: data.id,
          full_name: data.full_name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          cpf: data.cpf || undefined,
          notes: data.notes || undefined,
          created_at: data.created_at,
          medical_record: data.medical_record || surgeryData?.medical_record || undefined,
          branch: parsed['filial'] || surgeryData?.branch || undefined,
          category: parsed['categoria'] || surgeryData?.category || undefined,
          baldnessGrade: parsed['grau'] || surgeryData?.grade || undefined,
          city: parsed['cidade'] || undefined,
          state: parsed['estado'] || parsed['uf'] || undefined,
          address: parsed['endereço'] || parsed['endereco'] || undefined,
          birthDate: parsed['nascimento'] || parsed['data nascimento'] || undefined,
          nationality: parsed['nacionalidade'] || undefined,
          maritalStatus: parsed['estado civil'] || undefined,
          consultant: parsed['consultor'] || undefined,
          seller: parsed['vendedor'] || undefined,
          surgeryDate: parsed['data cirurgia'] || parsed['cirurgia'] || (surgeryData?.surgery_date ? format(new Date(surgeryData.surgery_date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : undefined),
          leadSource: parsed['fonte'] || parsed['lead source'] || undefined,
          observations: obs || undefined,
        });
        return;
      }

      // Fallback: try neohub_users (tasks may reference this table)
      const { data: neoData, error: neoError } = await supabase
        .from('neohub_users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (neoError) throw neoError;

      if (neoData) {
        setPatient({
          id: neoData.id,
          full_name: neoData.full_name,
          email: neoData.email || undefined,
          phone: neoData.phone || undefined,
          cpf: neoData.cpf || undefined,
          notes: undefined,
          created_at: neoData.created_at,
          city: neoData.address_city || undefined,
          state: neoData.address_state || undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    if (!id) return;
    const events: TimelineEvent[] = [];

    try {
      const { data: patientData } = await supabase
        .from('clinic_patients')
        .select('full_name, created_at')
        .eq('id', id)
        .maybeSingle();

      if (!patientData) return;

      if (patientData.created_at) {
        events.push({
          id: 'registration',
          date: patientData.created_at,
          title: 'Paciente cadastrado',
          description: 'Registro do paciente no sistema',
          type: 'registration',
        });
      }

      const { data: appointments } = await supabase
        .from('neoteam_appointments')
        .select('*')
        .or(`patient_id.eq.${id},patient_name.ilike.${patientData.full_name}`)
        .order('appointment_date', { ascending: false });

      if (appointments) {
        for (const apt of appointments) {
          events.push({
            id: `apt-${apt.id}`,
            date: apt.appointment_date,
            time: apt.appointment_time,
            title: apt.type || 'Consulta',
            description: [apt.doctor_name && `Dr(a). ${apt.doctor_name}`, apt.branch, apt.notes].filter(Boolean).join(' · '),
            type: 'appointment',
            status: apt.status,
          });
        }
      }

      // clinic_surgeries (main surgery table)
      const { data: clinicSurgeries } = await supabase
        .from('clinic_surgeries')
        .select('id, surgery_date, surgery_time, procedure, category, branch, schedule_status')
        .eq('patient_name', patientData.full_name)
        .order('surgery_date', { ascending: false });

      if (clinicSurgeries) {
        for (const surg of clinicSurgeries) {
          if (surg.surgery_date) {
            events.push({
              id: `csurg-${surg.id}`,
              date: surg.surgery_date,
              time: surg.surgery_time || undefined,
              title: surg.procedure || 'Cirurgia',
              description: [surg.category, surg.branch, surg.schedule_status === 'Confirmada' ? 'Confirmada' : 'Pendente'].filter(Boolean).join(' · '),
              type: 'surgery',
              status: surg.schedule_status === 'Confirmada' ? 'confirmed' : 'scheduled',
            });
          }
        }
      }

      // surgery_schedule (legacy)
      const { data: surgeries } = await supabase
        .from('surgery_schedule')
        .select('*')
        .ilike('patient_name', patientData.full_name)
        .order('surgery_date', { ascending: false });

      if (surgeries) {
        for (const surg of surgeries) {
          events.push({
            id: `surg-${surg.id}`,
            date: surg.surgery_date,
            time: surg.surgery_time || undefined,
            title: surg.procedure_type || 'Cirurgia',
            description: [surg.medico && `Dr(a). ${surg.medico}`, surg.cidade, surg.confirmed ? 'Confirmada' : 'Pendente'].filter(Boolean).join(' · '),
            type: 'surgery',
            status: surg.confirmed ? 'confirmed' : 'scheduled',
          });
        }
      }

      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimeline(events);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const fetchFinancial = async () => {
    if (!id) return;
    try {
      // Fetch surgery_schedule data for this patient to get financial info
      const { data: patientData } = await supabase
        .from('clinic_patients')
        .select('full_name')
        .eq('id', id)
        .maybeSingle();

      if (!patientData) return;

      const { data: surgeries } = await supabase
        .from('surgery_schedule')
        .select('final_value, deposit_paid, remaining_paid, balance_due, contract_signed')
        .ilike('patient_name', patientData.full_name);

      if (surgeries && surgeries.length > 0) {
        const totalContract = surgeries.reduce((s, r) => s + (r.final_value || 0), 0);
        const totalPaid = surgeries.reduce((s, r) => s + (r.deposit_paid || 0) + (r.remaining_paid || 0), 0);
        const totalBalance = surgeries.reduce((s, r) => s + (r.balance_due || 0), 0);

        setFinancial({
          totalContract,
          totalPaid,
          totalPending: totalBalance,
          totalOverdue: 0,
          installmentsCount: surgeries.length,
          paidCount: surgeries.filter(s => (s.balance_due || 0) <= 0).length,
          pendingCount: surgeries.filter(s => (s.balance_due || 0) > 0).length,
          overdueCount: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const saveObservations = async () => {
    if (!patient || !id) return;
    setSavingObs(true);
    try {
      // Rebuild notes with updated observations
      const currentNotes = patient.notes || '';
      const parsed = parseNotes(currentNotes);
      parsed['observações'] = observationsText;

      const newNotes = Object.entries(parsed)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');

      const { error } = await supabase
        .from('clinic_patients')
        .update({ notes: newNotes })
        .eq('id', id);

      if (error) throw error;
      toast.success('Observações salvas!');
      setPatient(prev => prev ? { ...prev, notes: newNotes, observations: observationsText } : null);
    } catch (err) {
      console.error('Error saving observations:', err);
      toast.error('Erro ao salvar observações');
    } finally {
      setSavingObs(false);
    }
  };

  const startEditing = () => {
    if (!patient) return;
    setEditData({
      full_name: patient.full_name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      cpf: patient.cpf || '',
      birthDate: patient.birthDate || '',
      maritalStatus: patient.maritalStatus || '',
      nationality: patient.nationality || '',
      branch: patient.branch || '',
      category: patient.category || '',
      baldnessGrade: patient.baldnessGrade || '',
      surgeryDate: patient.surgeryDate || '',
      consultant: patient.consultant || '',
      seller: patient.seller || '',
      leadSource: patient.leadSource || '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  const saveEditing = async () => {
    if (!patient || !id) return;
    setSavingEdit(true);
    try {
      // Build notes string from edit data (keep non-editable parsed fields too)
      const currentParsed = parseNotes(patient.notes || null);
      
      // Update parsed fields
      const fieldMap: Record<string, string> = {
        'filial': editData.branch || '',
        'categoria': editData.category || '',
        'grau': editData.baldnessGrade || '',
        'cidade': editData.city || '',
        'estado': editData.state || '',
        'endereço': editData.address || '',
        'nascimento': editData.birthDate || '',
        'estado civil': editData.maritalStatus || '',
        'nacionalidade': editData.nationality || '',
        'consultor': editData.consultant || '',
        'vendedor': editData.seller || '',
        'data cirurgia': editData.surgeryDate || '',
        'fonte': editData.leadSource || '',
      };

      // Merge: keep existing keys not in fieldMap, override with fieldMap
      const merged = { ...currentParsed };
      for (const [k, v] of Object.entries(fieldMap)) {
        if (v) {
          merged[k] = v;
        } else {
          delete merged[k];
        }
      }
      // Keep observations
      if (observationsText) {
        merged['observações'] = observationsText;
      }

      const newNotes = Object.entries(merged)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');

      const { error } = await supabase
        .from('clinic_patients')
        .update({
          full_name: editData.full_name,
          email: editData.email || null,
          phone: editData.phone || null,
          cpf: editData.cpf || null,
          notes: newNotes,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Paciente atualizado com sucesso!');
      setIsEditing(false);
      setEditData({});
      fetchPatient(); // Reload data
    } catch (err) {
      console.error('Error saving patient:', err);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSavingEdit(false);
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

      {/* === CPG-Style Header === */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/neoteam/patients')} className="self-start -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl lg:text-2xl font-bold truncate">{patient.full_name}</h1>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                  Ativo
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {patient.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{patient.email}</span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{patient.phone}</span>
                )}
                {patient.cpf && (
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{patient.cpf}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {patient.category && (
                  <Badge className={`${getCategoryColor(patient.category)} border-0 text-xs`}>{patient.category}</Badge>
                )}
                {patient.branch && <Badge variant="outline" className="text-xs">{patient.branch}</Badge>}
                {patient.baldnessGrade && <Badge variant="outline" className="text-xs">Grau {patient.baldnessGrade}</Badge>}
                {patient.surgeryDate && (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-400">
                    <Calendar className="h-3 w-3 mr-1" />Cirurgia: {patient.surgeryDate}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 self-start">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEditing} disabled={savingEdit}>Cancelar</Button>
                  <Button size="sm" onClick={saveEditing} disabled={savingEdit}>
                    {savingEdit ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={startEditing}><Edit className="h-4 w-4 mr-1.5" />Editar</Button>
              )}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t px-6 py-3 flex flex-wrap gap-2">
          {patient.phone && (
            <>
              <Button variant="outline" size="sm" onClick={() => openWhatsApp(patient.phone!)}>
                <MessageCircle className="h-4 w-4 mr-1.5" />WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(`tel:${patient.phone}`)}>
                <Phone className="h-4 w-4 mr-1.5" />Ligar
              </Button>
            </>
          )}
          {patient.email && (
            <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${patient.email}`)}>
              <Mail className="h-4 w-4 mr-1.5" />Enviar Email
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSurgeryDialog(true)}>
            <Calendar className="h-4 w-4 mr-1.5" />Agendar Cirurgia
          </Button>
        </div>
      </div>

      {/* === Content: Two-column layout === */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Paciente */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Informações do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <EditableField label="Nome Completo" field="full_name" value={patient.full_name} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="CPF" field="cpf" value={patient.cpf} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Telefone" field="phone" value={patient.phone} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Email" field="email" value={patient.email} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Data de Nascimento" field="birthDate" value={patient.birthDate} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Estado Civil" field="maritalStatus" value={patient.maritalStatus} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Nacionalidade" field="nationality" value={patient.nationality || 'Brasileira'} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <InfoField
                  label="Cadastrado em"
                  value={patient.created_at ? format(new Date(patient.created_at), "dd/MM/yyyy", { locale: ptBR }) : undefined}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <EditableField label="Filial" field="branch" value={patient.branch} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Categoria" field="category" value={patient.category} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Grau de Calvície" field="baldnessGrade" value={patient.baldnessGrade} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Data da Cirurgia" field="surgeryDate" value={patient.surgeryDate} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Consultor" field="consultant" value={patient.consultant} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Vendedor" field="seller" value={patient.seller} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Fonte do Lead" field="leadSource" value={patient.leadSource} isEditing={isEditing} editData={editData} setEditData={setEditData} />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <EditableField label="Logradouro" field="address" value={patient.address} isEditing={isEditing} editData={editData} setEditData={setEditData} span2 />
                <EditableField label="Cidade" field="city" value={patient.city} isEditing={isEditing} editData={editData} setEditData={setEditData} />
                <EditableField label="Estado/UF" field="state" value={patient.state} isEditing={isEditing} editData={editData} setEditData={setEditData} />
              </div>
            </CardContent>
          </Card>

          {/* Observações - always visible */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={observationsText}
                onChange={(e) => setObservationsText(e.target.value)}
                placeholder="Adicione observações sobre o paciente..."
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={saveObservations}
                  disabled={savingObs || observationsText === (patient.observations || '')}
                >
                  {savingObs ? 'Salvando...' : 'Salvar Observações'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Resumo Financeiro
              </CardTitle>
              <p className="text-xs text-muted-foreground">Honorários e pagamentos</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Total Contrato
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(financial.totalContract)}</p>
                  <p className="text-xs text-muted-foreground">{financial.installmentsCount} parcela(s)</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Pago
                  </div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(financial.totalPaid)}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">{financial.paidCount} parcela(s)</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Pendente
                  </div>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatCurrency(financial.totalPending)}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">{financial.pendingCount} parcela(s)</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Receipt className="h-3.5 w-3.5" />
                    Vencido
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(financial.totalOverdue)}</p>
                  <p className="text-xs text-muted-foreground">{financial.overdueCount} parcela(s)</p>
                </div>
              </div>

              {/* Tabs placeholder */}
              <Tabs defaultValue="parcelas">
                <TabsList className="h-8">
                  <TabsTrigger value="parcelas" className="text-xs"><Receipt className="h-3 w-3 mr-1" />Parcelas</TabsTrigger>
                  <TabsTrigger value="historico" className="text-xs"><History className="h-3 w-3 mr-1" />Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="parcelas">
                  {financial.installmentsCount === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma parcela cadastrada</p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        {financial.installmentsCount} registro(s) financeiro(s) encontrado(s) na agenda cirúrgica.
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="historico">
                  <div className="text-center py-8">
                    <History className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum histórico de pagamento</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Prontuário */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Prontuário
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {patient.medical_record ? (
                <p className="text-sm">{patient.medical_record}</p>
              ) : (
                <div className="text-center py-6">
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum prontuário registrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linha do Tempo */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Linha do Tempo
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { fetchPatient(); fetchTimeline(); fetchFinancial(); }}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Agendamentos, cirurgias e atividades</p>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    As atividades aparecerão aqui conforme você interagir com o paciente
                  </p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
                  {timeline.map((event) => (
                    <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                      <div className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        event.type === 'surgery'
                          ? 'border-destructive bg-destructive/10'
                          : event.type === 'appointment'
                          ? 'border-primary bg-primary/10'
                          : 'border-muted-foreground bg-muted'
                      }`}>
                        {event.type === 'surgery' ? (
                          <Stethoscope className="h-3 w-3 text-destructive" />
                        ) : event.type === 'appointment' ? (
                          <CalendarCheck className="h-3 w-3 text-primary" />
                        ) : (
                          <User className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          {event.status && <TimelineStatusBadge status={event.status} />}
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            try {
                              return format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR });
                            } catch {
                              return event.date;
                            }
                          })()}
                          {event.time && ` às ${event.time.slice(0, 5)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Documentos
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs">+ Novo</Button>
              </div>
              <p className="text-xs text-muted-foreground">Exames, contratos e documentos</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum documento</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Surgery Dialog */}
      <AddSurgeryDialog
        open={showSurgeryDialog}
        onOpenChange={setShowSurgeryDialog}
        defaultWithDate={true}
        requireExistingPatient={true}
        prefilledPatient={patient ? { id: patient.id, name: patient.full_name } : undefined}
      />
    </div>
  );
}

function TimelineStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'Agendado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    confirmed: { label: 'Confirmado', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    completed: { label: 'Realizado', className: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive' },
    no_show: { label: 'Não compareceu', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    in_progress: { label: 'Em andamento', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };
  const c = config[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return <Badge className={`${c.className} border-0 text-[10px] px-1.5 py-0`}>{c.label}</Badge>;
}

function EditableField({ 
  label, field, value, isEditing, editData, setEditData, span2 
}: { 
  label: string; field: string; value?: string; isEditing: boolean; 
  editData: Record<string, string>; setEditData: React.Dispatch<React.SetStateAction<Record<string, string>>>; 
  span2?: boolean;
}) {
  if (isEditing) {
    return (
      <div className={span2 ? 'col-span-2' : ''}>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <Input
          value={editData[field] || ''}
          onChange={(e) => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
          className="h-8 text-sm"
        />
      </div>
    );
  }
  return <InfoField label={label} value={value} span2={span2} />;
}

function InfoField({ label, value, span2 }: { label: string; value?: string; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}
