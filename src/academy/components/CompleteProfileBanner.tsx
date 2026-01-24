import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, UserCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompleteProfileBannerProps {
  isProfileComplete: boolean;
  onDismiss: () => void;
}

export function CompleteProfileBanner({ isProfileComplete, onDismiss }: CompleteProfileBannerProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissedUntil = localStorage.getItem("profile-banner-dismissed-until");
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      if (dismissedDate > new Date()) {
        setDismissed(true);
      } else {
        localStorage.removeItem("profile-banner-dismissed-until");
      }
    }
  }, []);

  const handleDismiss = () => {
    // Dismiss for 7 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    localStorage.setItem("profile-banner-dismissed-until", dismissUntil.toISOString());
    setDismissed(true);
    onDismiss();
  };

  const handleGoToProfile = () => {
    navigate("/academy/profile");
  };

  // Don't show if profile is complete or banner was dismissed
  if (isProfileComplete || dismissed) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Complete seu Perfil</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione suas informações para se conectar melhor com outros alunos da comunidade IBRAMEC.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleGoToProfile}
                className="gap-1.5"
              >
                Completar Agora
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
              >
                Lembrar Depois
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}