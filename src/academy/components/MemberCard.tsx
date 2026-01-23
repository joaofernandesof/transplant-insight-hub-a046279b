import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { MapPin, MessageCircle, User } from "lucide-react";
import { CommunityMember } from "../hooks/useAcademyCommunity";

interface MemberCardProps {
  member: CommunityMember;
  onSendMessage: (recipientId: string, content: string) => void;
  onViewProfile: (member: CommunityMember) => void;
  isLoading?: boolean;
}

export function MemberCard({ member, onSendMessage, onViewProfile, isLoading }: MemberCardProps) {
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [message, setMessage] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(member.authUserId, message);
    setShowMessageDialog(false);
    setMessage("");
  };

  // Format location as "City/State" (e.g., "Fortaleza/CE")
  const formatLocation = () => {
    if (member.city && member.state) {
      return `${member.city}/${member.state}`;
    }
    if (member.city) return member.city;
    if (member.state) return member.state;
    return null;
  };

  const location = formatLocation();

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <CardContent className="p-3 flex flex-col h-full">
          {/* Header with avatar and info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={member.avatarUrl || undefined} alt={member.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-semibold text-sm truncate" title={member.fullName}>
                {member.fullName}
              </h3>
              {location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => onViewProfile(member)}
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-xs h-8"
              disabled={isLoading}
            >
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Perfil</span>
            </Button>

            <Button
              onClick={() => setShowMessageDialog(true)}
              size="sm"
              className="flex-1 gap-1.5 text-xs h-8"
              disabled={isLoading}
            >
              <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Mensagem</span>
            </Button>
          </div>
        </CardContent>
      </Card>

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
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}