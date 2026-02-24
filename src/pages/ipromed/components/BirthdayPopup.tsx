/**
 * CPG - Popup de Aniversariantes do Dia
 * Exibe ao acessar o portal CPG quando há clientes aniversariantes
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cake, PartyPopper, Gift, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function BirthdayPopup() {
  const [open, setOpen] = useState(false);
  const today = format(new Date(), "MM-dd");

  const { data: birthdayClients = [] } = useQuery({
    queryKey: ["cpg-birthday-clients", today],
    queryFn: async () => {
      // Fetch all clients with birth_date set
      const { data, error } = await supabase
        .from("ipromed_legal_clients")
        .select("id, name, email, phone, birth_date, medical_specialty")
        .not("birth_date", "is", null);

      if (error) {
        console.error("Error fetching birthday clients:", error);
        return [];
      }

      // Filter clients whose birth_date matches today's month-day
      const todayMonth = new Date().getMonth();
      const todayDay = new Date().getDate();

      return (data || []).filter((client) => {
        if (!client.birth_date) return false;
        const bd = new Date(client.birth_date + "T12:00:00");
        return bd.getMonth() === todayMonth && bd.getDate() === todayDay;
      });
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });

  // Show popup if there are birthday clients and user hasn't dismissed today
  useEffect(() => {
    if (birthdayClients.length > 0) {
      const dismissedKey = `cpg-birthday-dismissed-${today}`;
      const dismissed = sessionStorage.getItem(dismissedKey);
      if (!dismissed) {
        setOpen(true);
      }
    }
  }, [birthdayClients, today]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem(`cpg-birthday-dismissed-${today}`, "true");
  };

  const calcAge = (birthDate: string) => {
    const bd = new Date(birthDate + "T12:00:00");
    const now = new Date();
    let age = now.getFullYear() - bd.getFullYear();
    const m = now.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
    return age;
  };

  if (birthdayClients.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <PartyPopper className="h-6 w-6 text-amber-500" />
            Aniversariante{birthdayClients.length > 1 ? "s" : ""} do Dia! 🎉
          </DialogTitle>
          <DialogDescription>
            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2">
          {birthdayClients.map((client) => (
            <div
              key={client.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30"
            >
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Cake className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{client.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {client.birth_date && (
                    <span className="flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      {calcAge(client.birth_date)} anos
                    </span>
                  )}
                  {client.medical_specialty && (
                    <span>• {client.medical_specialty}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Não esqueça de parabenizar {birthdayClients.length > 1 ? "seus clientes" : "seu cliente"}! 🎂
        </p>

        <div className="flex justify-center mt-2">
          <Button onClick={handleClose} variant="outline" size="sm">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
