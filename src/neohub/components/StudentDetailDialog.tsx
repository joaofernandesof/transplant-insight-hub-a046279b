import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  GraduationCap,
  Calendar,
  Save,
  Edit2,
  Instagram,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StudentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  enrollmentInfo?: {
    status: string;
    enrolledAt: string;
    className: string;
  };
}

interface StudentDetails {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  avatarUrl: string | null;
  bio: string | null;
  instagram: string | null;
  createdAt: string;
  clinicName: string | null;
}

export function StudentDetailDialog({
  open,
  onOpenChange,
  userId,
  enrollmentInfo,
}: StudentDetailDialogProps) {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: "",
    city: "",
    state: "",
    bio: "",
    instagram: "",
    clinicName: "",
  });

  useEffect(() => {
    if (open && userId) {
      loadStudentDetails();
    }
  }, [open, userId]);

  const loadStudentDetails = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("neohub_users")
        .select("id, user_id, full_name, email, phone, address_city, address_state, avatar_url, bio, instagram_personal, created_at, clinic_name")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      const details: StudentDetails = {
        id: data.id,
        userId: data.user_id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        city: data.address_city,
        state: data.address_state,
        avatarUrl: data.avatar_url,
        bio: data.bio,
        instagram: data.instagram_personal,
        createdAt: data.created_at,
        clinicName: data.clinic_name,
      };

      setStudent(details);
      setEditForm({
        phone: details.phone || "",
        city: details.city || "",
        state: details.state || "",
        bio: details.bio || "",
        instagram: details.instagram || "",
        clinicName: details.clinicName || "",
      });
    } catch (error) {
      console.error("Error loading student details:", error);
      toast.error("Erro ao carregar detalhes do aluno");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!student) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("neohub_users")
        .update({
          phone: editForm.phone || null,
          address_city: editForm.city || null,
          address_state: editForm.state || null,
          bio: editForm.bio || null,
          instagram_personal: editForm.instagram || null,
          clinic_name: editForm.clinicName || null,
        })
        .eq("id", student.id);

      if (error) throw error;

      setStudent(prev => prev ? {
        ...prev,
        phone: editForm.phone || null,
        city: editForm.city || null,
        state: editForm.state || null,
        bio: editForm.bio || null,
        instagram: editForm.instagram || null,
        clinicName: editForm.clinicName || null,
      } : null);

      setIsEditing(false);
      toast.success("Informações atualizadas!");
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Erro ao atualizar informações");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Aluno</DialogTitle>
          <DialogDescription>
            Visualize e edite as informações do aluno
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* Header with Avatar */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={student.avatarUrl || undefined} alt={student.fullName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {getInitials(student.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{student.fullName}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {student.email}
                </p>
                {enrollmentInfo && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {enrollmentInfo.className}
                    </Badge>
                    <Badge 
                      className={
                        enrollmentInfo.status === "enrolled" || enrollmentInfo.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                      }
                    >
                      {enrollmentInfo.status === "enrolled" || enrollmentInfo.status === "confirmed" 
                        ? "Matriculado" 
                        : "Pendente"}
                    </Badge>
                  </div>
                )}
              </div>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </>
                )}
              </Button>
            </div>

            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="profile">Perfil</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      Telefone
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {student.phone || "Não informado"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      Clínica
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editForm.clinicName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, clinicName: e.target.value }))}
                        placeholder="Nome da clínica"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {student.clinicName || "Não informado"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Cidade
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editForm.city}
                        onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Cidade"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {student.city || "Não informado"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.state}
                        onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="UF"
                        maxLength={2}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {student.state || "Não informado"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-muted-foreground">Data de Cadastro</Label>
                    <p className="text-sm flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(parseISO(student.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {enrollmentInfo && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Data de Matrícula</Label>
                      <p className="text-sm flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(parseISO(enrollmentInfo.enrolledAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5" />
                    Instagram
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editForm.instagram}
                      onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="@usuario"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {student.instagram ? `@${student.instagram.replace("@", "")}` : "Não informado"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Bio
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Uma breve descrição sobre o aluno..."
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {student.bio || "Sem bio cadastrada"}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {isEditing && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar Alterações
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aluno não encontrado
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
