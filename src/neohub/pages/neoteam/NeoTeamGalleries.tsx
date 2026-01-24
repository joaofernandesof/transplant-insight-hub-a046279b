import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGalleryManagement, useGalleryPhotos, CourseGallery } from '@/academy/hooks/useCourseGalleries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Plus, Images, Upload, Trash2, Eye, EyeOff, Calendar, Users, X, Loader2, Camera, Star, Crop, Lock, LockOpen
} from 'lucide-react';
import { ImageCropper } from '@/components/ImageCropper';
import { LinkGalleryRequirementDialog } from '@/neohub/components/LinkGalleryRequirementDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NeoTeamGalleries() {
  const {
    galleries,
    isLoading,
    isUploading,
    canWrite,
    canDelete,
    createGallery,
    deleteGallery,
    uploadPhotos,
    deletePhoto,
    toggleStatus,
    setCoverPhoto,
    refetch,
  } = useGalleryManagement();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<CourseGallery | null>(null);
  const [galleryToDelete, setGalleryToDelete] = useState<CourseGallery | null>(null);
  const [galleryForRequirement, setGalleryForRequirement] = useState<CourseGallery | null>(null);

  // Fetch courses and classes for the create form
  const { data: courses } = useQuery({
    queryKey: ['courses-for-gallery'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('id, title').order('title');
      return data || [];
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-for-gallery'],
    queryFn: async () => {
      const { data } = await supabase
        .from('course_classes')
        .select('id, name, code, course_id')
        .order('start_date', { ascending: false });
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Galerias de Fotos</h1>
          <p className="text-muted-foreground">
            Gerencie as fotos dos cursos e turmas
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Galeria
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <Images className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{galleries.length}</p>
                <p className="text-sm text-muted-foreground">Total de Galerias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {galleries.filter((g) => g.status === 'published').length}
                </p>
                <p className="text-sm text-muted-foreground">Publicadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900">
                <Camera className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {galleries.reduce((acc, g) => acc + g.photo_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total de Fotos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Galleries Grid */}
      {galleries.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Images className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma galeria criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie a primeira galeria para começar a organizar as fotos dos cursos.
            </p>
            {canWrite && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Galeria
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <GalleryManagementCard
              key={gallery.id}
              gallery={gallery}
              canWrite={canWrite}
              canDelete={canDelete}
              onEdit={() => setSelectedGallery(gallery)}
              onDelete={() => setGalleryToDelete(gallery)}
              onToggleStatus={() => toggleStatus(gallery)}
              onLinkRequirement={() => setGalleryForRequirement(gallery)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateGalleryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        courses={courses || []}
        classes={classes || []}
        onCreate={async (data) => {
          await createGallery.mutateAsync(data);
          setShowCreateDialog(false);
        }}
        isLoading={createGallery.isPending}
      />

      {/* Edit/Upload Dialog */}
      {selectedGallery && (
        <GalleryEditDialog
          gallery={selectedGallery}
          onClose={() => {
            setSelectedGallery(null);
            refetch();
          }}
          onUpload={uploadPhotos}
          onDeletePhoto={(photo) => deletePhoto.mutate(photo)}
          onSetCover={(galleryId, croppedBlob) => setCoverPhoto.mutate({ galleryId, croppedBlob })}
          isUploading={isUploading}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!galleryToDelete} onOpenChange={() => setGalleryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Galeria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a galeria "{galleryToDelete?.title}"?
              Todas as {galleryToDelete?.photo_count} fotos serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (galleryToDelete) {
                  deleteGallery.mutate(galleryToDelete.id);
                  setGalleryToDelete(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link Requirement Dialog */}
      {galleryForRequirement && (
        <LinkGalleryRequirementDialog
          open={!!galleryForRequirement}
          onOpenChange={(open) => !open && setGalleryForRequirement(null)}
          galleryId={galleryForRequirement.id}
          galleryTitle={galleryForRequirement.title}
          classId={galleryForRequirement.class_id}
          currentRequirement={galleryForRequirement.unlock_requirement || 'none'}
          currentExamId={galleryForRequirement.required_exam_id}
          currentSurveyType={galleryForRequirement.required_survey_type}
        />
      )}
    </div>
  );
}

// Sub-components

interface GalleryManagementCardProps {
  gallery: CourseGallery;
  canWrite: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onLinkRequirement: () => void;
}

function GalleryManagementCard({
  gallery,
  canWrite,
  canDelete,
  onEdit,
  onDelete,
  onToggleStatus,
  onLinkRequirement,
}: GalleryManagementCardProps) {
  const hasRequirement = gallery.unlock_requirement && gallery.unlock_requirement !== 'none';
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Clickable banner area */}
      <div 
        className="relative aspect-video bg-muted cursor-pointer group"
        onClick={onEdit}
      >
        {gallery.cover_photo_url ? (
          <img
            src={gallery.cover_photo_url}
            alt={gallery.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 group-hover:from-slate-200 group-hover:to-slate-300 dark:group-hover:from-slate-700 dark:group-hover:to-slate-800 transition-colors">
            <Images className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-full text-sm">
            Abrir Álbum
          </span>
        </div>
        <Badge
          className={`absolute top-2 right-2 ${
            gallery.status === 'published'
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          {gallery.status === 'published' ? 'Publicada' : 'Rascunho'}
        </Badge>
        {/* Requirement badge */}
        {hasRequirement && (
          <Badge className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 gap-1">
            <Lock className="h-3 w-3" />
            {gallery.unlock_requirement === 'exam' ? 'Prova' : 'Pesquisa'}
          </Badge>
        )}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
          {gallery.photo_count} fotos
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold truncate">{gallery.title}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {gallery.class_name} ({gallery.class_code})
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(gallery.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Gerenciar
          </Button>
          {canWrite && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLinkRequirement}
                title={hasRequirement ? 'Editar requisito de desbloqueio' : 'Vincular requisito de desbloqueio'}
              >
                {hasRequirement ? (
                  <Lock className="h-4 w-4 text-blue-600" />
                ) : (
                  <LockOpen className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleStatus}
                title={gallery.status === 'published' ? 'Ocultar' : 'Publicar'}
              >
                {gallery.status === 'published' ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CreateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: { id: string; title: string }[];
  classes: { id: string; name: string; code: string; course_id: string | null }[];
  onCreate: (data: { course_id: string; class_id: string; title: string; description?: string }) => Promise<void>;
  isLoading: boolean;
}

function CreateGalleryDialog({
  open,
  onOpenChange,
  courses,
  classes,
  onCreate,
  isLoading,
}: CreateGalleryDialogProps) {
  const [courseId, setCourseId] = useState('');
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const filteredClasses = classes.filter((c) => !courseId || c.course_id === courseId);

  const handleSubmit = async () => {
    if (!courseId || !classId || !title) return;
    await onCreate({ course_id: courseId, class_id: classId, title, description });
    // Reset form
    setCourseId('');
    setClassId('');
    setTitle('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Galeria de Fotos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Curso *</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Turma *</Label>
            <Select value={classId} onValueChange={setClassId} disabled={!courseId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {filteredClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Título da Galeria *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Fotos do Dia 1"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!courseId || !classId || !title || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Galeria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface GalleryEditDialogProps {
  gallery: CourseGallery;
  onClose: () => void;
  onUpload: (galleryId: string, files: File[]) => Promise<any[]>;
  onDeletePhoto: (photo: any) => void;
  onSetCover: (galleryId: string, croppedBlob: Blob) => void;
  isUploading: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

function GalleryEditDialog({
  gallery,
  onClose,
  onUpload,
  onDeletePhoto,
  onSetCover,
  isUploading,
  canWrite,
  canDelete,
}: GalleryEditDialogProps) {
  const { photos, isLoading, refetch } = useGalleryPhotos(gallery.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedPhotoForCrop, setSelectedPhotoForCrop] = useState<string | null>(null);

  const handleSelectCover = (photoUrl: string) => {
    setSelectedPhotoForCrop(photoUrl);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    onSetCover(gallery.id, croppedBlob);
    setCropperOpen(false);
    setSelectedPhotoForCrop(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await onUpload(gallery.id, files);
      refetch();
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {gallery.title}
            <Badge variant={gallery.status === 'published' ? 'default' : 'secondary'}>
              {gallery.status === 'published' ? 'Publicada' : 'Rascunho'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="photos" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="photos">
              Fotos ({gallery.photo_count})
            </TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Upload area */}
              {canWrite && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Arraste fotos aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Suporta upload de até 300 fotos por vez
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando fotos...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Fotos
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Photos grid */}
              {isLoading ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma foto nesta galeria
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {photos.map((photo) => {
                    const isCover = gallery.cover_photo_url === photo.full_url;
                    return (
                      <div
                        key={photo.id}
                        className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer ${
                          isCover ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                        onClick={() => canWrite && handleSelectCover(photo.full_url)}
                      >
                        <img
                          src={photo.thumbnail_url || photo.full_url}
                          alt={photo.caption || 'Foto'}
                          className="w-full h-full object-cover"
                        />
                        {/* Cover badge */}
                        {isCover && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Capa
                          </div>
                        )}
                        {/* Hover overlay for selecting cover */}
                        {canWrite && !isCover && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Definir como capa</span>
                          </div>
                        )}
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePhoto(photo);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Curso</Label>
                <p className="font-medium">{gallery.course_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Turma</Label>
                <p className="font-medium">
                  {gallery.class_name} ({gallery.class_code})
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="font-medium">
                  {gallery.description || 'Sem descrição'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Criada em</Label>
                <p className="font-medium">
                  {format(new Date(gallery.created_at), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Image Cropper for cover photo */}
      {selectedPhotoForCrop && (
        <ImageCropper
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setSelectedPhotoForCrop(null);
          }}
          imageSrc={selectedPhotoForCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </Dialog>
  );
}
