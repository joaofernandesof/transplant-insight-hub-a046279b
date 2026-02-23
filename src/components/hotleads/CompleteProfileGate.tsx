import { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, UserCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BRAZILIAN_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

interface CompleteProfileGateProps {
  children: React.ReactNode;
}

export function CompleteProfileGate({ children }: CompleteProfileGateProps) {
  const { user, isAdmin, refreshUser } = useUnifiedAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!user) return;

    // Admins bypass
    if (isAdmin) {
      setIsComplete(true);
      setIsChecking(false);
      return;
    }

    // Check completeness
    const name = user.fullName?.trim();
    const userEmail = user.email?.trim();
    const userState = user.addressState?.trim();
    const userCity = user.addressCity?.trim();
    const userPhone = user.phone?.trim();

    const complete = !!(name && userEmail && userState && userCity && userPhone);
    setIsComplete(complete);

    // Pre-fill form
    setFullName(name || "");
    setEmail(userEmail || "");
    setPhone(userPhone || "");
    setState(userState || "");
    setCity(userCity || "");

    setIsChecking(false);
  }, [user, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim() || !state || !city.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("neohub_users")
        .update({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address_state: state,
          address_city: city.trim(),
        })
        .eq("user_id", user?.authUserId);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      await refreshUser();
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isComplete) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-background min-h-[calc(100dvh-52px)] lg:min-h-dvh p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-xl shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Complete seu Perfil</h2>
            <p className="text-sm text-muted-foreground">
              Para acessar o <strong>HotLeads</strong>, precisamos confirmar suas informações. 
              Isso garante que você receba leads da sua região.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gate-name">Nome Completo *</Label>
              <Input
                id="gate-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gate-email">E-mail *</Label>
              <Input
                id="gate-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gate-phone">Telefone / WhatsApp *</Label>
              <Input
                id="gate-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="gate-state">Estado *</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id="gate-state">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gate-city">Cidade *</Label>
                <Input
                  id="gate-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Sua cidade"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar e Continuar
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Seus dados são utilizados apenas para direcionar leads da sua região.
          </p>
        </div>
      </div>
    </div>
  );
}
