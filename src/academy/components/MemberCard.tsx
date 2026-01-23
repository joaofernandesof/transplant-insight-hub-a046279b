import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, UserPlus, MessageCircle, Check, Clock, X } from "lucide-react";
import { CommunityMember } from "../hooks/useAcademyCommunity";

interface MemberCardProps {
  member: CommunityMember;
  onRequestContact: (targetUserId: string, message?: string) => void;
  onSendMessage: (recipientId: string, content: string) => void;
  isLoading?: boolean;
}

export function MemberCard({ member, onRequestContact, onSendMessage, isLoading }: MemberCardProps) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [message, setMessage] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleSendRequest = () => {
    onRequestContact(member.authUserId, requestMessage || undefined);
    setShowRequestDialog(false);
    setRequestMessage("");
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(member.authUserId, message);
    setShowMessageDialog(false);
    setMessage("");
  };

  const getContactStatusBadge = () => {
    switch (member.contactStatus) {
      case 'accepted':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0">
            <Check className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'pending_sent':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0">
            <Clock className="h-3 w-3 mr-1" />
            Solicitado
          </Badge>
        );
      case 'pending_received':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0">
            <Clock className="h-3 w-3 mr-1" />
            Responder
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0">
            <X className="h-3 w-3 mr-1" />
            Recusado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <CardContent className="p-3 flex flex-col h-full">
          {/* Header with avatar and info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-emerald-100 dark:ring-emerald-900">
              <AvatarImage src={member.avatarUrl || undefined} alt={member.fullName} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-medium">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-semibold text-sm truncate" title={member.fullName}>
                {member.fullName}
              </h3>
              {member.tier && (
                <Badge variant="outline" className="text-[10px] mt-0.5">
                  {member.tier}
                </Badge>
              )}
            </div>
          </div>

          {/* Location and status */}
          <div className="mt-2 space-y-1.5 flex-1">
            {(member.city || member.state) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {[member.city, member.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            
            {getContactStatusBadge() && (
              <div className="flex">
                {getContactStatusBadge()}
              </div>
            )}
          </div>

          {/* Action buttons - stacked vertically for better fit */}
          <div className="flex flex-col gap-1.5 mt-3">
            {member.contactStatus === 'none' && (
              <Button
                onClick={() => setShowRequestDialog(true)}
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-xs h-8"
                disabled={isLoading}
              >
                <UserPlus className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">Solicitar</span>
              </Button>
            )}

            <Button
              onClick={() => setShowMessageDialog(true)}
              size="sm"
              className="w-full gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Mensagem</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request Contact Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Contato</DialogTitle>
            <DialogDescription>
              Envie uma solicitação de contato para {member.fullName}. Se aceita, vocês poderão trocar informações de contato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Adicione uma mensagem (opcional)..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendRequest} className="bg-emerald-600 hover:bg-emerald-700">
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>
              Envie uma mensagem para {member.fullName}. Ela receberá como notificação.
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
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
