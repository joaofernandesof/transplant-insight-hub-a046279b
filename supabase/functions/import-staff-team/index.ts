import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Team data from spreadsheet
const teamData = [
  { city: "FORTALEZA", contract: "CLT", name: "Maria Nayara Alves Sampaio", role: "PROCEDIMENTOS", email: "nayara.sampaio@neofolic.com.br", phone: "88 981584904", birth: "2001-12-30" },
  { city: "FORTALEZA", contract: "CLT", name: "Renato de Oliveira", role: "PROCEDIMENTOS", email: "renato.oliveira@neofolic.com.br", phone: "85 99791-7278", birth: "1989-10-09" },
  { city: "FORTALEZA", contract: "CLT", name: "Betsaida Henrique de Queiroz", role: "RECEPCIONISTA", email: "betsaida.queiroz@neofolic.com.br", phone: "85 98808-1933", birth: "1998-07-28" },
  { city: "FORTALEZA", contract: "CLT", name: "Antônia Valéria da Silva Menezes", role: "TRIAGEM", email: "valeria.silva@neofolic.com.br", phone: "85 9174-8659", birth: "2000-07-06" },
  { city: "FORTALEZA", contract: "CLT", name: "André Lochander", role: "PROCEDIMENTOS", email: "andre.lochande@neofolic.com.br", phone: "85 994131429", birth: "1995-07-26" },
  { city: "FORTALEZA", contract: "CLT", name: "Marina de Fátima Gomes Saraiva Leão", role: "RECEPCIONISTA", email: "marina.saraiva@neofolic.com.br", phone: "85 8690-8778", birth: "2001-03-13" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Camila Carvalho Barroso", role: "ANALISTA DE DADOS", email: "camila.barroso@neofolic.com.br", phone: "88 99919-5671", birth: "1998-12-22" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Julia Ferreira Coelho", role: "AUXILIAR FINANCEIRO", email: "julia.coelho@neofolic.com.br", phone: "85 98647-2590", birth: "1998-07-05" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Edith Silvestre Gomes", role: "DIRETORA DO MARKETING", email: "edith.gomes@neofolic.com.br", phone: "85 9918-4388", birth: "1991-05-01" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Lucas Barbosa Madeira Barros", role: "FINANCEIRO", email: "lucas.barbosa@neofolic.com.br", phone: "85 9992-4488", birth: "1994-01-04" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Jocelma Rolim Andrade", role: "LÍDER DE EQUIPE (CC)", email: "jocelma.andrade@neofolic.com.br", phone: "85 98511-1306", birth: "1981-02-23" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Luanda Keiza de Castro Lourenço", role: "RELACIONAMENTO COM O CLIENTE", email: "luanda.lourenco@neofolic.com.br", phone: "85 999591095", birth: "1989-02-08" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Claudenice Barbosa de Castro Linhares", role: "RESPONSÁVEL TÉCNICA", email: "claudenice.castro@neofolic.com.br", phone: "85 99708-5081", birth: "1989-12-04" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Brenna Paiva Pereira de Miranda", role: "SDR", email: "brenna.miranda@neofolic.com.br", phone: "(85)9736-1480", birth: "1993-04-06" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Cibele Maria Moreira Moura", role: "SDR IBRAMEC", email: "cibele.moura@neofolic.com.br", phone: "88 9778-1498", birth: "2001-09-14" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Francisco Alexandre Ferreira Almeida", role: "SOCIAL MEDIA", email: "alexandre.almeida@neofolic.com.br", phone: "85 9617-9953", birth: "1997-01-31" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Wellington do Carmo Lima", role: "SUPERVISOR OPERACIONAL", email: "wellington.lima@neofolic.com.br", phone: "88 99400-3609", birth: "1999-07-08" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Márcia Kelly Marques de Lima", role: "SUPERVISORA COMERCIAL", email: "marcia.kelly@neofolic.com.br", phone: "85 9791-8481", birth: "1989-06-04" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Rafaela Torres de Souza", role: "SUPERVISORA DE SUCESO DO PACIENTE", email: "rafaela.torres@neofolic.com.br", phone: "92 9 9115-5309", birth: "2003-07-04" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Bruna Alinne Miranda Correa", role: "SUPERVISORA OPERACIONAL", email: "bruna.correa@neofolic.com.br", phone: "91 98495-6382", birth: "1996-05-11" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Allan Vyctor Lima Bezerra", role: "VÍDEO MAKER", email: "allan.vytor@neofolic.com.br", phone: "85 9196-0429", birth: "2000-07-24" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Vitória Evelly Nogueira dos Santos", role: "SDR SÃO PAULO / JUAZEIRO", email: "vitoria.santos@neofolic.com.br", phone: "85 9404-8933", birth: "2003-09-06" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Valentina Belén Jara Véliz", role: "CLOSER IBRAMEC", email: "valentina.veliz@neofolic.com.br", phone: "85 9659-4488", birth: "1991-08-31" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Ana Noelia Magalhães Monteiro", role: "SDR - FORTALEZA", email: "ana.monteiro@neofolic.com.br", phone: "85 9812-9233", birth: "1994-04-01" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Pamella Romão Teixeira Lima", role: "GESTORA DE GROWTH E MARKETING DO IBRAMEC", email: "pamela.romao@neofolic.com.br", phone: "11 95811-6284", birth: "1997-10-03" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Larissa Guerreiro Freire Fernandes", role: "DIRETORA JURÍDICA", email: "larissa.guerreiro@neofolic.com.br", phone: "85 9793-0788", birth: "1995-08-22" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Nicholas Vinicius de Jesus Barreto", role: "ESPECIALISTA DE AUTOMAÇÕES E CRM", email: "nicholas.barreto@neofolic.com.br", phone: "12 99659-3947", birth: "1997-06-26" },
  { city: "FORTALEZA", contract: "SÓCIO", name: "João Fernandes de Oliveira Filho", role: "CEO", email: "adm@neofolic.com.br", phone: "85 99939-5239", birth: "1994-04-26" },
  { city: "FORTALEZA", contract: "SÓCIO", name: "Jessika Brunna Araújo Sampaio", role: "GERENTE GERAL", email: "jessika.sampaio@neofolic.com.br", phone: "85 99963-0396", birth: "1991-12-12" },
  { city: "FORTALEZA", contract: "SÓCIO", name: "Lucas Araújo Tavares", role: "GESTOR DE IA", email: "lucas.araujo@neofolic.com.br", phone: "85 99157-7299", birth: "1991-08-13" },
  { city: "FORTALEZA", contract: "SÓCIO", name: "Hygor Guerreiro Couto", role: "SÓCIO PROPRIETÁRIO", email: "hygor.guerreiro@neofolic.com.br", phone: "85 999998228", birth: "1992-12-24" },
  { city: "JUAZEIRO", contract: "CNPJ", name: "Samyra da Silva Alves", role: "TRIAGEM", email: "samyra.alves@neofolic.com.br", phone: "88 9484-9938", birth: "2003-05-15" },
  { city: "JUAZEIRO", contract: "SÓCIO", name: "Patrick da Silva Penaforte", role: "SÓCIO PROPRIETÁRIO", email: "patrick.penaforte@neofolic.com.br", phone: "85 99844-0155", birth: "1999-11-09" },
  { city: "FORTALEZA", contract: "CNPJ", name: "Cesar Lincoln Almeida Brito", role: "SOCIAL MEDIA", email: "cesar.lincoln@ibramec.com", phone: "85 9922-9029", birth: "2000-03-30" },
];

// Default password for all new users
const DEFAULT_PASSWORD = "NeoTeam2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results: { email: string; status: string; error?: string }[] = [];

    for (const staff of teamData) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
          .from("neohub_users")
          .select("id, email")
          .eq("email", staff.email)
          .single();

        if (existingUser) {
          results.push({ email: staff.email, status: "already_exists" });
          continue;
        }

        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: staff.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { name: staff.name }
        });

        if (authError) {
          results.push({ email: staff.email, status: "auth_error", error: authError.message });
          continue;
        }

        // Determine branch based on city
        const branch = staff.city === "JUAZEIRO" ? "juazeiro" : "fortaleza";

        // Create neohub_users entry
        const { data: neohubUser, error: neohubError } = await supabaseAdmin
          .from("neohub_users")
          .insert({
            user_id: authUser.user.id,
            email: staff.email,
            full_name: staff.name,
            phone: staff.phone,
            birth_date: staff.birth,
            address_city: staff.city,
            is_active: true
          })
          .select()
          .single();

        if (neohubError) {
          results.push({ email: staff.email, status: "neohub_error", error: neohubError.message });
          continue;
        }

        // Assign colaborador profile
        await supabaseAdmin
          .from("neohub_user_profiles")
          .insert({
            neohub_user_id: neohubUser.id,
            profile: "colaborador",
            is_active: true
          });

        // If SÓCIO, also give admin profile
        if (staff.contract === "SÓCIO") {
          await supabaseAdmin
            .from("neohub_user_profiles")
            .insert({
              neohub_user_id: neohubUser.id,
              profile: "administrador",
              is_active: true
            });
        }

        // Create staff_system_access entry
        await supabaseAdmin
          .from("staff_system_access")
          .insert({
            neohub_user_id: neohubUser.id,
            city: staff.city,
            contract_type: staff.contract,
            job_title: staff.role,
            corporate_email_domain: staff.email,
            personal_phone: staff.phone
          });

        results.push({ email: staff.email, status: "created" });

      } catch (err) {
        results.push({ email: staff.email, status: "error", error: String(err) });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const existing = results.filter(r => r.status === "already_exists").length;
    const errors = results.filter(r => r.status.includes("error")).length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: { total: teamData.length, created, existing, errors },
        defaultPassword: DEFAULT_PASSWORD,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
