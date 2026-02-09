import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, 
  MousePointerClick, Image, ArrowLeft, ExternalLink, Upload, BarChart3, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  useAllBanners, 
  useCreateBanner, 
  useUpdateBanner, 
  useDeleteBanner,
  useUploadBannerImage,
  Banner,
  BannerInsert 
} from '@/hooks/useBanners';
import { BannerAnalyticsDashboard } from '@/components/admin/BannerAnalyticsDashboard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const defaultBgColors = [
  { label: 'Azul Corporativo', value: 'bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f]' },
  { label: 'Laranja Vibrante', value: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600' },
  { label: 'Roxo Premium', value: 'bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700' },
  { label: 'Rosa/Pink', value: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600' },
  { label: 'Verde Sucesso', value: 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600' },
  { label: 'Vermelho Alerta', value: 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600' },
  { label: 'Ciano Tech', value: 'bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600' },
  { label: 'Dourado Premium', value: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600' },
];

const emptyBanner: BannerInsert = {
  title: '',
  subtitle: '',
  highlight: '',
  bg_color: defaultBgColors[0].value,
  bg_image_url: '',
  text_position: 'left',
  route: '/',
  is_active: true,
  display_order: 0
};

export default function BannersAdmin() {
  const navigate = useNavigate();
  const { data: banners, isLoading } = useAllBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const uploadImage = useUploadBannerImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerInsert>(emptyBanner);
  const [activeTab, setActiveTab] = useState('banners');

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData({ ...emptyBanner, display_order: (banners?.length || 0) + 1 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      highlight: banner.highlight,
      bg_color: banner.bg_color,
      bg_image_url: banner.bg_image_url,
      text_position: banner.text_position,
      route: banner.route,
      is_active: banner.is_active,
      display_order: banner.display_order
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingBanner) {
      await updateBanner.mutateAsync({ id: editingBanner.id, ...formData });
    } else {
      await createBanner.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (bannerToDelete) {
      await deleteBanner.mutateAsync(bannerToDelete);
      setBannerToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    await updateBanner.mutateAsync({ id: banner.id, is_active: !banner.is_active });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      const publicUrl = await uploadImage.mutateAsync(file);
      setFormData({ ...formData, bg_image_url: publicUrl });
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const totalClicks = banners?.reduce((sum, b) => sum + (b.click_count || 0), 0) || 0;
  const activeBanners = banners?.filter(b => b.is_active).length || 0;

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Banners</h1>
              <p className="text-muted-foreground">Carrossel promocional da home</p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Banner
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="banners" className="gap-2">
              <Image className="h-4 w-4" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banners" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{banners?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Total de Banners</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Eye className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{activeBanners}</p>
                      <p className="text-xs text-muted-foreground">Banners Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <MousePointerClick className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalClicks}</p>
                      <p className="text-xs text-muted-foreground">Cliques Totais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <MousePointerClick className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {activeBanners > 0 ? (totalClicks / activeBanners).toFixed(1) : '0'}
                      </p>
                      <p className="text-xs text-muted-foreground">Média por Banner</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Banners List */}
            <Card>
              <CardHeader>
                <CardTitle>Banners do Carrossel</CardTitle>
                <CardDescription>
                  Arraste para reordenar. Banners inativos não aparecem no carrossel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : banners && banners.length > 0 ? (
                  <div className="space-y-3">
                    {banners.map((banner) => (
                      <div 
                        key={banner.id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all",
                          banner.is_active 
                            ? "bg-card hover:shadow-md" 
                            : "bg-muted/50 opacity-60"
                        )}
                      >
                        {/* Drag Handle */}
                        <div className="cursor-grab text-muted-foreground">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        {/* Preview */}
                        <div 
                          className={cn(
                            "w-32 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-medium overflow-hidden",
                            banner.bg_color
                          )}
                          style={banner.bg_image_url ? {
                            backgroundImage: `url(${banner.bg_image_url})`,
                            backgroundSize: 'cover'
                          } : undefined}
                        >
                          {!banner.bg_image_url && (banner.highlight || 'Preview')}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">
                              {banner.highlight || banner.title || 'Sem título'}
                            </h4>
                            {!banner.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {banner.subtitle} • {banner.title}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {banner.route}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3" />
                              {banner.click_count} cliques
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={banner.is_active}
                            onCheckedChange={() => handleToggleActive(banner)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(banner)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setBannerToDelete(banner.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum banner cadastrado</p>
                    <p className="text-sm">Clique em "Novo Banner" para começar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <BannerAnalyticsDashboard />
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Preview */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Preview</Label>
                <div 
                  className={cn(
                    "relative h-32 rounded-xl overflow-hidden text-white",
                    formData.bg_color
                  )}
                  style={formData.bg_image_url ? {
                    backgroundImage: `url(${formData.bg_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : undefined}
                >
                  {formData.bg_image_url && (
                    <div className="absolute inset-0 bg-black/30" />
                  )}
                  <div className={cn(
                    "relative h-full flex flex-col justify-center px-6",
                    formData.text_position === 'center' && "items-center text-center",
                    formData.text_position === 'right' && "items-end text-right"
                  )}>
                    {formData.subtitle && (
                      <p className="text-sm opacity-90">{formData.subtitle}</p>
                    )}
                    {formData.highlight && (
                      <h2 className="text-2xl font-bold">{formData.highlight}</h2>
                    )}
                    {formData.title && (
                      <p className="text-sm opacity-90">{formData.title}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highlight">Destaque (título principal)</Label>
                    <Input
                      id="highlight"
                      value={formData.highlight || ''}
                      onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                      placeholder="Ex: Academia ByNeofolic"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtítulo (acima do destaque)</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Ex: Conheça a"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Descrição (abaixo do destaque)</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Aprenda a escalar sua clínica"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="route">Rota/Link de destino</Label>
                    <Input
                      id="route"
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      placeholder="/university"
                    />
                  </div>
                  <div>
                    <Label htmlFor="text_position">Posição do texto</Label>
                    <Select
                      value={formData.text_position || 'left'}
                      onValueChange={(value) => setFormData({ ...formData, text_position: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bg_color">Cor de fundo (gradiente)</Label>
                  <Select
                    value={formData.bg_color || defaultBgColors[0].value}
                    onValueChange={(value) => setFormData({ ...formData, bg_color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultBgColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-6 h-4 rounded", color.value)} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-3">
                  <Label>Imagem de fundo (opcional)</Label>
                  <div className="flex gap-3">
                    <Input
                      value={formData.bg_image_url || ''}
                      onChange={(e) => setFormData({ ...formData, bg_image_url: e.target.value })}
                      placeholder="URL da imagem ou faça upload"
                      className="flex-1"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadImage.isPending}
                      className="gap-2"
                    >
                      {uploadImage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos suportados: JPG, PNG, WebP. Tamanho máximo: 5MB.
                    {formData.bg_image_url && ' A imagem substitui o gradiente de fundo.'}
                  </p>
                  {formData.bg_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, bg_image_url: '' })}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover imagem
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="display_order">Ordem de exibição</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order || 0}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id="is_active"
                      checked={formData.is_active ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Banner ativo</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createBanner.isPending || updateBanner.isPending}
              >
                {editingBanner ? 'Salvar Alterações' : 'Criar Banner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Banner?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O banner será removido permanentemente do carrossel.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
