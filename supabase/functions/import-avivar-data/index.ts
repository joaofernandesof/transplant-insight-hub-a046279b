import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Dados dos clientes AVIVAR
const avivarClients = [
  { name: "Antônio Adailson de Sousa Silva", email: "adailson@avivar.neofolic.com" },
  { name: "Medequip", email: "medequip@avivar.neofolic.com" },
  { name: "Gleyldes Gonçalves Guimarães Leão", email: "gleyldes@avivar.neofolic.com" },
  { name: "Jean Carlos Romão de Sousa", email: "jean@avivar.neofolic.com" },
  { name: "Eder Eiji Yanagitani", email: "eder@avivar.neofolic.com" },
  { name: "Maxwell e Silva Pereira", email: "maxwell@avivar.neofolic.com" },
  { name: "Instituto Keyla Klava", email: "keyla@avivar.neofolic.com" },
  { name: "Elenilton Pinheiro Rocha", email: "elenilton@avivar.neofolic.com" },
  { name: "Erika Alves Coimbra", email: "erika@avivar.neofolic.com" },
  { name: "Clayson Pujol Santos", email: "clayson@avivar.neofolic.com" },
  { name: "Leonardo Lincoln de Melo Chaga", email: "leonardo@avivar.neofolic.com" },
  { name: "Cirurgia Center", email: "cirurgiacenter@avivar.neofolic.com" },
  { name: "Vivart Jeri", email: "vivart@avivar.neofolic.com" },
];

// Dados semanais extraídos da planilha (agregados por semana)
// Semanas: S48 (Nov 24-30), S49 (Dec 1-7), S50 (Dec 8-14), S51 (Dec 15-21), S1 (Jan 5-11), S2 (Jan 12-18), S3 (Jan 19-25)
const weeklyData: Record<string, Record<number, Record<string, number>>> = {
  "adailson@avivar.neofolic.com": {
    48: { leads_novos: 0, tempo_uso_atendente: 730, atividades_atendente: 375, atividades_robo: 3494, mensagens_enviadas_atendente: 725, mensagens_enviadas_robo: 4897, mensagens_recebidas: 2117, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    49: { leads_novos: 0, tempo_uso_atendente: 457, atividades_atendente: 999, atividades_robo: 12291, mensagens_enviadas_atendente: 523, mensagens_enviadas_robo: 10414, mensagens_recebidas: 1963, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    50: { leads_novos: 0, tempo_uso_atendente: 718, atividades_atendente: 842, atividades_robo: 4782, mensagens_enviadas_atendente: 692, mensagens_enviadas_robo: 7666, mensagens_recebidas: 2283, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    51: { leads_novos: 150, tempo_uso_atendente: 637, atividades_atendente: 1140, atividades_robo: 3845, mensagens_enviadas_atendente: 716, mensagens_enviadas_robo: 5133, mensagens_recebidas: 1621, tarefas_realizadas: 0, tarefas_atrasadas: 2, agendamentos: 12, vendas_realizadas: 474, leads_descartados: 11 },
    1: { leads_novos: 192, tempo_uso_atendente: 491, atividades_atendente: 356, atividades_robo: 2110, mensagens_enviadas_atendente: 743, mensagens_enviadas_robo: 4728, mensagens_recebidas: 2203, tarefas_realizadas: 9, tarefas_atrasadas: 2, agendamentos: 18, vendas_realizadas: 15, leads_descartados: 37 },
    2: { leads_novos: 103, tempo_uso_atendente: 238, atividades_atendente: 589, atividades_robo: 2521, mensagens_enviadas_atendente: 92, mensagens_enviadas_robo: 1410, mensagens_recebidas: 1008, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 9, vendas_realizadas: 0, leads_descartados: 13 },
    3: { leads_novos: 16, tempo_uso_atendente: 45, atividades_atendente: 54, atividades_robo: 630, mensagens_enviadas_atendente: 27, mensagens_enviadas_robo: 84, mensagens_recebidas: 153, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 2, vendas_realizadas: 0, leads_descartados: 0 },
  },
  "elenilton@avivar.neofolic.com": {
    48: { leads_novos: 8, tempo_uso_atendente: 592, atividades_atendente: 33, atividades_robo: 920, mensagens_enviadas_atendente: 1, mensagens_enviadas_robo: 396, mensagens_recebidas: 415, tarefas_realizadas: 2, tarefas_atrasadas: 17, agendamentos: 1, vendas_realizadas: 0, leads_descartados: 0 },
    49: { leads_novos: 18, tempo_uso_atendente: 172, atividades_atendente: 31, atividades_robo: 1079, mensagens_enviadas_atendente: 3, mensagens_enviadas_robo: 466, mensagens_recebidas: 437, tarefas_realizadas: 1, tarefas_atrasadas: 18, agendamentos: 4, vendas_realizadas: 0, leads_descartados: 0 },
    50: { leads_novos: 14, tempo_uso_atendente: 0, atividades_atendente: 2, atividades_robo: 428, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 240, mensagens_recebidas: 163, tarefas_realizadas: 0, tarefas_atrasadas: 18, agendamentos: 1, vendas_realizadas: 0, leads_descartados: 0 },
    51: { leads_novos: 19, tempo_uso_atendente: 107, atividades_atendente: 7, atividades_robo: 968, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 439, mensagens_recebidas: 338, tarefas_realizadas: 0, tarefas_atrasadas: 18, agendamentos: 1, vendas_realizadas: 0, leads_descartados: 0 },
    1: { leads_novos: 28, tempo_uso_atendente: 690, atividades_atendente: 81, atividades_robo: 1942, mensagens_enviadas_atendente: 5, mensagens_enviadas_robo: 711, mensagens_recebidas: 700, tarefas_realizadas: 0, tarefas_atrasadas: 19, agendamentos: 5, vendas_realizadas: 0, leads_descartados: 0 },
    2: { leads_novos: 40, tempo_uso_atendente: 607, atividades_atendente: 147, atividades_robo: 1973, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 788, mensagens_recebidas: 729, tarefas_realizadas: 0, tarefas_atrasadas: 19, agendamentos: 4, vendas_realizadas: 0, leads_descartados: 0 },
    3: { leads_novos: 9, tempo_uso_atendente: 11, atividades_atendente: 18, atividades_robo: 403, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 163, mensagens_recebidas: 162, tarefas_realizadas: 0, tarefas_atrasadas: 19, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
  },
  "maxwell@avivar.neofolic.com": {
    48: { leads_novos: 24, tempo_uso_atendente: 66, atividades_atendente: 6, atividades_robo: 806, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 470, mensagens_recebidas: 153, tarefas_realizadas: 18, tarefas_atrasadas: 4, agendamentos: 4, vendas_realizadas: 0, leads_descartados: 1 },
    49: { leads_novos: 37, tempo_uso_atendente: 222, atividades_atendente: 35, atividades_robo: 1951, mensagens_enviadas_atendente: 6, mensagens_enviadas_robo: 1479, mensagens_recebidas: 409, tarefas_realizadas: 1, tarefas_atrasadas: 0, agendamentos: 10, vendas_realizadas: 0, leads_descartados: 4 },
    50: { leads_novos: 30, tempo_uso_atendente: 136, atividades_atendente: 31, atividades_robo: 695, mensagens_enviadas_atendente: 4, mensagens_enviadas_robo: 378, mensagens_recebidas: 138, tarefas_realizadas: 8, tarefas_atrasadas: 1, agendamentos: 2, vendas_realizadas: 1, leads_descartados: 3 },
    51: { leads_novos: 1, tempo_uso_atendente: 41, atividades_atendente: 29, atividades_robo: 68, mensagens_enviadas_atendente: 5, mensagens_enviadas_robo: 42, mensagens_recebidas: 18, tarefas_realizadas: 0, tarefas_atrasadas: 4, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    1: { leads_novos: 27, tempo_uso_atendente: 124, atividades_atendente: 41, atividades_robo: 743, mensagens_enviadas_atendente: 11, mensagens_enviadas_robo: 634, mensagens_recebidas: 252, tarefas_realizadas: 0, tarefas_atrasadas: 7, agendamentos: 2, vendas_realizadas: 1, leads_descartados: 7 },
    2: { leads_novos: 20, tempo_uso_atendente: 77, atividades_atendente: 26, atividades_robo: 771, mensagens_enviadas_atendente: 9, mensagens_enviadas_robo: 390, mensagens_recebidas: 245, tarefas_realizadas: 0, tarefas_atrasadas: 12, agendamentos: 5, vendas_realizadas: 0, leads_descartados: 2 },
    3: { leads_novos: 5, tempo_uso_atendente: 6, atividades_atendente: 3, atividades_robo: 76, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 33, mensagens_recebidas: 11, tarefas_realizadas: 0, tarefas_atrasadas: 12, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
  },
  "erika@avivar.neofolic.com": {
    48: { leads_novos: 20, tempo_uso_atendente: 299, atividades_atendente: 273, atividades_robo: 1254, mensagens_enviadas_atendente: 200, mensagens_enviadas_robo: 546, mensagens_recebidas: 460, tarefas_realizadas: 27, tarefas_atrasadas: 4, agendamentos: 9, vendas_realizadas: 0, leads_descartados: 0 },
    49: { leads_novos: 28, tempo_uso_atendente: 444, atividades_atendente: 415, atividades_robo: 2316, mensagens_enviadas_atendente: 308, mensagens_enviadas_robo: 1005, mensagens_recebidas: 896, tarefas_realizadas: 0, tarefas_atrasadas: 13, agendamentos: 11, vendas_realizadas: 1, leads_descartados: 1 },
    50: { leads_novos: 38, tempo_uso_atendente: 468, atividades_atendente: 547, atividades_robo: 2248, mensagens_enviadas_atendente: 614, mensagens_enviadas_robo: 868, mensagens_recebidas: 752, tarefas_realizadas: 0, tarefas_atrasadas: 22, agendamentos: 15, vendas_realizadas: 1, leads_descartados: 23 },
    51: { leads_novos: 20, tempo_uso_atendente: 142, atividades_atendente: 151, atividades_robo: 1041, mensagens_enviadas_atendente: 58, mensagens_enviadas_robo: 550, mensagens_recebidas: 331, tarefas_realizadas: 5, tarefas_atrasadas: 5, agendamentos: 8, vendas_realizadas: 1, leads_descartados: 0 },
    1: { leads_novos: 28, tempo_uso_atendente: 197, atividades_atendente: 116, atividades_robo: 1226, mensagens_enviadas_atendente: 90, mensagens_enviadas_robo: 852, mensagens_recebidas: 609, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 6, vendas_realizadas: 0, leads_descartados: 0 },
    2: { leads_novos: 28, tempo_uso_atendente: 168, atividades_atendente: 187, atividades_robo: 1928, mensagens_enviadas_atendente: 154, mensagens_enviadas_robo: 645, mensagens_recebidas: 579, tarefas_realizadas: 0, tarefas_atrasadas: 9, agendamentos: 12, vendas_realizadas: 1, leads_descartados: 0 },
    3: { leads_novos: 3, tempo_uso_atendente: 30, atividades_atendente: 16, atividades_robo: 231, mensagens_enviadas_atendente: 13, mensagens_enviadas_robo: 113, mensagens_recebidas: 73, tarefas_realizadas: 0, tarefas_atrasadas: 4, agendamentos: 2, vendas_realizadas: 0, leads_descartados: 0 },
  },
  "gleyldes@avivar.neofolic.com": {
    48: { leads_novos: 19, tempo_uso_atendente: 1377, atividades_atendente: 259, atividades_robo: 1069, mensagens_enviadas_atendente: 77, mensagens_enviadas_robo: 588, mensagens_recebidas: 279, tarefas_realizadas: 12, tarefas_atrasadas: 0, agendamentos: 8, vendas_realizadas: 2, leads_descartados: 2 },
    49: { leads_novos: 24, tempo_uso_atendente: 1346, atividades_atendente: 255, atividades_robo: 1372, mensagens_enviadas_atendente: 104, mensagens_enviadas_robo: 736, mensagens_recebidas: 431, tarefas_realizadas: 0, tarefas_atrasadas: 1, agendamentos: 4, vendas_realizadas: 4, leads_descartados: 0 },
    50: { leads_novos: 32, tempo_uso_atendente: 1130, atividades_atendente: 206, atividades_robo: 1385, mensagens_enviadas_atendente: 70, mensagens_enviadas_robo: 739, mensagens_recebidas: 373, tarefas_realizadas: 0, tarefas_atrasadas: 1, agendamentos: 6, vendas_realizadas: 1, leads_descartados: 0 },
    51: { leads_novos: 6, tempo_uso_atendente: 1124, atividades_atendente: 115, atividades_robo: 352, mensagens_enviadas_atendente: 44, mensagens_enviadas_robo: 175, mensagens_recebidas: 173, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 2, vendas_realizadas: 0, leads_descartados: 0 },
    1: { leads_novos: 15, tempo_uso_atendente: 1451, atividades_atendente: 243, atividades_robo: 1037, mensagens_enviadas_atendente: 141, mensagens_enviadas_robo: 470, mensagens_recebidas: 389, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 5, vendas_realizadas: 2, leads_descartados: 0 },
    2: { leads_novos: 19, tempo_uso_atendente: 1529, atividades_atendente: 337, atividades_robo: 1355, mensagens_enviadas_atendente: 170, mensagens_enviadas_robo: 581, mensagens_recebidas: 811, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 6, vendas_realizadas: 0, leads_descartados: 3 },
    3: { leads_novos: 9, tempo_uso_atendente: 283, atividades_atendente: 83, atividades_robo: 284, mensagens_enviadas_atendente: 36, mensagens_enviadas_robo: 119, mensagens_recebidas: 89, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
  },
  "medequip@avivar.neofolic.com": {
    48: { leads_novos: 34, tempo_uso_atendente: 207, atividades_atendente: 228, atividades_robo: 792, mensagens_enviadas_atendente: 54, mensagens_enviadas_robo: 274, mensagens_recebidas: 288, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    49: { leads_novos: 38, tempo_uso_atendente: 465, atividades_atendente: 458, atividades_robo: 996, mensagens_enviadas_atendente: 130, mensagens_enviadas_robo: 334, mensagens_recebidas: 407, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 5, leads_descartados: 1 },
    50: { leads_novos: 68, tempo_uso_atendente: 566, atividades_atendente: 727, atividades_robo: 1807, mensagens_enviadas_atendente: 296, mensagens_enviadas_robo: 575, mensagens_recebidas: 765, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 7, leads_descartados: 0 },
    51: { leads_novos: 33, tempo_uso_atendente: 517, atividades_atendente: 359, atividades_robo: 839, mensagens_enviadas_atendente: 167, mensagens_enviadas_robo: 213, mensagens_recebidas: 364, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 1, leads_descartados: 0 },
    1: { leads_novos: 69, tempo_uso_atendente: 910, atividades_atendente: 888, atividades_robo: 2140, mensagens_enviadas_atendente: 276, mensagens_enviadas_robo: 808, mensagens_recebidas: 947, tarefas_realizadas: 1, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 9, leads_descartados: 0 },
    2: { leads_novos: 38, tempo_uso_atendente: 795, atividades_atendente: 445, atividades_robo: 2151, mensagens_enviadas_atendente: 168, mensagens_enviadas_robo: 920, mensagens_recebidas: 865, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    3: { leads_novos: 0, tempo_uso_atendente: 0, atividades_atendente: 0, atividades_robo: 0, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 0, mensagens_recebidas: 0, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
  },
  "eder@avivar.neofolic.com": {
    48: { leads_novos: 0, tempo_uso_atendente: 0, atividades_atendente: 0, atividades_robo: 0, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 0, mensagens_recebidas: 0, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    49: { leads_novos: 0, tempo_uso_atendente: 0, atividades_atendente: 0, atividades_robo: 0, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 0, mensagens_recebidas: 0, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    50: { leads_novos: 1, tempo_uso_atendente: 41, atividades_atendente: 4, atividades_robo: 6, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 183, mensagens_recebidas: 135, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    51: { leads_novos: 5, tempo_uso_atendente: 67, atividades_atendente: 27, atividades_robo: 186, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 98, mensagens_recebidas: 56, tarefas_realizadas: 6, tarefas_atrasadas: 0, agendamentos: 4, vendas_realizadas: 1, leads_descartados: 0 },
    1: { leads_novos: 25, tempo_uso_atendente: 169, atividades_atendente: 39, atividades_robo: 635, mensagens_enviadas_atendente: 3, mensagens_enviadas_robo: 427, mensagens_recebidas: 195, tarefas_realizadas: 4, tarefas_atrasadas: 5, agendamentos: 3, vendas_realizadas: 1, leads_descartados: 1 },
    2: { leads_novos: 13, tempo_uso_atendente: 87, atividades_atendente: 16, atividades_robo: 340, mensagens_enviadas_atendente: 12, mensagens_enviadas_robo: 165, mensagens_recebidas: 96, tarefas_realizadas: 10, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    3: { leads_novos: 3, tempo_uso_atendente: 47, atividades_atendente: 37, atividades_robo: 199, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 102, mensagens_recebidas: 23, tarefas_realizadas: 7, tarefas_atrasadas: 0, agendamentos: 2, vendas_realizadas: 1, leads_descartados: 1 },
  },
  "jean@avivar.neofolic.com": {
    48: { leads_novos: 0, tempo_uso_atendente: 0, atividades_atendente: 0, atividades_robo: 0, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 0, mensagens_recebidas: 0, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    49: { leads_novos: 0, tempo_uso_atendente: 0, atividades_atendente: 0, atividades_robo: 0, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 0, mensagens_recebidas: 0, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    50: { leads_novos: 0, tempo_uso_atendente: 0, atividades_atendente: 0, atividades_robo: 0, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 0, mensagens_recebidas: 0, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    51: { leads_novos: 0, tempo_uso_atendente: 0, atividades_atendente: 0, atividades_robo: 0, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 0, mensagens_recebidas: 0, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    1: { leads_novos: 0, tempo_uso_atendente: 87, atividades_atendente: 0, atividades_robo: 55, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 93, mensagens_recebidas: 119, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    2: { leads_novos: 5, tempo_uso_atendente: 53, atividades_atendente: 0, atividades_robo: 34, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 57, mensagens_recebidas: 102, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
    3: { leads_novos: 0, tempo_uso_atendente: 5, atividades_atendente: 0, atividades_robo: 4, mensagens_enviadas_atendente: 0, mensagens_enviadas_robo: 6, mensagens_recebidas: 6, tarefas_realizadas: 0, tarefas_atrasadas: 0, agendamentos: 0, vendas_realizadas: 0, leads_descartados: 0 },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const results: { client: string; status: string; details?: string }[] = [];

    for (const client of avivarClients) {
      try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: client.email,
          password: "Avivar2026!",
          email_confirm: true,
          user_metadata: { name: client.name }
        });

        if (authError && !authError.message.includes("already been registered")) {
          results.push({ client: client.name, status: "error", details: `Auth error: ${authError.message}` });
          continue;
        }

        let userId = authData?.user?.id;

        // If user already exists, get their ID
        if (!userId) {
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === client.email);
          userId = existingUser?.id;
        }

        if (!userId) {
          results.push({ client: client.name, status: "error", details: "Could not get user ID" });
          continue;
        }

        // 2. Create clinic
        const { data: clinicData, error: clinicError } = await supabaseAdmin
          .from("clinics")
          .upsert({
            user_id: userId,
            name: client.name,
            city: "Avivar",
            state: "BR"
          }, { onConflict: "user_id" })
          .select()
          .single();

        if (clinicError) {
          results.push({ client: client.name, status: "error", details: `Clinic error: ${clinicError.message}` });
          continue;
        }

        // 3. Insert weekly metrics
        const clientData = weeklyData[client.email];
        if (clientData) {
          for (const [weekNum, values] of Object.entries(clientData)) {
            await supabaseAdmin
              .from("weekly_metrics")
              .upsert({
                clinic_id: clinicData.id,
                week_number: parseInt(weekNum),
                year: weekNum === "48" || weekNum === "49" || weekNum === "50" || weekNum === "51" ? 2025 : 2026,
                values
              }, { onConflict: "clinic_id,week_number,year" });
          }
        }

        results.push({ client: client.name, status: "success", details: `Created with ${Object.keys(clientData || {}).length} weeks of data` });

      } catch (err) {
        results.push({ client: client.name, status: "error", details: String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});