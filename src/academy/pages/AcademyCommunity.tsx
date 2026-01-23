import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Users, Search, MapPin, Filter } from "lucide-react";
import { useAcademyCommunity, CommunityMember } from "../hooks/useAcademyCommunity";
import { MemberCard } from "../components/MemberCard";
import { MemberProfileDialog } from "../components/MemberProfileDialog";
import { CompleteProfileBanner } from "../components/CompleteProfileBanner";
import { ContactRequestsPanel } from "../components/ContactRequestsPanel";

export function AcademyCommunity() {
  const {
    members,
    pendingRequests,
    isLoading,
    respondToRequest,
    sendMessage,
    isSendingMessage,
    isProfileComplete,
  } = useAcademyCommunity();

  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [messageDialogMember, setMessageDialogMember] = useState<CommunityMember | null>(null);
  const [message, setMessage] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Get unique states for filter
  const uniqueStates = [...new Set(members.map(m => m.state).filter(Boolean))].sort();

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.clinicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState = stateFilter === "all" || member.state === stateFilter;

    return matchesSearch && matchesState;
  });

  // Stats
  const totalMembers = members.length;
  const statesCount = uniqueStates.length;

  const handleSendMessage = (recipientId: string, content: string) => {
    sendMessage({ recipientId, content });
  };

  const handleViewProfile = (member: CommunityMember) => {
    setSelectedMember(member);
  };

  const handleSendMessageFromProfile = (recipientId: string) => {
    const member = members.find(m => m.authUserId === recipientId);
    if (member) {
      setMessageDialogMember(member);
    }
  };

  const handleSubmitMessage = () => {
    if (!message.trim() || !messageDialogMember) return;
    sendMessage({ recipientId: messageDialogMember.authUserId, content: message });
    setMessage("");
    setMessageDialogMember(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pt-16 lg:pt-6 pb-6 overflow-x-hidden w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Comunidade IBRAMEC
            </h1>
            <p className="text-sm text-muted-foreground">
              Conecte-se com outros alunos e profissionais
            </p>
          </div>
        </div>

        {/* Complete Profile Banner */}
        <CompleteProfileBanner 
          isProfileComplete={isProfileComplete}
          onDismiss={() => setBannerDismissed(true)}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {isLoading ? "-" : totalMembers}
              </div>
              <p className="text-xs text-primary/80">Membros</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-secondary">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : statesCount}
              </div>
              <p className="text-xs text-muted-foreground">Estados</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        <ContactRequestsPanel
          requests={pendingRequests}
          onRespond={(requestId, accept) => respondToRequest({ requestId, accept })}
        />

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, clínica ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <SelectValue placeholder="Estado" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  {uniqueStates.map((state) => (
                    <SelectItem key={state} value={state!}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        {!isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>
              {filteredMembers.length} {filteredMembers.length === 1 ? "membro encontrado" : "membros encontrados"}
            </span>
            {stateFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {stateFilter}
              </Badge>
            )}
          </div>
        )}

        {/* Members Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onSendMessage={handleSendMessage}
                onViewProfile={handleViewProfile}
                isLoading={isSendingMessage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nenhum membro encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros de busca
            </p>
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Comunidade IBRAMEC</p>
                <p className="text-sm text-muted-foreground">
                  Conecte-se com colegas de turma e amplie sua rede profissional.
                  Configure a visibilidade do seu perfil nas configurações.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Member Profile Dialog */}
      <MemberProfileDialog
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onSendMessage={handleSendMessageFromProfile}
      />

      {/* Send Message Dialog */}
      <Dialog open={!!messageDialogMember} onOpenChange={() => setMessageDialogMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>
              Envie uma mensagem para {messageDialogMember?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogMember(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitMessage} 
              disabled={!message.trim()}
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}