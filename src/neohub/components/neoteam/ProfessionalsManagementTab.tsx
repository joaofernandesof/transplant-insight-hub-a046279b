import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Stethoscope, Plus, Edit, Loader2, UserPlus,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DoctorScheduleEditor } from './DoctorScheduleEditor';

interface DoctorRow {
  id: string;
  full_name: string;
  specialty: string | null;
  crm: string | null;
  crm_state: string | null;
  email: string | null;
  phone: string | null;
  consultation_duration_minutes: number | null;
  is_active: boolean;
}

interface DoctorForm {
  full_name: string;
  specialty: string;
  crm: string;
  crm_state: string;
  email: string;
  phone: string;
  consultation_duration_minutes: number;
}

const EMPTY_FORM: DoctorForm = {
  full_name: '',
  specialty: '',
  crm: '',
  crm_state: '',
  email: '',
  phone: '',
  consultation_duration_minutes: 30,
};

export function ProfessionalsManagementTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorRow | null>(null);
  const [form, setForm] = useState<DoctorForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [filterActive, setFilterActive] = useState(true);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['neoteam-doctors-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_doctors')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as DoctorRow[];
    },
  });

  const filteredDoctors = doctors.filter(d => filterActive ? d.is_active : true);

  const openNew = () => {
    setEditingDoctor(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (doc: DoctorRow) => {
    setEditingDoctor(doc);
    setForm({
      full_name: doc.full_name,
      specialty: doc.specialty || '',
      crm: doc.crm || '',
      crm_state: doc.crm_state || '',
      email: doc.email || '',
      phone: doc.phone || '',
      consultation_duration_minutes: doc.consultation_duration_minutes || 30,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        specialty: form.specialty || null,
        crm: form.crm || null,
        crm_state: form.crm_state || null,
        email: form.email || null,
        phone: form.phone || null,
        consultation_duration_minutes: form.consultation_duration_minutes,
      };

      if (editingDoctor) {
        const { error } = await supabase
          .from('neoteam_doctors')
          .update(payload)
          .eq('id', editingDoctor.id);
        if (error) throw error;
        toast.success('Profissional atualizado');
      } else {
        const { error } = await supabase
          .from('neoteam_doctors')
          .insert(payload);
        if (error) throw error;
        toast.success('Profissional cadastrado');
      }

      queryClient.invalidateQueries({ queryKey: ['neoteam-doctors-management'] });
      queryClient.invalidateQueries({ queryKey: ['neoteam-doctors-schedule'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (doc: DoctorRow) => {
    const { error } = await supabase
      .from('neoteam_doctors')
      .update({ is_active: !doc.is_active })
      .eq('id', doc.id);
    if (error) {
      toast.error('Erro ao alterar status');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['neoteam-doctors-management'] });
    queryClient.invalidateQueries({ queryKey: ['neoteam-doctors-schedule'] });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Profissionais
            </CardTitle>
            <CardDescription>
              {doctors.filter(d => d.is_active).length} profissional(is) ativo(s)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filterActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive(!filterActive)}
            >
              {filterActive ? 'Ativos' : 'Todos'}
            </Button>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Profissional
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum profissional encontrado</p>
            <p className="text-sm mt-1">Cadastre profissionais para gerenciar suas agendas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map(doc => (
                  <TableRow key={doc.id} className={!doc.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{doc.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.specialty || '—'}</TableCell>
                    <TableCell>
                      {doc.crm ? (
                        <Badge variant="outline">{doc.crm}{doc.crm_state ? `/${doc.crm_state}` : ''}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {doc.email || doc.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <Switch checked={doc.is_active} onCheckedChange={() => toggleActive(doc)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              {editingDoctor ? 'Editar Profissional' : 'Novo Profissional'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Dr. João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input
                  value={form.specialty}
                  onChange={e => setForm({ ...form, specialty: e.target.value })}
                  placeholder="Cirurgião Plástico"
                />
              </div>
              <div className="space-y-2">
                <Label>CRM</Label>
                <Input
                  value={form.crm}
                  onChange={e => setForm({ ...form, crm: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label>UF do CRM</Label>
                <Input
                  value={form.crm_state}
                  onChange={e => setForm({ ...form, crm_state: e.target.value.toUpperCase() })}
                  placeholder="CE"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="dr.joao@clinica.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="(85) 99999-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Duração padrão da consulta (min)</Label>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={form.consultation_duration_minutes}
                  onChange={e => setForm({ ...form, consultation_duration_minutes: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>

            {/* Schedule Editor — only for existing doctors */}
            {editingDoctor && (
              <>
                <Separator />
                <DoctorScheduleEditor doctorId={editingDoctor.id} />
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.full_name.trim() || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingDoctor ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
