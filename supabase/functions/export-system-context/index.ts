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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_neohub_admin", { checking_user_id: userData.user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "markdown";

    // Fetch schema info via RPC
    const { data: columnsRaw } = await supabaseAdmin.rpc("get_system_tables_info");
    const { data: policiesRaw } = await supabaseAdmin.rpc("get_rls_policies");

    // Fetch edge function names from logs
    const { data: edgeFnLogs } = await supabaseAdmin
      .from("edge_function_logs")
      .select("function_name")
      .order("created_at", { ascending: false })
      .limit(200);

    // Fetch roles
    const { data: roles } = await supabaseAdmin
      .from("neohub_user_roles")
      .select("role, profile_type")
      .limit(100);

    const columns: any[] = columnsRaw || [];
    const policies: any[] = policiesRaw || [];
    const uniqueFunctions = [...new Set((edgeFnLogs || []).map((e: any) => e.function_name))].sort();
    const uniqueRoles = [...new Set((roles || []).map((r: any) => `${r.role}/${r.profile_type}`))].sort();

    // Group columns by table
    const tableMap: Record<string, any[]> = {};
    for (const col of columns) {
      const tn = col.table_name;
      if (!tableMap[tn]) tableMap[tn] = [];
      tableMap[tn].push(col);
    }

    const portals = [
      { key: "neocare", name: "NeoCare", route: "/neocare", desc: "Prontuários e orientações de pacientes" },
      { key: "neoteam", name: "NeoTeam", route: "/neoteam", desc: "Gestão clínica (agenda, pacientes, estoque, pós-venda)" },
      { key: "academy", name: "Academy", route: "/academy", desc: "Cursos e pesquisas" },
      { key: "avivar", name: "Avivar", route: "/avivar", desc: "Marketing, CRM e IA conversacional" },
      { key: "ipromed", name: "IPROMED/CPG", route: "/ipromed", desc: "Gestão financeira e jurídica" },
      { key: "neopay", name: "NeoPay", route: "/neopay", desc: "Transações e antecipações" },
      { key: "neolicense", name: "NeoLicense", route: "/neolicense", desc: "Portal do licenciado" },
      { key: "vision", name: "Vision", route: "/vision", desc: "Diagnóstico capilar por IA" },
      { key: "hotleads", name: "HotLeads", route: "/hotleads", desc: "Distribuição de leads" },
      { key: "neoacademy", name: "NeoAcademy", route: "/neoacademy", desc: "Plataforma educacional" },
    ];

    const now = new Date().toISOString();

    if (format === "json") {
      return new Response(JSON.stringify({
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
        table_count: Object.keys(tableMap).length,
        rls_policies: policies,
        edge_functions: uniqueFunctions,
        roles: uniqueRoles,
      }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Markdown
    let md = `# NeoHub - System Context Export\n`;
    md += `> Generated: ${now}\n\n`;

    md += `## Stack\n`;
    md += `- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui\n`;
    md += `- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)\n`;
    md += `- **State**: TanStack Query + Context API\n`;
    md += `- **Routing**: React Router DOM v6\n`;
    md += `- **UI**: Radix UI, Lucide icons, Recharts\n\n`;

    md += `## Portais (${portals.length})\n\n`;
    md += `| Portal | Rota | Descrição |\n|--------|------|----------|\n`;
    for (const p of portals) {
      md += `| ${p.name} | \`${p.route}\` | ${p.desc} |\n`;
    }
    md += `\n`;

    md += `## Tabelas (${Object.keys(tableMap).length})\n\n`;
    for (const tableName of Object.keys(tableMap).sort()) {
      const cols = tableMap[tableName];
      md += `### \`${tableName}\` (${cols.length} cols)\n`;
      md += `| Coluna | Tipo | Nullable |\n|--------|------|----------|\n`;
      for (const col of cols) {
        md += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} |\n`;
      }
      md += `\n`;
    }

    md += `## Edge Functions (${uniqueFunctions.length})\n\n`;
    for (const fn of uniqueFunctions) md += `- \`${fn}\`\n`;
    md += `\n`;

    md += `## Perfis/Roles (${uniqueRoles.length})\n\n`;
    for (const r of uniqueRoles) md += `- ${r}\n`;
    md += `\n`;

    md += `## RLS Policies (${policies.length})\n\n`;
    if (policies.length > 0) {
      md += `| Tabela | Policy | Comando |\n|--------|--------|--------|\n`;
      for (const p of policies) {
        md += `| ${p.table_name} | ${p.policy_name} | ${p.command} |\n`;
      }
    }

    return new Response(md, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="neohub-context-${now.split("T")[0]}.md"`,
      },
    });
  } catch (e) {
    console.error("export-system-context error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
