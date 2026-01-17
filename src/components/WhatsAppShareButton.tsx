import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppShareButtonProps {
  title: string;
  description?: string;
  path: string;
  type: "material" | "video" | "course" | "notification";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function WhatsAppShareButton({
  title,
  description,
  path,
  type,
  variant = "outline",
  size = "sm",
  className
}: WhatsAppShareButtonProps) {
  const baseUrl = window.location.origin;
  const fullUrl = `${baseUrl}${path}`;
  
  const getEmoji = () => {
    switch (type) {
      case "material":
        return "📚";
      case "video":
        return "🎬";
      case "course":
        return "🎓";
      case "notification":
        return "📢";
      default:
        return "✨";
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "material":
        return "Novo Material";
      case "video":
        return "Novo Vídeo";
      case "course":
        return "Novo Curso";
      case "notification":
        return "Novidade";
      default:
        return "Novidade";
    }
  };

  const generateMessage = () => {
    const emoji = getEmoji();
    const typeLabel = getTypeLabel();
    
    let message = `${emoji} *${typeLabel} Disponível!*\n\n`;
    message += `📌 *${title}*\n`;
    
    if (description) {
      message += `\n${description}\n`;
    }
    
    message += `\n🔗 Acesse agora:\n${fullUrl}\n`;
    message += `\n_Portal ByNeofolic_`;
    
    return encodeURIComponent(message);
  };

  const handleShare = () => {
    const message = generateMessage();
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn(
        "gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 border-green-200 dark:border-green-800",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" />
      {size !== "icon" && <span>Compartilhar</span>}
    </Button>
  );
}