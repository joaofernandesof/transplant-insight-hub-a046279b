import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface SupportButtonProps {
  whatsappNumber?: string;
}

export function SupportButton({ 
  whatsappNumber = "5511999999999"
}: SupportButtonProps) {

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Preciso de suporte.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        size="lg" 
        className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all bg-green-600 hover:bg-green-700"
        onClick={handleWhatsApp}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
