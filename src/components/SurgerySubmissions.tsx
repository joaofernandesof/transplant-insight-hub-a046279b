import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Scissors, Camera, Upload, X, CheckCircle, Clock, 
  XCircle, Gift, Play, Image as ImageIcon, Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SurgerySubmission {
  id: string;
  user_id: string;
  description: string | null;
  photo_urls: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

export default function SurgerySubmissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['surgery-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('surgery_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SurgerySubmission[];
    },
    enabled: !!user?.id
  });

  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const goalReached = approvedCount >= 5;
  const progressPercent = Math.min((approvedCount / 5) * 100, 100);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || selectedFiles.length === 0) return;
      
      setIsUploading(true);
      const photoUrls: string[] = [];

      // Upload photos
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('surgery-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('surgery-photos')
          .getPublicUrl(fileName);
        
        photoUrls.push(publicUrl);
      }

      // Create submission
      const { error } = await supabase
        .from('surgery_submissions')
        .insert({
          user_id: user.id,
          description: description.trim() || null,
          photo_urls: photoUrls
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-submissions'] });
      toast.success("Cirurgia enviada para validação!");
      setIsDialogOpen(false);
      setDescription("");
      setSelectedFiles([]);
    },
    onError: (error) => {
      console.error("Error submitting surgery:", error);
      toast.error("Erro ao enviar cirurgia");
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast.error("Máximo de 5 fotos por cirurgia");
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  return (
    <Card className="border-2 border-rose-200/50 dark:border-rose-800/30 bg-gradient-to-br from-rose-50/50 via-background to-background dark:from-rose-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
              <Scissors className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Cirurgias Realizadas
                <Badge variant="secondary" className="text-xs">
                  {approvedCount}/5
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {pendingCount > 0 && `${pendingCount} aguardando validação`}
              </p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Enviar Cirurgia para Validação
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
                  <Textarea
                    placeholder="Descreva brevemente a cirurgia realizada..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Fotos da Cirurgia <span className="text-muted-foreground">(até 5)</span>
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {selectedFiles.length < 5 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                      >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="w-full"
                >
                  {isUploading ? "Enviando..." : "Enviar para Validação"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress to reward */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso para recompensa</span>
            <span className="font-medium">{approvedCount}/5 cirurgias</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
        
        {/* Reward Card */}
        <div className={`p-4 rounded-lg border-2 ${
          goalReached 
            ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-300 dark:border-amber-700' 
            : 'bg-muted/30 border-muted-foreground/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${goalReached ? 'bg-amber-200 dark:bg-amber-800' : 'bg-muted'}`}>
              {goalReached ? (
                <Gift className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              ) : (
                <Play className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${goalReached ? 'text-amber-800 dark:text-amber-200' : 'text-muted-foreground'}`}>
                {goalReached ? '🎉 Recompensa Desbloqueada!' : 'Recompensa'}
              </p>
              <p className="text-xs text-muted-foreground">
                Episódio da WebSérie "Do Zero à Referência Capilar" - IBRAMEC
              </p>
            </div>
            {goalReached && (
              <Button size="sm" className="gap-1 bg-amber-600 hover:bg-amber-700">
                <Play className="h-4 w-4" />
                Assistir
              </Button>
            )}
          </div>
        </div>
        
        {/* Recent submissions */}
        {submissions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Últimas enviadas</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {submissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {submission.photo_urls[0] ? (
                      <img src={submission.photo_urls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-full h-full p-2 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {submission.description || "Cirurgia enviada"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(submission.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}