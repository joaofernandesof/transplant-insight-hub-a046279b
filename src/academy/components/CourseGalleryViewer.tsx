import { useState, useMemo } from 'react';
import { useStudentGalleries, useGalleryPhotos, useGalleryManagement, CourseGallery, GalleryPhoto } from '../hooks/useCourseGalleries';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Images, ChevronLeft, ChevronRight, X, Camera, Calendar, Upload, Loader2, UserSearch, ImageIcon, Lock, ClipboardList, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { SelfieCaptureDialog } from './SelfieCaptureDialog';
import { toast } from 'sonner';
import { CoverPhotoCropper } from './CoverPhotoCropper';

interface CourseGalleryViewerProps {
  classId: string;
  isLocked?: boolean;
  onUnlockRequest?: () => void;
  onOpenDay1Survey?: () => void;
  onOpenDay2Survey?: () => void;
}

// Survey table name mapping
const SURVEY_TABLE_MAP: Record<string, string> = {
  'day1_satisfaction': 'day1_satisfaction_surveys',
  'day2_satisfaction': 'day2_satisfaction_surveys',
  'day3_satisfaction': 'day3_satisfaction_surveys',
  'final_satisfaction': 'final_satisfaction_surveys',
};

export function CourseGalleryViewer({ classId, isLocked = false, onUnlockRequest, onOpenDay1Survey, onOpenDay2Survey }: CourseGalleryViewerProps) {
  const { galleries, isLoading } = useStudentGalleries(classId);
  const { isAdmin, canAccessModule, user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [selectedGallery, setSelectedGallery] = useState<CourseGallery | null>(null);
  
  const canManageGalleries = isAdmin || canAccessModule('neoteam_galleries', 'write');

  // Check completed exams for the user
  const { data: completedExams } = useQuery({
    queryKey: ['user-completed-exams', user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return [];
      const { data } = await supabase
        .from('exam_attempts')
        .select('exam_id')
        .eq('user_id', user.authUserId)
        .eq('status', 'completed');
      return data?.map(a => a.exam_id) || [];
    },
    enabled: !!user?.authUserId,
  });

  // Check completed surveys for the user
  const { data: completedSurveys } = useQuery({
    queryKey: ['user-completed-surveys', user?.authUserId, classId],
    queryFn: async () => {
      if (!user?.authUserId) return [];
      const completed: string[] = [];
      
      // Check day1 survey
      const { data: day1 } = await supabase
        .from('day1_satisfaction_surveys')
        .select('id')
        .eq('user_id', user.authUserId)
        .eq('class_id', classId)
        .eq('is_completed', true)
        .limit(1);
      if (day1 && day1.length > 0) completed.push('day1_satisfaction');
      
      // Check day2 survey
      const { data: day2 } = await supabase
        .from('day2_satisfaction_surveys')
        .select('id')
        .eq('user_id', user.authUserId)
        .eq('class_id', classId)
        .eq('is_completed', true)
        .limit(1);
      if (day2 && day2.length > 0) completed.push('day2_satisfaction');
      
      return completed;
    },
    enabled: !!user?.authUserId && !!classId,
  });

  // Calculate which galleries are locked based on their requirements
  const galleryLockStatus = useMemo(() => {
    const status: Record<string, { locked: boolean; reason?: string; action?: () => void }> = {};
    
    galleries.forEach(gallery => {
      if (isAdmin || canManageGalleries) {
        // Admins always have access
        status[gallery.id] = { locked: false };
        return;
      }
      
      if (!gallery.unlock_requirement || gallery.unlock_requirement === 'none') {
        status[gallery.id] = { locked: isLocked }; // Use global lock if no specific requirement
        return;
      }
      
      if (gallery.unlock_requirement === 'exam') {
        const isCompleted = completedExams?.includes(gallery.required_exam_id || '');
        status[gallery.id] = {
          locked: !isCompleted,
          reason: `Complete a prova "${gallery.exam_title || 'vinculada'}" para desbloquear`,
          action: () => navigate(`/university/exams`)
        };
      } else if (gallery.unlock_requirement === 'survey') {
        const surveyType = gallery.required_survey_type || '';
        const isCompleted = completedSurveys?.includes(surveyType);
        
        // Determine which survey dialog to open based on required_survey_type
        let surveyAction: (() => void) | undefined;
        let surveyName = 'pesquisa de satisfação';
        
        if (surveyType === 'day1_satisfaction') {
          surveyAction = onOpenDay1Survey || onUnlockRequest;
          surveyName = 'Pesquisa de Satisfação do Dia 1';
        } else if (surveyType === 'day2_satisfaction') {
          surveyAction = onOpenDay2Survey || onUnlockRequest;
          surveyName = 'Pesquisa de Satisfação do Dia 2';
        } else {
          surveyAction = onUnlockRequest;
        }
        
        status[gallery.id] = {
          locked: !isCompleted,
          reason: `Complete a ${surveyName} para desbloquear`,
          action: surveyAction
        };
      }
    });
    
    return status;
  }, [galleries, completedExams, completedSurveys, isLocked, isAdmin, canManageGalleries, navigate, onUnlockRequest, onOpenDay1Survey, onOpenDay2Survey]);

  // Handle gallery click - check specific lock status
  const handleGalleryClick = (gallery: CourseGallery) => {
    const lockStatus = galleryLockStatus[gallery.id];
    
    if (lockStatus?.locked) {
      if (lockStatus.action) {
        toast.info(lockStatus.reason || 'Esta galeria está bloqueada');
        lockStatus.action();
      } else {
        onUnlockRequest?.();
      }
      return;
    }
    setSelectedGallery(gallery);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (galleries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Camera className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Nenhuma foto ainda</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          As fotos do curso serão exibidas aqui assim que forem publicadas pela equipe.
        </p>
        {canManageGalleries && (
          <Button onClick={() => navigate('/neoteam/galleries')}>
            <Upload className="h-4 w-4 mr-2" />
            Gerenciar Galerias
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Fotos do Curso</h3>
        <Badge variant="secondary">{galleries.length} galeria(s)</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleries.map((gallery) => {
          const lockStatus = galleryLockStatus[gallery.id];
          return (
            <GalleryCard
              key={gallery.id}
              gallery={gallery}
              onClick={() => handleGalleryClick(gallery)}
              isLocked={lockStatus?.locked || false}
              lockReason={lockStatus?.reason}
            />
          );
        })}
      </div>

      {selectedGallery && (
        <GalleryLightbox
          gallery={selectedGallery}
          onClose={() => setSelectedGallery(null)}
        />
      )}
    </div>
  );
}

interface GalleryCardProps {
  gallery: CourseGallery;
  onClick: () => void;
  isLocked?: boolean;
  lockReason?: string;
}

function GalleryCard({ gallery, onClick, isLocked = false, lockReason }: GalleryCardProps) {
  const requirementType = gallery.unlock_requirement;
  
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all overflow-hidden group relative"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {gallery.cover_photo_url ? (
          <img
            src={gallery.cover_photo_url}
            alt={gallery.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isLocked ? 'blur-sm' : ''}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 ${isLocked ? 'blur-sm' : ''}`}>
            <Images className="h-12 w-12 text-primary" />
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
            <div className="bg-background/90 rounded-full p-3 mb-2">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            {requirementType === 'exam' && (
              <div className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-600/80 rounded">
                <FileCheck className="h-3 w-3" />
                <span>Prova pendente</span>
              </div>
            )}
            {requirementType === 'survey' && (
              <div className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-600/80 rounded">
                <ClipboardList className="h-3 w-3" />
                <span>Pesquisa pendente</span>
              </div>
            )}
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Badge className="bg-black/60 text-white border-0">
            {gallery.photo_count} fotos
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <h4 className="font-medium text-sm truncate">{gallery.title}</h4>
        {gallery.description && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {gallery.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(gallery.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
}

interface GalleryLightboxProps {
  gallery: CourseGallery;
  onClose: () => void;
}

function GalleryLightbox({ gallery, onClose }: GalleryLightboxProps) {
  const { photos, isLoading } = useGalleryPhotos(gallery.id);
  const { setCoverPhoto, canWrite } = useGalleryManagement();
  const { isAdmin, canAccessModule } = useUnifiedAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  
  // Cover photo state
  const [coverCropperOpen, setCoverCropperOpen] = useState(false);
  const [selectedPhotoForCover, setSelectedPhotoForCover] = useState<string | null>(null);
  
  const canSetCover = isAdmin || canWrite || canAccessModule('neoteam_galleries', 'write');
  
  // Face search state
  const [selfieDialogOpen, setSelfieDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredPhotoIds, setFilteredPhotoIds] = useState<string[] | null>(null);

  const displayPhotos = filteredPhotoIds 
    ? photos.filter(p => filteredPhotoIds.includes(p.id))
    : photos;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : displayPhotos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < displayPhotos.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (viewMode === 'single') {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setViewMode('grid');
    }
  };

  const handleSelfieCapture = async (selfieBase64: string) => {
    setIsSearching(true);
    
    try {
      // Prepare photo URLs for analysis
      const photoUrls = photos.map(p => ({
        id: p.id,
        url: p.thumbnail_url || p.full_url
      }));

      toast.info(`Analisando ${photoUrls.length} fotos...`, {
        duration: 10000,
        id: 'face-search'
      });

      const { data, error } = await supabase.functions.invoke('face-search', {
        body: {
          selfieBase64,
          photoUrls
        }
      });

      if (error) {
        throw error;
      }

      if (data.matchingPhotoIds && data.matchingPhotoIds.length > 0) {
        setFilteredPhotoIds(data.matchingPhotoIds);
        toast.success(`Encontramos ${data.matchingPhotoIds.length} foto(s) com você!`, {
          id: 'face-search'
        });
      } else {
        toast.info('Não encontramos fotos suas nesta galeria', {
          id: 'face-search'
        });
      }
      
      setSelfieDialogOpen(false);
    } catch (error) {
      console.error('Face search error:', error);
      toast.error('Erro ao buscar fotos. Tente novamente.', {
        id: 'face-search'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilter = () => {
    setFilteredPhotoIds(null);
    setCurrentIndex(0);
  };

  const handleSetCoverPhoto = (photoUrl: string) => {
    setSelectedPhotoForCover(photoUrl);
    setCoverCropperOpen(true);
  };

  const handleCoverCropComplete = async (croppedBlob: Blob) => {
    try {
      await setCoverPhoto.mutateAsync({ galleryId: gallery.id, croppedBlob });
      setCoverCropperOpen(false);
      setSelectedPhotoForCover(null);
      toast.success('Foto de capa atualizada!');
    } catch (error) {
      console.error('Error setting cover photo:', error);
      toast.error('Erro ao definir foto de capa');
    }
  };

  return (
    <>
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent
          className="max-w-5xl max-h-[90vh] p-0 overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">{gallery.title}</DialogTitle>
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div>
              <h3 className="font-semibold">{gallery.title}</h3>
              <p className="text-sm text-muted-foreground">
                {filteredPhotoIds 
                  ? `${displayPhotos.length} de ${photos.length} fotos (filtrado)`
                  : `${gallery.photo_count} fotos`} • {gallery.class_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {viewMode === 'single' ? (
                <Button variant="outline" size="sm" onClick={() => setViewMode('grid')}>
                  <Images className="h-4 w-4 mr-2" />
                  Ver todas
                </Button>
              ) : filteredPhotoIds ? (
                <Button variant="outline" size="sm" onClick={clearFilter}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtro
                </Button>
              ) : null}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : displayPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <UserSearch className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma foto encontrada com o filtro aplicado</p>
                <Button variant="link" onClick={clearFilter}>
                  Ver todas as fotos
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
                {displayPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all relative group"
                    onClick={() => {
                      setCurrentIndex(index);
                      setViewMode('single');
                    }}
                  >
                    <img
                      src={photo.thumbnail_url || photo.full_url}
                      alt={photo.caption || `Foto ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    {/* Set as cover button for admins */}
                    {canSetCover && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCoverPhoto(photo.full_url);
                        }}
                      >
                        <ImageIcon className="h-3 w-3" />
                        Capa
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative flex items-center justify-center bg-black min-h-[60vh]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <img
                  src={displayPhotos[currentIndex]?.full_url}
                  alt={displayPhotos[currentIndex]?.caption || `Foto ${currentIndex + 1}`}
                  className="max-w-full max-h-[70vh] object-contain"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Navigation dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {displayPhotos.slice(0, 10).map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    />
                  ))}
                  {displayPhotos.length > 10 && (
                    <span className="text-white/60 text-xs ml-1">
                      +{displayPhotos.length - 10}
                    </span>
                  )}
                </div>

                {/* Close single view - X on the photo */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full h-10 w-10"
                  onClick={() => setViewMode('grid')}
                >
                  <X className="h-5 w-5" />
                </Button>

                {/* Counter */}
                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} / {displayPhotos.length}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SelfieCaptureDialog
        open={selfieDialogOpen}
        onClose={() => setSelfieDialogOpen(false)}
        onCapture={handleSelfieCapture}
        isProcessing={isSearching}
      />

      {/* Cover photo cropper */}
      {selectedPhotoForCover && (
        <CoverPhotoCropper
          open={coverCropperOpen}
          onClose={() => {
            setCoverCropperOpen(false);
            setSelectedPhotoForCover(null);
          }}
          imageSrc={selectedPhotoForCover}
          onCropComplete={handleCoverCropComplete}
          isProcessing={setCoverPhoto.isPending}
        />
      )}
    </>
  );
}
