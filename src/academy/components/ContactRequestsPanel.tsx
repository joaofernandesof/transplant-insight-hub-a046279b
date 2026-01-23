import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContactRequest } from "../hooks/useAcademyCommunity";

interface ContactRequestsPanelProps {
  requests: ContactRequest[];
  onRespond: (requestId: string, accept: boolean) => void;
}

export function ContactRequestsPanel({ requests, onRespond }: ContactRequestsPanelProps) {
  if (requests.length === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-amber-600" />
          Solicitações de Contato
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0 ml-2">
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-background border"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.requesterAvatar || undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {getInitials(request.requesterName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{request.requesterName}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {request.message && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  "{request.message}"
                </p>
              )}

              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => onRespond(request.id, true)}
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" />
                  Aceitar
                </Button>
                <Button
                  onClick={() => onRespond(request.id, false)}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Recusar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
