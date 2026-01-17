import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette,
  Image,
  Video,
  Download,
  Search,
  Instagram,
  Facebook,
  Megaphone,
  Sparkles,
  Play
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";

const templates = [
  { id: 1, title: 'Post - Antes e Depois', type: 'image', platform: 'Instagram', downloads: 234 },
  { id: 2, title: 'Story - Promoção', type: 'image', platform: 'Instagram', downloads: 189 },
  { id: 3, title: 'Carrossel - Técnica FUE', type: 'image', platform: 'Instagram', downloads: 156 },
  { id: 4, title: 'Post - Depoimento', type: 'image', platform: 'Facebook', downloads: 145 },
  { id: 5, title: 'Story - FAQ', type: 'image', platform: 'Instagram', downloads: 178 },
  { id: 6, title: 'Post - Dica de Cuidados', type: 'image', platform: 'Instagram', downloads: 167 },
];

const videos = [
  { id: 1, title: 'Institucional - Clínica', duration: '2:30', downloads: 89 },
  { id: 2, title: 'Tricotomia - Processo', duration: '1:45', downloads: 67 },
  { id: 3, title: 'Lavagem Pós-Transplante', duration: '3:00', downloads: 112 },
  { id: 4, title: 'Cirurgia - Time-lapse', duration: '1:00', downloads: 145 },
  { id: 5, title: 'Pós-Imediato - Orientações', duration: '4:15', downloads: 98 },
  { id: 6, title: 'Depoimento - Paciente', duration: '2:00', downloads: 134 },
];

const campaigns = [
  { id: 1, title: 'Campanha Black Friday', budget: 'R$ 2.000', roi: '320%', status: 'Validada' },
  { id: 2, title: 'Campanha Dia dos Pais', budget: 'R$ 1.500', roi: '280%', status: 'Validada' },
  { id: 3, title: 'Campanha Verão', budget: 'R$ 1.000', roi: '210%', status: 'Validada' },
  { id: 4, title: 'Campanha Remarketing', budget: 'R$ 500', roi: '450%', status: 'Validada' },
];

export default function Marketing() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-pink-600" />
            Central de Marketing
          </h1>
          <p className="text-sm text-muted-foreground">Templates, campanhas e banco de mídia</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <Image className="h-8 w-8 mx-auto text-pink-500 mb-2" />
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-xs text-muted-foreground">Templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Video className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{videos.length}</p>
              <p className="text-xs text-muted-foreground">Vídeos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Megaphone className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{campaigns.length}</p>
              <p className="text-xs text-muted-foreground">Campanhas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold">+500</p>
              <p className="text-xs text-muted-foreground">Downloads</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates" className="gap-2">
              <Image className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="brand" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Branding
            </TabsTrigger>
          </TabsList>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar templates..." className="pl-10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <Image className="h-12 w-12 text-pink-400" />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">{template.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {template.platform === 'Instagram' && <Instagram className="h-3 w-3 mr-1" />}
                        {template.platform === 'Facebook' && <Facebook className="h-3 w-3 mr-1" />}
                        {template.platform}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Videos */}
          <TabsContent value="videos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center relative">
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                      <Play className="h-6 w-6 text-purple-600 ml-1" />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{video.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{video.downloads} downloads</span>
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Campaigns */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{campaign.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Investimento: {campaign.budget}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">{campaign.status}</Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{campaign.roi}</p>
                        <p className="text-xs text-muted-foreground">ROI Médio</p>
                      </div>
                      <Button size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Ver Campanha
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Branding */}
          <TabsContent value="brand" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual de Marca ByNeofolic</CardTitle>
                <CardDescription>Diretrizes de uso da marca, cores, tipografia e aplicações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-[#1a365d] text-white text-center">
                    <p className="text-sm font-medium">Primária</p>
                    <p className="text-xs opacity-70">#1a365d</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#c9a962] text-white text-center">
                    <p className="text-sm font-medium">Dourado</p>
                    <p className="text-xs opacity-70">#c9a962</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#2d3748] text-white text-center">
                    <p className="text-sm font-medium">Secundária</p>
                    <p className="text-xs opacity-70">#2d3748</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#f7f7f7] text-gray-800 text-center border">
                    <p className="text-sm font-medium">Background</p>
                    <p className="text-xs opacity-70">#f7f7f7</p>
                  </div>
                </div>
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Baixar Manual Completo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
