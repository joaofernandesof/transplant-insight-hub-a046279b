import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NOTES_DATA = [
  { patient_name: "ALEXANDRE BERNARDINO NETO", surgery_date: "2025-12-15", notes: "nao compareceu" },
  { patient_name: "ANDRE CABRAL MENDONÇA", surgery_date: "2026-08-17", notes: "Coloquei no feegow a cirurgia no dia 17 de agosto 2026" },
  { patient_name: "André Felipe Santos E Silva", surgery_date: "2026-02-14", notes: "desmarcar lavag e mandar video p/ fzr em casa" },
  { patient_name: "ANTONIO ADALBERTO CAVALCANTE MOREIRA FILHO", surgery_date: "2026-04-19", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "ANTONIO BEZERRA GONÇALVES PENHA", surgery_date: "2026-02-13", notes: "desmarcar lavag e mandar video p/ fzr em casa" },
  { patient_name: "ANTONIO CARLOS ESTEVES BARROS", surgery_date: "2026-01-31", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "Antonio Clebio Ferreira da Silva", surgery_date: "2026-02-24", notes: "FELLOW - DEIBSON" },
  { patient_name: "Antônio José Gomes", surgery_date: "2025-11-21", notes: "ASSINOU TERMO DE COMPROMISSO FINANCEIRO COM DATA PARA QUITAR 900 EM ATE 18 DE DEZEMBRO!!!" },
  { patient_name: "ANTONIO LUIZ CARLINI GONÇALVES", surgery_date: "2026-04-15", notes: "FELLOW - FABIO BRANARO" },
  { patient_name: "ANTONIO MARCOS MOTA DOS SANTOS", surgery_date: "2026-01-07", notes: "FELLOW - RÉGIA" },
  { patient_name: "AUGUSTO CÉSA MIRANDA VILELA", surgery_date: "2026-02-27", notes: "FELLOW - DEIBSON" },
  { patient_name: "Bruno Ribeiro Do Nascimento", surgery_date: "2026-02-11", notes: "VAI FAZER A TRICO ÁS 16:00" },
  { patient_name: "BRUNO RODRIGUES NONATO", surgery_date: "2026-03-02", notes: "FELLOW - RÉGIA" },
  { patient_name: "Carlos André Cordeiro Ferreira", surgery_date: "2026-02-14", notes: "desmarcar lavag e mandar video p/ fzr em casa" },
  { patient_name: "CARLOS IURY DE OLIVEIRA", surgery_date: "2026-02-27", notes: "FELLOW - DEIBSON" },
  { patient_name: "Carlos Raphael Magalhães da Silva", surgery_date: "2026-03-11", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "CÍCERO WÍLTON SANTANA FILGUEIRAS", surgery_date: "2025-11-03", notes: "termo de compromisso financeiro assinado. prazo ate quarta (lavagem) pra quitar" },
  { patient_name: "CLÁUDIA GOMES DE PAIVA", surgery_date: "2026-04-02", notes: "VIAGEM HYGOR - Ñ AGENDAR CATEGORIA A" },
  { patient_name: "DALLAN SILVA SAMPAIO", surgery_date: "2026-03-10", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "DARLAN JOSÉ DAS NEVES", surgery_date: "2026-03-12", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "DCHARDYSON DE MEDEIROS BELISIO", surgery_date: "2026-03-11", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "Diego Henrique Bastos Dos Santos", surgery_date: "2026-02-13", notes: "JA LIGUEI E MANDEI MSG E RAFAEÇA TBM- S RETORNO" },
  { patient_name: "DIEGO RODRIGUES LIMA", surgery_date: "2026-02-22", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "DOUGLAS NIXON XAVIER DE ARAUJO", surgery_date: "2026-04-10", notes: "PERMUTA" },
  { patient_name: "Eduardo De Castro Campos", surgery_date: "2026-03-31", notes: "VIAGEM HYGOR - Ñ AGENDAR CATEGORIA A" },
  { patient_name: "EDUARDO HENRIQUE DE BARROS SILVA", surgery_date: "2026-01-05", notes: "FELLOW - RÉGIA" },
  { patient_name: "ELLEN SILVA DE SANTANA(EXTERIOR)", surgery_date: "2026-02-25", notes: "FELLOW - DEIBSON" },
  { patient_name: "Emanuel Felipe Sales Pinheiro", surgery_date: "2026-02-12", notes: "tentando colocar para 6:00 da manhã" },
  { patient_name: "Ernando Silva de Sousa", surgery_date: "2026-02-14", notes: "desmarcar lavag e mandar video p/ fzr em casa" },
  { patient_name: "FABIANO OLIVEIRA DANTAS", surgery_date: "2025-09-22", notes: "veio sem o contrato apgar antes, se estressou com juros da mquininha e quis cancelar procedimento, tive que fazer sem juros" },
  { patient_name: "Fabio Da Costa Nogueira", surgery_date: "2026-03-13", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "FÁBIO DA SILVA DE PAULA", surgery_date: "2026-02-27", notes: "FELLOW - DEIBSON" },
  { patient_name: "FELIPE MELLONI", surgery_date: "2026-02-13", notes: "desmarcar lavag e mandar video p/ fzr em casa" },
  { patient_name: "FRANCISCO DE ASSIS RODRIGUES", surgery_date: null, notes: "FELLOW - RÉGIA" },
  { patient_name: "Francisco Ferreira da Silva Júnior", surgery_date: "2026-01-31", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "FRANCISCO IVANILDO BARROS ABREU", surgery_date: "2026-02-04", notes: "HIV E ECG" },
  { patient_name: "FRANCISCO JOSÉ SOUZA DE CASTRO", surgery_date: "2026-01-06", notes: "FELLOW - RÉGIA" },
  { patient_name: "FRANCISCO LOPES DE ALMEIDA", surgery_date: "2026-02-28", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "FRANCISCO LUCAS SEIXAS DE SOUSA", surgery_date: "2026-03-29", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "FRANCISCO LUCAS SEIXAS DE SOUSA", surgery_date: "2026-03-12", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "Francisco Rubens Ferreira da Silva", surgery_date: "2026-04-17", notes: "FELLOW - FABIO BRANARO" },
  { patient_name: "Francisco samuel alves de Oliveira", surgery_date: "2025-09-20", notes: "cismou que era 14500, manter assim" },
  { patient_name: "Francisco Wellington Rodrigues Nobre", surgery_date: "2026-02-26", notes: "FELLOW - DEIBSON" },
  { patient_name: "Gilderlan Andre Silva dos Santos", surgery_date: "2026-03-26", notes: "PERMUTA" },
  { patient_name: "Gregers Jensen", surgery_date: "2026-02-25", notes: "FELLOW - DEIBSON" },
  { patient_name: "Henrique Maciel Martins", surgery_date: "2026-02-03", notes: "falta ecg" },
  { patient_name: "HERICKSON BRITO MALINI", surgery_date: "2026-03-05", notes: "CAPILAR +BHT" },
  { patient_name: "Iranildo Ramos de araujo", surgery_date: "2026-01-31", notes: "trocando ele pras 6 da manhã, aguardando retorno" },
  { patient_name: "ITALO RICARDO GOMES VINHAS", surgery_date: "2026-02-05", notes: "MANDAR MSG PRO ACOMPANHANTE, ANTES DE LIGAR" },
  { patient_name: "JACKSON ALVES DE AQUINO", surgery_date: "2026-03-23", notes: "feriado?" },
  { patient_name: "Jefferson justo de araujo", surgery_date: "2026-05-02", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "Jefferson Pereira De Lima", surgery_date: "2026-04-16", notes: "FELLOW - FABIO BRANARO" },
  { patient_name: "JIMMY DOUGLAS DA SILVA IZIDIO", surgery_date: "2026-01-07", notes: "FELLOW - RÉGIA" },
  { patient_name: "JOÃO VIANEI DE ARAÚJO FELIPE", surgery_date: "2026-03-12", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "Joaquim de Sousa Bastos Junior", surgery_date: "2026-02-07", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "JOSÉ AILTON BARBOSA VIANA JÚNIOR", surgery_date: "2026-02-22", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "José Alaor De Albuquerque Neto", surgery_date: "2026-03-09", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "JOSÉ DA SILVA LEITE JÚNIOR", surgery_date: "2026-02-25", notes: "FELLOW - DEIBSON" },
  { patient_name: "JOSÉ DANIEL SUZANO RODRIGUES", surgery_date: "2026-02-07", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "José Marcelo Tavares", surgery_date: "2026-02-26", notes: "FELLOW - DEIBSON" },
  { patient_name: "JOSÉ WILSON GOMES JUNIOR", surgery_date: "2026-04-24", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "JOSIAS COSTA VIEIRA FILHO", surgery_date: "2026-02-26", notes: "FELLOW - DEIBSON" },
  { patient_name: "JÚLIO RODRIGUES GOMES NETO", surgery_date: "2026-03-11", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "Katiuscia de Lima Agostinho", surgery_date: "2026-03-13", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "Leonardo Bezerra Luciano (REMARCAR)", surgery_date: "2026-04-07", notes: "VIAGEM HYGOR - Ñ AGENDAR CATEGORIA A" },
  { patient_name: "LEONARDO CAVALCANTE MOREIRA", surgery_date: null, notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "LORRANE CRISTINE CABRAL DE ASSIS RIBEIRO", surgery_date: "2026-03-27", notes: "PERMUTA" },
  { patient_name: "Lucas Ribeiro dos santos", surgery_date: "2026-04-03", notes: "VIAGEM HYGOR - Ñ AGENDAR CATEGORIA A" },
  { patient_name: "Lucas Ribeiro Dos Santos", surgery_date: "2026-04-06", notes: "VIAGEM HYGOR - Ñ AGENDAR CATEGORIA A" },
  { patient_name: "Luciano Rodrigues Pereira", surgery_date: "2026-01-09", notes: "frontal 2cm + coroa prioridade" },
  { patient_name: "LUIZ AUGUSTO MEIRELES", surgery_date: "2026-02-21", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "Magno Ernando de Sousa Silva", surgery_date: "2026-02-11", notes: "12:00 / 12:30/ 13:00" },
  { patient_name: "Marcio Mota Lima", surgery_date: "2026-02-21", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "MARCIO SILVA DE SOUZA", surgery_date: "2026-02-22", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "MARCONDES DA SILVEIRA CASTRO", surgery_date: "2026-04-13", notes: "FELLOW - FABIO BRANARO" },
  { patient_name: "MARCONDES FERREIRA DE SOUZA", surgery_date: "2026-01-20", notes: "CIRURGIA CANCELADA >>> PACIENTE NAO TINHA NEM 50% DO VALOR" },
  { patient_name: "MARIO DAVID PAULA FREITAS", surgery_date: "2026-02-07", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "MATHEUS LOVATEL PENA", surgery_date: "2026-01-05", notes: "FELLOW - RÉGIA" },
  { patient_name: "MAXWENDELL DANTAS ANGELIM", surgery_date: "2026-02-27", notes: "FELLOW - DEIBSON" },
  { patient_name: "MIRELLE RODRIGUES", surgery_date: "2026-03-13", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "NAPOLEÃO OLIVEIRA RIBEIRO", surgery_date: "2026-01-07", notes: "FELLOW - RÉGIA" },
  { patient_name: "Narcelio Ernandes da silva", surgery_date: "2026-03-03", notes: "FELLOW - RÉGIA" },
  { patient_name: "NATHANIEL ALLEN GEYER", surgery_date: "2026-03-31", notes: "VIAGEM HYGOR - Ñ AGENDAR CATEGORIA A" },
  { patient_name: "Paulo Francisco Barbosa Sousa", surgery_date: "2026-01-06", notes: "FELLOW - RÉGIA" },
  { patient_name: "Paulo Roberto Lopes", surgery_date: "2026-04-01", notes: "VIAGEM HYGOR - Ñ AGENDAR CATEGORIA A" },
  { patient_name: "PEDRO PAULO MARTINS SILVA", surgery_date: "2026-02-01", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "Raquel Rodrigues da Silva", surgery_date: "2026-02-20", notes: "MANDOU POR LINK E SENHA" },
  { patient_name: "REGILÂNIO ALVES FERREIRA", surgery_date: "2026-03-24", notes: "feriado?" },
  { patient_name: "Renato Cypriano De Menezes", surgery_date: "2026-02-13", notes: "desmarcar lavag e mandar video p/ fzr em casa" },
  { patient_name: "Ricardo Lucio de Assis", surgery_date: "2026-05-02", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "RODRIGO DOS SANTOS SILVEIRA", surgery_date: "2026-01-05", notes: "FELLOW - RÉGIA" },
  { patient_name: "RODRIGO LEITÃO DA SILVA", surgery_date: "2026-02-01", notes: "ECG ENTREGOU A MÁRCIA" },
  { patient_name: "RONDON DE NORONHA SOUZA FILHO", surgery_date: "2026-02-23", notes: "FELLOW - DEIBSON" },
  { patient_name: "SAMUEL LIMA ALBUQUERQUE", surgery_date: "2026-04-17", notes: "FELLOW - FABIO BRANARO" },
  { patient_name: "Sidiney Araujo Gurgel", surgery_date: "2026-04-06", notes: "BLOQUEADO - NÃO PODE TER CATEGORIA A - HYGOR VIAJAR" },
  { patient_name: "TÁCITA CASTRO CHAVES", surgery_date: "2026-02-23", notes: "FELLOW - DEIBSON" },
  { patient_name: "Thiago Pereira Oliveira", surgery_date: "2026-03-11", notes: "REMARCAR" },
  { patient_name: "TIAGO NOBRE CORDEIRO", surgery_date: "2026-02-26", notes: "FELLOW - DEIBSON" },
  { patient_name: "ULRICH MARTIN (1600-1800 folículos, 600 da barba e 1000 da região atrás)", surgery_date: "2026-01-06", notes: "FELLOW - RÉGIA" },
  { patient_name: "Valdeci pigatti salvador", surgery_date: "2026-03-12", notes: "FELLOW - PAULO BATISTA" },
  { patient_name: "VICTOR MORONY SILVA DE NOJOZA", surgery_date: "2026-02-23", notes: "TODA SEGUNDA É 7:00 DA MANHÃ" },
  { patient_name: "VICTTOR BEZERRA SANTOS", surgery_date: "2026-02-28", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
  { patient_name: "WASHINGTON JOSÉ RODRIGUES DE SOUSA", surgery_date: null, notes: "FELLOW - RÉGIA" },
  { patient_name: "WESLEY ALAN MARTINS SILVA", surgery_date: "2026-03-02", notes: "FELLOW - RÉGIA" },
  { patient_name: "WINKLER GOMES DO NASCIMENTO", surgery_date: "2026-02-28", notes: "NÃO COLOCAR CIRURGIA PARA 15H" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of NOTES_DATA) {
      let query = supabase
        .from("clinic_surgeries")
        .update({ notes: item.notes })
        .eq("patient_name", item.patient_name);

      if (item.surgery_date) {
        query = query.eq("surgery_date", item.surgery_date);
      } else {
        query = query.is("surgery_date", null);
      }

      const { data, error, count } = await query.select("id");

      if (error) {
        errors.push(`${item.patient_name}: ${error.message}`);
      } else if (data && data.length > 0) {
        updated += data.length;
      } else {
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        skipped,
        total: NOTES_DATA.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
