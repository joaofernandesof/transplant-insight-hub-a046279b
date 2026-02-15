import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ExportUsersCSV() {
  const [status, setStatus] = useState("Gerando CSV...");

  useEffect(() => {
    async function exportCSV() {
      const { data, error } = await supabase
        .from("neohub_user_profiles")
        .select("profile, neohub_user_id, neohub_users!inner(full_name, email)")
        .eq("is_active", true)
        .order("profile");

      if (error || !data) {
        setStatus("Erro: " + (error?.message || "sem dados"));
        return;
      }

      const rows = data.map((r: any) => ({
        nome: r.neohub_users?.full_name || "",
        email: r.neohub_users?.email || "",
        perfil: r.profile,
      }));

      const csv = "\uFEFF" + "Nome;Email;Perfil\n" + rows.map(r => `${r.nome};${r.email};${r.perfil}`).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "usuarios_neohub.csv";
      link.click();
      setStatus(`✅ CSV gerado com ${rows.length} registros. O download deve iniciar automaticamente.`);
    }
    exportCSV();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-lg">{status}</p>
    </div>
  );
}
