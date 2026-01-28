import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OnboardingChecklist {
  id: string;
  licensee_user_id: string;
  admin_user_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  licensee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface OnboardingItem {
  id: string;
  checklist_id: string;
  order_index: number;
  phase: string;
  title: string;
  description: string;
  guidance: string;
  subtopics: string[];
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
}

// Template de itens do onboarding
export const ONBOARDING_TEMPLATE: Omit<OnboardingItem, 'id' | 'checklist_id' | 'is_completed' | 'completed_at' | 'completed_by' | 'notes' | 'created_at'>[] = [
  {
    order_index: 1,
    phase: "Abertura",
    title: "🎯 Explicar propósito do onboarding",
    description: "Abrir a jornada com clareza e intenção",
    guidance: "\"Essa reunião é o início oficial da sua jornada. Hoje eu vou te mostrar como funciona a licença, como usar tudo que você tem acesso e como vamos caminhar juntos nos próximos meses.\"",
    subtopics: ["Reforçar que existe método e processo", "Dizer que vai ser prático e direto", "Mostrar que a licença tem trilha de execução"]
  },
  {
    order_index: 2,
    phase: "Abertura",
    title: "🔒 Reforçar modelo organizado",
    description: "Criar segurança e confiança imediata",
    guidance: "\"Aqui não existe improviso, existe um fluxo claro.\" \"Você vai saber exatamente o que fazer, em que ordem, e como medir se está evoluindo.\"",
    subtopics: ["Organização do suporte", "Organização do conteúdo", "Organização da evolução por níveis"]
  },
  {
    order_index: 3,
    phase: "Níveis",
    title: "🧭 Apresentar roadmap de níveis",
    description: "Mostrar que há evolução e critérios claros",
    guidance: "\"A licença funciona por níveis de faturamento.\" \"Cada nível muda intensidade de suporte, profundidade de ajustes e foco do que vai destravar seu crescimento.\"",
    subtopics: ["Evolução é progressiva", "Nível é direção, não pressão", "Acompanhamento aumenta conforme maturidade"]
  },
  {
    order_index: 4,
    phase: "Níveis",
    title: "📈 Explicar todos os níveis",
    description: "Dar visão completa do mapa",
    guidance: "Basic até 50 mil (validar operação) → Pro 100 mil (previsibilidade) → Expert 200 mil (escalar cirurgias) → Master 500 mil (equipe robusta) → Elite 750 mil (referência regional) → Titan 1 milhão (multiclínicas) → Legacy 2M+ (estratégia Neo Group)",
    subtopics: ["Perguntar em qual nível ele está hoje", "Confirmar meta dos próximos 90 dias"]
  },
  {
    order_index: 5,
    phase: "Níveis",
    title: "🚀 Alinhar objetivo de crescimento",
    description: "Definir ponto A e ponto B",
    guidance: "Perguntas: \"Qual seu faturamento atual mensal?\" \"Qual meta realista para 90 dias?\" \"Qual meta para 12 meses?\"",
    subtopics: ["Meta precisa ser mensurável", "A licença é o caminho para encurtar sua curva"]
  },
  {
    order_index: 6,
    phase: "Ecossistema",
    title: "🧱 Explicar ecossistema completo",
    description: "Visão geral dos pilares",
    guidance: "\"Agora vou te mostrar o que você recebe na prática, organizado em pilares, para você entender onde buscar cada coisa.\"",
    subtopics: ["Mostrar que o licenciado não precisa decorar tudo hoje", "Você vai acessar isso aos poucos, no ritmo certo"]
  },
  {
    order_index: 7,
    phase: "Marca",
    title: "🏷️ Explicar uso da marca ByNeoFolic",
    description: "Alinhar permissão e posicionamento",
    guidance: "\"Você tem direito de uso da marca ByNeoFolic, seguindo o guia.\" \"A marca é um ativo, se usar certo, gera autoridade e conversão.\"",
    subtopics: ["Onde pode usar: fachada, redes, materiais", "Restrições de uso: seguir identidade visual", "Padrão de linguagem e posicionamento premium"]
  },
  {
    order_index: 8,
    phase: "Marca",
    title: "🎥 Apresentar materiais institucionais",
    description: "Mostrar arsenal de autoridade",
    guidance: "\"Você recebe templates, portfólio de imagens e vídeos e materiais institucionais base.\" \"Isso acelera o marketing porque você não começa do zero.\"",
    subtopics: ["Selo oficial de licenciado", "Templates editáveis para campanhas", "Portfólio de antes e depois (quando aplicável)"]
  },
  {
    order_index: 9,
    phase: "Método",
    title: "🧠 Explicar método e protocolos",
    description: "Mostrar padronização e segurança",
    guidance: "\"O método é o que garante previsibilidade, qualidade e replicação.\" \"Você vai receber POPs clínicos, cirúrgicos e administrativos.\"",
    subtopics: ["POP de atendimento, avaliação, follow-up", "POP cirúrgico: pré, intra e pós", "POP administrativo: rotinas e organização"]
  },
  {
    order_index: 10,
    phase: "Método",
    title: "📋 Apresentar scripts e checklists",
    description: "Entregar execução pronta",
    guidance: "\"Você vai ter scripts completos para triagem, objeções, fechamento e reativação.\" \"E checklists por etapa para garantir padrão.\"",
    subtopics: ["Script é para ganhar velocidade e consistência", "Checklist reduz erro e retrabalho"]
  },
  {
    order_index: 11,
    phase: "Treinamento",
    title: "🎓 Explicar treinamento presencial",
    description: "Deixar claro o que acontece na imersão",
    guidance: "\"Você vai fazer uma semana presencial, com prática real.\" \"Não é só assistir, tem correção, simulação e ajuste fino.\"",
    subtopics: ["Acompanhar atendimentos reais", "Simulações e roleplays", "Correções imediatas"]
  },
  {
    order_index: 12,
    phase: "Treinamento",
    title: "🧩 Explicar trilhas por cargo",
    description: "Garantir que equipe evolua junto",
    guidance: "\"Não é só para você, sua equipe também precisa aprender.\" \"Por isso existem trilhas por cargo.\"",
    subtopics: ["Recepção", "Comercial", "Marketing", "Auxiliar", "Gestor"]
  },
  {
    order_index: 13,
    phase: "Treinamento",
    title: "🖥️ Apresentar área de membros",
    description: "Mostrar onde está tudo",
    guidance: "\"Tudo fica gravado e sobe para a área de membros porque sua equipe também precisa aprender e acompanhar.\"",
    subtopics: ["Aulas e gravações", "Trilhas por função", "Atualizações contínuas"]
  },
  {
    order_index: 14,
    phase: "Suporte",
    title: "🤝 Explicar modelo de suporte",
    description: "Alinhar canais e expectativas",
    guidance: "\"Você tem suporte estratégico e suporte operacional.\" \"E também suporte comunitário no grupo.\"",
    subtopics: ["Quando acionar João e Hygor", "Quando acionar equipe de suporte", "Como tirar dúvidas no grupo"]
  },
  {
    order_index: 15,
    phase: "Suporte",
    title: "📅 Explicar reuniões semanais",
    description: "Fixar rotina de execução",
    guidance: "\"Toda quinta-feira, 20h, a gente faz a sala técnica.\" \"Tem gestão, marketing, vendas e clínica.\" \"E hot seats para dúvidas reais.\"",
    subtopics: ["Trazer caso real, números e contexto", "Sair com tarefa prática"]
  },
  {
    order_index: 16,
    phase: "Suporte",
    title: "💬 Explicar grupo exclusivo",
    description: "Definir uso correto do canal",
    guidance: "\"O grupo é o canal do dia a dia.\" \"Você vai usar para dúvidas, alinhamentos e solicitações.\"",
    subtopics: ["Como pedir material para Luanda", "Como abrir demanda técnica", "Como enviar contexto para acelerar resposta"]
  },
  {
    order_index: 17,
    phase: "Marketing",
    title: "📣 Explicar estrutura de marketing",
    description: "Mostrar prontidão para escalar",
    guidance: "\"Você recebe campanhas prontas, funis e materiais de nurturing.\" \"A ideia é acelerar captação e conversão.\"",
    subtopics: ["Funis de consultório, avaliação e fechamento", "Sequências de WhatsApp e e-mail", "Provas sociais editáveis"]
  },
  {
    order_index: 18,
    phase: "Marketing",
    title: "🖼️ Apresentar biblioteca de materiais",
    description: "Garantir clareza do acervo",
    guidance: "\"Você tem artes para feed, story, WhatsApp e anúncios.\" \"E um calendário editorial para não ficar sem pauta.\"",
    subtopics: ["Packs de criativos", "Roteiros de vídeo", "Conteúdos institucionais"]
  },
  {
    order_index: 19,
    phase: "Sistemas",
    title: "⚙️ Explicar sistemas e ferramentas",
    description: "Conectar execução com controle",
    guidance: "\"A gente organiza o CRM e o funil para medir tudo.\" \"Sem CRM, você não tem previsibilidade.\"",
    subtopics: ["Etapas do funil e metas", "Integração com WhatsApp", "Automação de mensagens"]
  },
  {
    order_index: 20,
    phase: "Sistemas",
    title: "📊 Explicar indicadores e KPIs",
    description: "Mostrar como gerir performance",
    guidance: "\"Você vai acompanhar KPIs clínicos e comerciais.\" \"Toda revisão serve para ajustar rápido.\"",
    subtopics: ["Comparecimento", "Conversão", "Ticket médio", "Taxa de fechamento", "Produção e agenda"]
  },
  {
    order_index: 21,
    phase: "Jurídico",
    title: "⚖️ Explicar suporte jurídico",
    description: "Alinhar compliance e segurança",
    guidance: "\"Você vai operar com suporte jurídico contínuo.\" \"E com diretrizes de compliance, CFM e LGPD.\"",
    subtopics: ["Comunicação segura", "Contratos e TCLE", "Padrões regulatórios"]
  },
  {
    order_index: 22,
    phase: "Jurídico",
    title: "📄 Apresentar documentos padrão",
    description: "Garantir padronização documental",
    guidance: "\"Você recebe modelos de contratos, termos e formulários internos.\" \"Isso reduz risco e acelera operação.\"",
    subtopics: ["Anamnese e avaliação", "Autorizações e termos", "Pastas padrão"]
  },
  {
    order_index: 23,
    phase: "Produtos",
    title: "🧴 Explicar acesso a produtos",
    description: "Mostrar margem e recompra",
    guidance: "\"Você tem acesso à linha de produtos com alta margem e recompra.\" \"Isso aumenta LTV e caixa.\"",
    subtopics: ["Condições especiais", "Catálogo de insumos homologados"]
  },
  {
    order_index: 24,
    phase: "Produtos",
    title: "👥 Equipe de transplante",
    description: "Condições e prioridade",
    guidance: "\"Existe condição especial para equipe de transplante e prioridade de uso.\"",
    subtopics: ["Como solicitar", "Como agendar", "Regras operacionais"]
  },
  {
    order_index: 25,
    phase: "Comunidade",
    title: "🌐 Inserir no grupo de licenciados",
    description: "Integração imediata",
    guidance: "\"Você vai ser inserido no grupo oficial agora.\" \"Esse grupo acelera porque você aprende com quem já está executando.\"",
    subtopics: ["Networking nacional", "Benchmarking"]
  },
  {
    order_index: 26,
    phase: "Comunidade",
    title: "📝 Solicitar mini bio",
    description: "Apresentação cultural",
    guidance: "\"Me manda uma mini bio com: cidade, momento atual, equipe, faturamento aproximado, meta 90 dias, e principal desafio.\"",
    subtopics: ["Essa bio será repassada para o grupo", "Serve para integrar e gerar apoio rápido"]
  },
  {
    order_index: 27,
    phase: "Expectativas",
    title: "🧠 Alinhar expectativas do modelo",
    description: "Ajustar percepção e evitar fricção",
    guidance: "\"A licença não é franquia, não tem royalties, nem burocracia.\" \"Você acessa um modelo validado e um acompanhamento contínuo para acelerar seu crescimento.\"",
    subtopics: ["Você tem autonomia", "Você recebe direção", "Tudo é evolutivo", "Ninguém fica sozinho"]
  },
  {
    order_index: 28,
    phase: "Expectativas",
    title: "🛣️ Reforçar caminho até 2M",
    description: "Criar visão de longo prazo",
    guidance: "\"Existe um caminho claro para chegar aos 2 milhões, nível a nível.\" \"A meta é previsibilidade e escala, com segurança.\"",
    subtopics: ["Próximo nível é o foco", "Revisões e auditorias como alavancas"]
  },
  {
    order_index: 29,
    phase: "Presencial",
    title: "✈️ Alinhar vinda presencial",
    description: "Definir logística do Fellow",
    guidance: "\"Vamos marcar sua semana presencial.\" \"Você vai assistir atendimentos, depois atender junto, e ajustar discurso e condução.\"",
    subtopics: ["Agenda sugerida", "Preparação do licenciado", "Meta de atendimentos juntos"]
  },
  {
    order_index: 30,
    phase: "Encerramento",
    title: "✅ Confirmar próximos passos",
    description: "Fechar com ações claras",
    guidance: "\"Seu próximo passo é entrar no grupo, mandar sua apresentação e participar da próxima sala técnica.\"",
    subtopics: ["Confirmar data da próxima sala técnica", "Confirmar envio da mini bio hoje"]
  },
  {
    order_index: 31,
    phase: "Encerramento",
    title: "🔔 Mensagem de jornada",
    description: "Encerramento emocional e firme",
    guidance: "\"Daqui para frente você nunca mais caminha sozinho.\"",
    subtopics: ["Reforçar suporte contínuo", "Reforçar comunidade", "Reforçar execução semanal"]
  }
];

export function useLicenseeOnboarding() {
  const queryClient = useQueryClient();

  // Buscar todos os checklists de onboarding
  const { data: checklists, isLoading } = useQuery({
    queryKey: ["licensee-onboarding-checklists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licensee_onboarding_checklists")
        .select(`
          *,
          licensee:neohub_users!licensee_user_id(id, full_name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as OnboardingChecklist[];
    }
  });

  // Buscar licenciados sem onboarding
  const { data: licenseesWithoutOnboarding } = useQuery({
    queryKey: ["licensees-without-onboarding"],
    queryFn: async () => {
      // Buscar todos os licenciados
      const { data: licensees, error: licenseeError } = await supabase
        .from("neohub_users")
        .select(`
          id, full_name, email,
          neohub_user_profiles!inner(profile)
        `)
        .eq("neohub_user_profiles.profile", "licenciado")
        .eq("neohub_user_profiles.is_active", true);
      
      if (licenseeError) throw licenseeError;

      // Buscar IDs de quem já tem onboarding
      const { data: existingOnboardings, error: onboardingError } = await supabase
        .from("licensee_onboarding_checklists")
        .select("licensee_user_id");
      
      if (onboardingError) throw onboardingError;

      const existingIds = new Set(existingOnboardings?.map(o => o.licensee_user_id) || []);
      
      return licensees?.filter(l => !existingIds.has(l.id)) || [];
    }
  });

  // Criar onboarding para um licenciado
  const createOnboarding = useMutation({
    mutationFn: async (licenseeUserId: string) => {
      // Criar o checklist
      const { data: checklist, error: checklistError } = await supabase
        .from("licensee_onboarding_checklists")
        .insert({ licensee_user_id: licenseeUserId })
        .select()
        .single();
      
      if (checklistError) throw checklistError;

      // Criar todos os itens do template
      const items = ONBOARDING_TEMPLATE.map(item => ({
        ...item,
        checklist_id: checklist.id
      }));

      const { error: itemsError } = await supabase
        .from("licensee_onboarding_items")
        .insert(items);
      
      if (itemsError) throw itemsError;

      return checklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licensee-onboarding-checklists"] });
      queryClient.invalidateQueries({ queryKey: ["licensees-without-onboarding"] });
      toast.success("Onboarding criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar onboarding: " + error.message);
    }
  });

  return {
    checklists,
    licenseesWithoutOnboarding,
    isLoading,
    createOnboarding
  };
}

export function useOnboardingItems(checklistId: string | null) {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["onboarding-items", checklistId],
    queryFn: async () => {
      if (!checklistId) return [];
      
      const { data, error } = await supabase
        .from("licensee_onboarding_items")
        .select("*")
        .eq("checklist_id", checklistId)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as OnboardingItem[];
    },
    enabled: !!checklistId
  });

  const toggleItem = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      const updates: Record<string, unknown> = { is_completed: isCompleted };
      
      if (isCompleted) {
        updates.completed_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        
        // Buscar neohub_user_id
        const { data: neohubUser } = await supabase
          .from("neohub_users")
          .select("id")
          .eq("user_id", user?.id)
          .single();
        
        updates.completed_by = neohubUser?.id;
      } else {
        updates.completed_at = null;
        updates.completed_by = null;
      }
      
      const { error } = await supabase
        .from("licensee_onboarding_items")
        .update(updates)
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-items", checklistId] });
    }
  });

  const updateItemNotes = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
      const { error } = await supabase
        .from("licensee_onboarding_items")
        .update({ notes })
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-items", checklistId] });
    }
  });

  const updateChecklistStatus = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      if (!checklistId) return;
      
      const updates: Record<string, unknown> = { status };
      
      if (status === "em_andamento" && !items?.some(i => i.is_completed)) {
        updates.started_at = new Date().toISOString();
      }
      
      if (status === "concluido") {
        updates.completed_at = new Date().toISOString();
      }
      
      if (notes !== undefined) {
        updates.notes = notes;
      }
      
      const { error } = await supabase
        .from("licensee_onboarding_checklists")
        .update(updates)
        .eq("id", checklistId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licensee-onboarding-checklists"] });
      toast.success("Status atualizado!");
    }
  });

  // Stats
  const stats = items ? {
    total: items.length,
    completed: items.filter(i => i.is_completed).length,
    pending: items.filter(i => !i.is_completed).length,
    percentage: Math.round((items.filter(i => i.is_completed).length / items.length) * 100),
    byPhase: items.reduce((acc, item) => {
      if (!acc[item.phase]) {
        acc[item.phase] = { total: 0, completed: 0 };
      }
      acc[item.phase].total++;
      if (item.is_completed) acc[item.phase].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>)
  } : null;

  return {
    items,
    stats,
    isLoading,
    toggleItem,
    updateItemNotes,
    updateChecklistStatus
  };
}
