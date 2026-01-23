import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Building2, MessageCircle, Instagram, Phone, Lock } from "lucide-react";
import { CommunityMember } from "../hooks/useAcademyCommunity";

interface MemberProfileDialogProps {
  member: CommunityMember | null;
  onClose: () => void;
  onSendMessage: (recipientId: string) => void;
}

export function MemberProfileDialog({ member, onClose, onSendMessage }: MemberProfileDialogProps) {
  if (!member) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatLocation = () => {
    if (member.city && member.state) {
      return `${member.city}/${member.state}`;
    }
    if (member.city) return member.city;
    if (member.state) return member.state;
    return null;
  };

  const location = formatLocation();

  // Check if profile is public and has extended info
  const hasPublicInfo = member.profilePublic;

  return (
    <Dialog open={!!member} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil de {member.fullName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-4">
          <Avatar className="h-24 w-24 ring-4 ring-primary/20 mb-4">
            <AvatarImage src={member.avatarUrl || undefined} alt={member.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
              {getInitials(member.fullName)}
            </AvatarFallback>
          </Avatar>

          <h2 className="text-xl font-bold">{member.fullName}</h2>
          
          {location && (
            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}

          {member.tier && (
            <Badge variant="secondary" className="mt-2">
              {member.tier}
            </Badge>
          )}
        </div>

        {/* Public Profile Info */}
        {hasPublicInfo ? (
          <div className="space-y-4 border-t pt-4">
            {member.bio && (
              <div className="text-sm text-muted-foreground text-center">
                {member.bio}
              </div>
            )}

            <div className="grid gap-3">
              {member.clinicName && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{member.clinicName}</span>
                </div>
              )}

              {member.instagramPersonal && (
                <div className="flex items-center gap-3 text-sm">
                  <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={`https://instagram.com/${member.instagramPersonal.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {member.instagramPersonal}
                  </a>
                </div>
              )}

              {member.whatsappPersonal && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{member.whatsappPersonal}</span>
                </div>
              )}

              {member.services && member.services.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Serviços</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.services.map((service, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t pt-4">
            <div className="flex flex-col items-center text-center py-4 text-muted-foreground">
              <Lock className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                Este membro optou por manter seu perfil privado.
              </p>
              <p className="text-xs mt-1">
                Apenas nome e localização são visíveis.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="border-t pt-4">
          <Button 
            onClick={() => {
              onSendMessage(member.authUserId);
              onClose();
            }}
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar Mensagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}