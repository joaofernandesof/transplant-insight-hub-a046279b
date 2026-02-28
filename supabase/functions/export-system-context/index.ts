import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claims.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.user.id;

    // Check if user is admin
    const { data: adminCheck } = await supabase.rpc("is_neohub_admin", { checking_user_id: userId });
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse format param
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "markdown";

    // 1. Fetch all tables and columns
    const { data: tables } = await supabase.rpc("get_system_tables_info");

    // Fallback: query information_schema directly
    const { data: columnsData } = await supabase
      .from("information_schema.columns" as any)
      .select("table_name, column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")
      .order("table_name")
      .order("ordinal_position");

    // 2. Fetch RLS policies
    const { data: policies } = await supabase.rpc("get_rls_policies");

    // 3. Fetch edge functions info from logs
    const { data: edgeFunctions } = await supabase
      .from("edge_function_logs")
      .select("function_name")
      .order("created_at", { ascending: false })
      .limit(100);

    // 4. Fetch user roles/profiles
    const { data: roles } = await supabase
      .from("neohub_user_roles")
      .select("role, profile_type")
      .limit(50);

    // Build the context document
    const now = new Date().toISOString();
    const uniqueFunctions = [...new Set(edgeFunctions?.map((e: any) => e.function_name) || [])];
    const uniqueRoles = [...new Set(roles?.map((r: any) => `${r.role}/${r.profile_type}`) || [])];

    // Group columns by table
    const tableMap: Record<string, Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>> = {};
    if (columnsData) {
      for (const col of columnsData as any[]) {
        if (!tableMap[col.table_name]) tableMap[col.table_name] = [];
        tableMap[col.table_name].push(col);
      }
    }

    // Portal/route definitions
    const portals = [
      { key: "neocare", name: "NeoCare", route: "/neocare", description: "Prontuários e orientações de pacientes" },
      { key: "neoteam", name: "NeoTeam", route: "/neoteam", description: "Gestão clínica (agenda, pacientes, estoque) e Pós-Venda" },
      { key: "academy", name: "Academy", route: "/academy", description: "Cursos e pesquisas" },
      { key: "avivar", name: "Avivar", route: "/avivar", description: "Marketing, CRM e IA conversacional" },
      { key: "ipromed", name: "IPROMED/CPG", route: "/ipromed", description: "Gestão financeira e jurídica" },
      { key: "neopay", name: "NeoPay", route: "/neopay", description: "Transações e antecipações" },
      { key: "neolicense", name: "NeoLicense", route: "/neolicense", description: "Portal do licenciado" },
      { key: "vision", name: "Vision", route: "/vision", description: "Diagnóstico capilar por IA" },
      { key: "hotleads", name: "HotLeads", route: "/hotleads", description: "Distribuição de leads" },
      { key: "neoacademy", name: "NeoAcademy", route: "/neoacademy", description: "Plataforma educacional" },
    ];

    if (format === "json") {
      const jsonExport = {
        generated_at: now,
        system: "NeoHub by ByNeofolic",
        stack: {
          frontend: "React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui",
          backend: "Supabase (PostgreSQL + Edge Functions + Auth + Storage)",
          state: "TanStack Query + Context API",
          routing: "React Router DOM v6",
        },
        portals,
        tables: tableMap,
        rls_policies: policies || [],
        edge_functions: uniqueFunctions,
        roles: uniqueRoles,
      };

      return new Response(JSON.stringify(jsonExport, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Markdown format
    let md = `# NeoHub System Context\n`;
    md += `> Auto-generated on ${now}\n\n`;

    md += `## Stack Tecnológica\n`;
    md += `- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui\n`;
    md += `- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)\n`;
    md += `- **State**: TanStack Query (React Query) + Context API\n`;
    md += `- **Routing**: React Router DOM v6\n`;
    md += `- **UI**: Radix UI primitives, Lucide icons, Recharts\n\n`;

    md += `## Portais\n\n`;
    md += `| Portal | Rota | Descrição |\n|--------|------|----------|\n`;
    for (const p of portals) {
      md += `| ${p.name} | \`${p.route}\` | ${p.description} |\n`;
    }
    md += `\n`;

    md += `## Tabelas do Banco (${Object.keys(tableMap).length})\n\n`;
    const tableNames = Object.keys(tableMap).sort();
    for (const tableName of tableNames) {
      const cols = tableMap[tableName];
      md += `### ${tableName}\n`;
      md += `| Coluna | Tipo | Nullable | Default |\n|--------|------|----------|--------|\n`;
      for (const col of cols) {
        md += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || "-"} |\n`;
      }
      md += `\n`;
    }

    md += `## Edge Functions (${uniqueFunctions.length})\n\n`;
    for (const fn of uniqueFunctions.sort()) {
      md += `- \`${fn}\`\n`;
    }
    md += `\n`;

    md += `## Roles/Perfis (${uniqueRoles.length})\n\n`;
    for (const role of uniqueRoles.sort()) {
      md += `- ${role}\n`;
    }
    md += `\n`;

    if (policies && policies.length > 0) {
      md += `## RLS Policies (${policies.length})\n\n`;
      md += `| Tabela | Policy | Comando | Expressão |\n|--------|--------|---------|----------|\n`;
      for (const p of policies as any[]) {
        md += `| ${p.tablename || p.table_name} | ${p.policyname || p.policy_name} | ${p.cmd || p.command} | ${(p.qual || p.expression || "").substring(0, 60)}... |\n`;
      }
    }

    return new Response(md, {
      headers: { ...corsHeaders, "Content-Type": "text/markdown; charset=utf-8" },
    });
  } catch (e) {
    console.error("export-system-context error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
