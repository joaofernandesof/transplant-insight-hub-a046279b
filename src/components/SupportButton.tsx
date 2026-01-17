import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageCircle, Phone, Headphones } from "lucide-react";

interface SupportButtonProps {
  whatsappNumber?: string;
  kommoUrl?: string;
}

export function SupportButton({ 
  whatsappNumber = "5511999999999", 
  kommoUrl = "https://byneofolic.kommo.com/chat" 
}: SupportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Preciso de suporte.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleKommo = () => {
    window.open(kommoUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            size="lg" 
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
          >
            <Headphones className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-white dark:bg-slate-900 border shadow-lg z-50"
          sideOffset={8}
        >
          <DropdownMenuItem 
            onClick={handleKommo}
            className="cursor-pointer py-3"
          >
            <MessageCircle className="h-5 w-5 mr-3 text-blue-600" />
            <div>
              <p className="font-medium">Chat Kommo</p>
              <p className="text-xs text-muted-foreground">Atendimento online</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleWhatsApp}
            className="cursor-pointer py-3"
          >
            <Phone className="h-5 w-5 mr-3 text-green-600" />
            <div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Suporte via mensagem</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
