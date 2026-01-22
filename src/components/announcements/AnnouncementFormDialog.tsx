import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useCreateAnnouncement, 
  useUpdateAnnouncement,
  Announcement 
} from "@/hooks/useAnnouncements";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone, Palette, Target, Calendar } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  image_url: z.string().optional(),
  link_url: z.string().optional(),
  link_text: z.string().optional(),
  background_color: z.string().default("#1e3a5f"),
  text_color: z.string().default("#ffffff"),
  accent_color: z.string().default("#06b6d4"),
  target_modules: z.array(z.string()).default(["all"]),
  is_active: z.boolean().default(true),
  priority: z.number().default(0),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AnnouncementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
}

const moduleOptions = [
  { value: "all", label: "Todos os módulos" },
  { value: "home", label: "Home" },
  { value: "dashboard", label: "Dashboard" },
  { value: "university", label: "Universidade" },
  { value: "materials", label: "Materiais" },
  { value: "marketing", label: "Marketing" },
  { value: "hotleads", label: "HotLeads" },
  { value: "career", label: "Carreira" },
  { value: "mentorship", label: "Mentoria" },
];

export default function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
}: AnnouncementFormDialogProps) {
  const { user } = useAuth();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      image_url: "",
      link_url: "",
      link_text: "Saiba mais",
      background_color: "#1e3a5f",
      text_color: "#ffffff",
      accent_color: "#06b6d4",
      target_modules: ["all"],
      is_active: true,
      priority: 0,
      starts_at: "",
      expires_at: "",
    },
  });

  useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title,
        description: announcement.description || "",
        image_url: announcement.image_url || "",
        link_url: announcement.link_url || "",
        link_text: announcement.link_text || "Saiba mais",
        background_color: announcement.background_color,
        text_color: announcement.text_color,
        accent_color: announcement.accent_color,
        target_modules: announcement.target_modules || ["all"],
        is_active: announcement.is_active,
        priority: announcement.priority,
        starts_at: announcement.starts_at?.split("T")[0] || "",
        expires_at: announcement.expires_at?.split("T")[0] || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        link_text: "Saiba mais",
        background_color: "#1e3a5f",
        text_color: "#ffffff",
        accent_color: "#06b6d4",
        target_modules: ["all"],
        is_active: true,
        priority: 0,
        starts_at: "",
        expires_at: "",
      });
    }
  }, [announcement, form]);

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      starts_at: data.starts_at || null,
      expires_at: data.expires_at || null,
      created_by: user?.id || null,
    };

    if (announcement) {
      updateAnnouncement.mutate(
        { id: announcement.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createAnnouncement.mutate(payload as any, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const watchedValues = form.watch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {announcement ? "Editar Anúncio" : "Novo Anúncio"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Preview */}
            <div
              className="rounded-xl p-4 transition-all"
              style={{
                backgroundColor: watchedValues.background_color || "#1e3a5f",
              }}
            >
              <h4
                className="font-bold text-lg"
                style={{ color: watchedValues.text_color || "#ffffff" }}
              >
                {watchedValues.title || "Título do anúncio"}
              </h4>
              {watchedValues.description && (
                <p
                  className="text-sm opacity-90"
                  style={{ color: watchedValues.text_color || "#ffffff" }}
                >
                  {watchedValues.description}
                </p>
              )}
              {watchedValues.link_url && (
                <Button
                  size="sm"
                  className="mt-2"
                  style={{
                    backgroundColor: watchedValues.accent_color || "#06b6d4",
                  }}
                >
                  {watchedValues.link_text || "Saiba mais"}
                </Button>
              )}
            </div>

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content" className="gap-1 text-xs">
                  <Megaphone className="h-3 w-3" />
                  Conteúdo
                </TabsTrigger>
                <TabsTrigger value="style" className="gap-1 text-xs">
                  <Palette className="h-3 w-3" />
                  Estilo
                </TabsTrigger>
                <TabsTrigger value="target" className="gap-1 text-xs">
                  <Target className="h-3 w-3" />
                  Destino
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  Agenda
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nova funcionalidade disponível!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Breve descrição do anúncio..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Imagem exibida ao lado do texto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="link_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="link_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto do Botão</FormLabel>
                        <FormControl>
                          <Input placeholder="Saiba mais" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="background_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor de Fundo</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                            <Input {...field} placeholder="#1e3a5f" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="text_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor do Texto</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                            <Input {...field} placeholder="#ffffff" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accent_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor de Destaque</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                            <Input {...field} placeholder="#06b6d4" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="target" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="target_modules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Módulos de destino</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-2">
                          {moduleOptions.map((option) => (
                            <label
                              key={option.value}
                              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                field.value?.includes(option.value)
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={field.value?.includes(option.value)}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                    ? [...(field.value || []), option.value]
                                    : field.value?.filter((v) => v !== option.value) || [];
                                  field.onChange(newValue.length ? newValue : ["all"]);
                                }}
                                className="sr-only"
                              />
                              <span className="text-sm">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maior número = aparece primeiro no carrossel
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="starts_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Deixe vazio para começar imediatamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expires_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de expiração</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Deixe vazio para nunca expirar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>
                          Anúncios inativos não são exibidos
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createAnnouncement.isPending || updateAnnouncement.isPending}
              >
                {announcement ? "Salvar" : "Criar Anúncio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
