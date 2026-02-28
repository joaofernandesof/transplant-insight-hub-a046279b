import { Briefcase } from "lucide-react";

export function NeoRHBanner() {
  return (
    <div className="sticky top-0 z-30 w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2.5 flex items-center gap-3 shadow-md">
      <div className="p-1.5 rounded-lg bg-white/15">
        <Briefcase className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-sm leading-tight tracking-wide">NeoRH</span>
        <span className="text-[10px] text-white/70 leading-tight">Gestão de Recursos Humanos</span>
      </div>
    </div>
  );
}
