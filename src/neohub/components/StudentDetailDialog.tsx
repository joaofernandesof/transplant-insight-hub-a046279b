import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, MapPin, Phone, Building2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface StudentDetail {
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  address_city: string | null;
  address_state: string | null;
  clinic_name: string | null;
}

export function StudentDetailDialog({ open, onOpenChange, userId, enrollmentInfo }: StudentDetailDialogProps) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !open) return;
    setLoading(true);
    supabase
      .from("neohub_users")
      .select("full_name, email, avatar_url, phone, address_city, address_state, clinic_name")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        setStudent(data as StudentDetail | null);
        setLoading(false);
      });
  }, [userId, open]);

  const initials = student?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Detalhes do Aluno
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : student ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarImage src={student.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{student.full_name}</p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              {student.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {student.phone}
                </div>
              )}
              {(student.address_city || student.address_state) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {[student.address_city, student.address_state].filter(Boolean).join(", ")}
                </div>
              )}
              {student.clinic_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {student.clinic_name}
                </div>
              )}
            </div>

            {enrollmentInfo && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium">Matrícula</p>
                <div className="flex items-center gap-2">
                  <Badge variant={enrollmentInfo.status === "active" ? "default" : "secondary"}>
                    {enrollmentInfo.status === "active" ? "Ativo" : enrollmentInfo.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(enrollmentInfo.enrolledAt), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Turma: {enrollmentInfo.className}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aluno não encontrado.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
