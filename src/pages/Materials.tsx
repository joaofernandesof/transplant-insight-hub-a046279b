import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  Download,
  Search,
  FolderOpen,
  File,
  FileSpreadsheet,
  Stethoscope,
  DollarSign,
  ClipboardList,
  Shield,
  Trash2,
  Image,
  Video,
  Loader2
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";
import { useMaterials } from "@/hooks/useMaterials";
import { useAuth } from "@/contexts/AuthContext";
import { UploadMaterialDialog } from "@/components/UploadMaterialDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { id: 'all', name: 'Todos', icon: FolderOpen },
  { id: 'pops', name: 'POPs & Protocolos', icon: Stethoscope },
  { id: 'scripts', name: 'Scripts de Venda', icon: DollarSign },
  { id: 'contratos', name: 'Contratos & Termos', icon: Shield },
  { id: 'guias', name: 'Guias de Orientação', icon: BookOpen },
  { id: 'checklists', name: 'Checklists', icon: ClipboardList },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
    case 'doc': return <File className="h-5 w-5 text-blue-500" />;
    case 'xlsx': return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case 'image': return <Image className="h-5 w-5 text-purple-500" />;
    case 'video': return <Video className="h-5 w-5 text-orange-500" />;
    default: return <File className="h-5 w-5" />;
  }
};

export default function Materials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { materials, isLoading, downloadMaterial, deleteMaterial, formatFileSize, getFileTypeFromName } = useMaterials();
  const { isAdmin } = useAuth();

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (categoryId: string) => 
    categoryId === 'all' ? materials.length : materials.filter(m => m.category === categoryId).length;

  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Central de Materiais
            </h1>
            <p className="text-sm text-muted-foreground">POPs, protocolos, scripts, contratos e guias</p>
          </div>
          {isAdmin && <UploadMaterialDialog />}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar materiais..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Categories Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                    }
                  `}
                >
                  <cat.icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{cat.name}</span>
                  <span className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                    ${isActive 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : 'bg-background text-muted-foreground'
                    }
                  `}>
                    {getCategoryCount(cat.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Materials Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => {
              const fileType = getFileTypeFromName(material.file_name);
              return (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {getFileIcon(fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{material.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {material.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(material.file_size)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2"
                              onClick={() => downloadMaterial(material)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir material?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. O arquivo "{material.title}" será permanentemente excluído.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMaterial(material.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredMaterials.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum material encontrado</p>
            {isAdmin && materials.length === 0 && (
              <p className="text-sm mt-2">Clique em "Enviar Material" para adicionar o primeiro arquivo.</p>
            )}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
