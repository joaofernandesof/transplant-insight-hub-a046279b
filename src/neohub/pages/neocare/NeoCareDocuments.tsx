import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Loader2,
  FolderOpen,
  Search,
  ArrowUpDown,
  FileSignature,
  Filter
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  description: string | null;
  created_at: string | null;
}

const categoryConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  contrato: { label: 'Contrato', color: 'bg-amber-600', icon: <FileSignature className="h-4 w-4" /> },
  exame: { label: 'Exame', color: 'bg-blue-500', icon: <FileSpreadsheet className="h-4 w-4" /> },
  laudo: { label: 'Laudo', color: 'bg-green-500', icon: <FileText className="h-4 w-4" /> },
  receita: { label: 'Receita', color: 'bg-purple-500', icon: <FileText className="h-4 w-4" /> },
  atestado: { label: 'Atestado', color: 'bg-orange-500', icon: <FileText className="h-4 w-4" /> },
  foto: { label: 'Foto', color: 'bg-pink-500', icon: <ImageIcon className="h-4 w-4" /> },
  outro: { label: 'Outro', color: 'bg-gray-500', icon: <File className="h-4 w-4" /> },
};

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'category';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Mais recentes' },
  { value: 'date-asc', label: 'Mais antigos' },
  { value: 'name-asc', label: 'Nome (A-Z)' },
  { value: 'name-desc', label: 'Nome (Z-A)' },
  { value: 'category', label: 'Por categoria' },
];

function getFileIcon(fileType: string | null, category: string | null) {
  if (category === 'contrato') {
    return <FileSignature className="h-5 w-5 text-amber-600" />;
  }
  if (!fileType) return <File className="h-5 w-5 text-muted-foreground" />;
  
  if (fileType.includes('image')) {
    return <ImageIcon className="h-5 w-5 text-pink-500" />;
  }
  if (fileType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function NeoCareDocuments() {
  const { user } = useUnifiedAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  async function fetchDocuments() {
    if (!user?.userId) return;
    const authUserId = user.userId;
    
    setIsLoading(true);
    try {
      const { data: patientData } = await supabase
        .from('portal_patients')
        .select('id')
        .eq('portal_user_id', (
          await supabase
            .from('portal_users')
            .select('id')
            .eq('user_id', authUserId)
            .single()
        ).data?.id)
        .single();

      if (!patientData) {
        const { data: neohubUser } = await supabase
          .from('neohub_users')
          .select('id')
          .eq('user_id', authUserId)
          .single();

        if (neohubUser) {
          const { data: attachments, error } = await supabase
            .from('portal_attachments')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && attachments) {
            setDocuments(attachments);
          }
        }
        setIsLoading(false);
        return;
      }

      const { data: attachments, error } = await supabase
        .from('portal_attachments')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(attachments || []);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload(doc: Document) {
    try {
      if (doc.file_url.includes('patient-documents')) {
        const { data, error } = await supabase.storage
          .from('patient-documents')
          .download(doc.file_url.split('patient-documents/')[1] || doc.file_url);
        
        if (error) throw error;
        
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        window.open(doc.file_url, '_blank');
      }
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar arquivo');
    }
  }

  const processedDocuments = useMemo(() => {
    let result = [...documents];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(doc => 
        doc.file_name.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(doc => doc.category === filterCategory);
    }

    // Sort
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
      case 'name-asc':
        result.sort((a, b) => a.file_name.localeCompare(b.file_name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.file_name.localeCompare(a.file_name));
        break;
      case 'category':
        result.sort((a, b) => (a.category || 'outro').localeCompare(b.category || 'outro'));
        break;
    }

    return result;
  }, [documents, searchQuery, sortBy, filterCategory]);

  // Group documents by date for timeline
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Document[]> = {};
    
    processedDocuments.forEach(doc => {
      const dateKey = doc.created_at 
        ? format(new Date(doc.created_at), 'yyyy-MM-dd')
        : 'sem-data';
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(doc);
    });

    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'sem-data') return 1;
      if (b[0] === 'sem-data') return -1;
      return sortBy === 'date-asc' 
        ? a[0].localeCompare(b[0]) 
        : b[0].localeCompare(a[0]);
    });
  }, [processedDocuments, sortBy]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--neocare-primary))]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <NeoTeamBreadcrumb />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Meus Documentos</h1>
        <p className="text-muted-foreground">Exames, laudos, contratos e documentos médicos</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter by Category */}
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  {config.icon}
                  {config.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-44">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Timeline */}
      {processedDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `Nenhum resultado para "${searchQuery}".`
                : 'Seus documentos médicos aparecerão aqui quando disponíveis.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 lg:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(var(--neocare-primary))] via-[hsl(var(--neocare-primary)/0.5)] to-muted" />

          <div className="space-y-6">
            {groupedByDate.map(([dateKey, docs]) => (
              <div key={dateKey} className="relative">
                {/* Date marker */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 lg:w-12 lg:h-12 bg-[hsl(var(--neocare-primary))] rounded-full shadow-lg">
                    <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">
                    {dateKey === 'sem-data' 
                      ? 'Sem data' 
                      : format(new Date(dateKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </h3>
                </div>

                {/* Documents for this date */}
                <div className="ml-12 lg:ml-16 space-y-3">
                  {docs.map((doc) => {
                    const category = categoryConfig[doc.category || 'outro'] || categoryConfig.outro;
                    
                    return (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: category.color.replace('bg-', '').includes('amber') ? '#d97706' : category.color.replace('bg-', '').includes('blue') ? '#3b82f6' : category.color.replace('bg-', '').includes('green') ? '#22c55e' : category.color.replace('bg-', '').includes('purple') ? '#a855f7' : category.color.replace('bg-', '').includes('orange') ? '#f97316' : category.color.replace('bg-', '').includes('pink') ? '#ec4899' : '#6b7280' }}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className="shrink-0 p-2 bg-muted rounded-lg">
                              {getFileIcon(doc.file_type, doc.category)}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium truncate" title={doc.file_name}>
                                  {doc.file_name}
                                </h4>
                                <Badge variant="secondary" className={`${category.color} text-white text-xs`}>
                                  {category.label}
                                </Badge>
                              </div>
                              
                              {doc.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                  {doc.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {doc.file_size && (
                                  <span>{formatFileSize(doc.file_size)}</span>
                                )}
                                {doc.created_at && (
                                  <span>
                                    {format(new Date(doc.created_at), "HH:mm", { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2 shrink-0">
                              {(doc.file_type?.includes('image') || doc.file_type?.includes('pdf')) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setPreviewDoc(doc)}
                                  title="Visualizar"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDownload(doc)}
                                title="Baixar"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {documents.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          {processedDocuments.length} de {documents.length} documentos
          {searchQuery && ` para "${searchQuery}"`}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.file_name}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {previewDoc?.file_type?.includes('image') ? (
              <img 
                src={previewDoc.file_url} 
                alt={previewDoc.file_name}
                className="w-full rounded-lg"
              />
            ) : previewDoc?.file_type?.includes('pdf') ? (
              <iframe 
                src={previewDoc.file_url}
                className="w-full h-[70vh] rounded-lg"
                title={previewDoc.file_name}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Visualização não disponível para este tipo de arquivo.
              </p>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={() => previewDoc && handleDownload(previewDoc)}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
