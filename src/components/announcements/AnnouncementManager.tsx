import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye,
  EyeOff,
  GripVertical,
  Megaphone
} from "lucide-react";
import { 
  useAllAnnouncements, 
  useUpdateAnnouncement, 
  useDeleteAnnouncement,
  Announcement 
} from "@/hooks/useAnnouncements";
import AnnouncementFormDialog from "./AnnouncementFormDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AnnouncementManager() {
  const { data: announcements, isLoading } = useAllAnnouncements();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleToggleActive = (announcement: Announcement) => {
    updateAnnouncement.mutate({
      id: announcement.id,
      is_active: !announcement.is_active,
    });
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteAnnouncement.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAnnouncement(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Gerenciar Anúncios</h2>
            <p className="text-sm text-muted-foreground">
              Crie banners para exibir em todos os módulos
            </p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Anúncio
        </Button>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : announcements?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nenhum anúncio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro anúncio para exibir nos módulos
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Anúncio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements?.map((announcement) => (
            <Card 
              key={announcement.id} 
              className={`transition-all ${!announcement.is_active ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div
                    className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: announcement.background_color }}
                  >
                    {announcement.image_url ? (
                      <img
                        src={announcement.image_url}
                        alt=""
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <Megaphone 
                        className="h-6 w-6" 
                        style={{ color: announcement.text_color }} 
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{announcement.title}</h4>
                      <Badge variant={announcement.is_active ? "default" : "secondary"}>
                        {announcement.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Prioridade: {announcement.priority}
                      </Badge>
                    </div>
                    {announcement.description && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {announcement.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Módulos: {announcement.target_modules?.includes("all") 
                          ? "Todos" 
                          : announcement.target_modules?.join(", ")}
                      </span>
                      {announcement.expires_at && (
                        <span>
                          Expira: {format(new Date(announcement.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={announcement.is_active}
                      onCheckedChange={() => handleToggleActive(announcement)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <AnnouncementFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        announcement={editingAnnouncement}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O anúncio será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
