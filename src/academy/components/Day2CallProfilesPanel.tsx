import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, User, Target, Zap, Shield, DollarSign, MapPin, Briefcase, 
  Clock, TrendingUp, AlertCircle, CheckCircle, Star, MessageSquare,
  Building, Brain, Flame, Thermometer, Snowflake
} from 'lucide-react';

interface CallProfile {
  id: string;
  name: string;
  role: string;
  callDate: string;
  callDuration: string;
  avatar?: string;
  summary: string;
  
  // Profile data
  currentSituation: string;
  location: string;
  experience: string;
  
  // Commercial potential
  iaAvivarPotential: 'high' | 'medium' | 'low';
  iaAvivarNotes: string;
  licensePotential: 'high' | 'medium' | 'low';
  licenseNotes: string;
  legalPotential: 'high' | 'medium' | 'low';
  legalNotes: string;
  
  // Key insights
  painPoints: string[];
  objectives: string[];
  objections: string[];
  decisionFactors: string[];
  
  // Recommendation
  recommendedApproach: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  nextSteps: string[];
}

// Hardcoded call profiles extracted from the transcriptions
const callProfiles: CallProfile[] = [
  {
    id: 'nilson-paula-silva',
    name: 'Dr. Nilson Paula da Silva Junior',
    role: 'Estudante de Medicina / Advogado',
    callDate: '16/01/2026',
    callDuration: '39 min',
    summary: 'Estudante de medicina (forma em junho/2026) que já é advogado de erro médico há 10 anos. Perfil empreendedor forte: quer montar clínica de saúde masculina em Florianópolis unindo esporte, transplante capilar e saúde sexual. 33 anos, já tem visão comercial clara.',
    
    currentSituation: 'Acadêmico de medicina (último ano), já formado em Direito e atua com erro médico. Forma em junho/2026.',
    location: 'Florianópolis, SC',
    experience: 'Advogado de erro médico por 10 anos. Sem experiência médica prática ainda.',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Perfil empreendedor com visão comercial. Ao montar a clínica, vai precisar de automação desde o início para escalar. Background empresarial facilita a absorção.',
    licensePotential: 'medium',
    licenseNotes: 'Ainda acadêmico, mas com visão clara de negócio. Pode ser target para licença 6-12 meses após formatura quando estiver operando.',
    legalPotential: 'low',
    legalNotes: 'É advogado! Já domina a parte jurídica. Não vai precisar de assessoria externa.',
    
    painPoints: [
      'Faculdade não oferece prática em transplante capilar',
      'Quer sair formado já pronto para atuar',
      'Precisa de credenciamento antes do CRM'
    ],
    objectives: [
      'Montar clínica de saúde masculina em Florianópolis',
      'Unir esporte, transplante capilar e saúde sexual',
      'Ter estrutura pronta ao receber o CRM em junho',
      'Já sair operando os primeiros pacientes'
    ],
    objections: [
      'Depende do preço do investimento',
      'Ainda é acadêmico, precisa validar se pode participar'
    ],
    decisionFactors: [
      'João confirmou que acadêmico pode participar normalmente',
      'Possibilidade de acompanhar por mais tempo após curso',
      'Cashback para quem fechar na turma de janeiro',
      'Visão empresarial já desenvolvida como advogado'
    ],
    
    recommendedApproach: 'Destacar que pode começar antes de formar e já sair pronto. Oferecer acompanhamento estendido pós-curso. Ressaltar a vantagem de já ter background jurídico. IA Avivar no momento de estruturação da clínica.',
    urgencyLevel: 'high',
    nextSteps: [
      'Confirmar matrícula para turma de janeiro',
      'Alinhar programa de acompanhamento estendido',
      'Follow-up sobre plano de negócio da clínica'
    ]
  },
  {
    id: 'luis-kiyomura',
    name: 'Dr. Luis Kiyomura',
    role: 'Médico Recém-Formado',
    callDate: '14/01/2026',
    callDuration: '14 min',
    summary: 'Recém-formado do interior de São Paulo que já dava plantões. Pesquisou a área antes de formar e tem interesse em ter consultório próprio. Perfil iniciante com visão de longo prazo.',
    
    currentSituation: 'Recém-formado dando plantões. Quer migrar para área mais rentável.',
    location: 'Interior de São Paulo',
    experience: 'Recém-formado, sem experiência em estética/transplante.',
    
    iaAvivarPotential: 'medium',
    iaAvivarNotes: 'Perfil iniciante. Vai precisar de IA quando escalar, mas no início talvez não absorva. Cultivar para 6-12 meses.',
    licensePotential: 'low',
    licenseNotes: 'Recém-formado, ainda fazendo pé de meia. R$ 80k não é viável no curto prazo.',
    legalPotential: 'medium',
    legalNotes: 'Vai precisar de assessoria para estruturar primeiro consultório. Oferecer pacote básico.',
    
    painPoints: [
      'Cansado da vida de plantões',
      'Mercado de medicina geral saturado',
      'Não sabe por onde começar no transplante'
    ],
    objectives: [
      'Ter consultório próprio',
      'Migrar para área mais rentável',
      'Atuar no interior onde há menos concorrência'
    ],
    objections: [
      'Não sabe se tem dinheiro para investir',
      'Precisa entender se consegue pagar equipe'
    ],
    decisionFactors: [
      'Interior tem menos concorrência',
      'Equipe Neofolic pode ser alugada',
      'Conecta Capilar para gerar pacientes',
      'Mentoria contínua pós-curso'
    ],
    
    recommendedApproach: 'Focar no modelo de terceirização total no início (centro cirúrgico alugado, equipe neofolic). Mostrar que não precisa de investimento inicial alto. IA Avivar como upgrade após primeiros meses.',
    urgencyLevel: 'medium',
    nextSteps: [
      'Enviar simulação de custos para iniciar',
      'Apresentar modelo de terceirização',
      'Definir turma para matrícula'
    ]
  },
  {
    id: 'andre-valente',
    name: 'Dr. André Valente',
    role: 'Médico Otorrinolaringologista',
    callDate: '28/11/2025',
    callDuration: '42 min',
    summary: 'Otorrino com 26 anos de experiência, especialista em cirurgias de ouvido complexas. Atende em Arapiraca (AL) mas mora em Maceió. Mercado de rinoplastia saturado, busca "carta na manga". Transplante capilar é oportunidade no interior onde ninguém atua.',
    
    currentSituation: '26 anos de medicina. Atende 2 dias/semana em Arapiraca. Faz cirurgias de ouvido, base de crânio. Mercado de rino saturado.',
    location: 'Arapiraca, AL (trabalho) / Maceió, AL (mora)',
    experience: '26 anos de cirurgia otorrino. Base de crânio, mastodectomia. Experiência cirúrgica sólida.',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Perfil experiente que quer escala. Já tem consultório estruturado. IA Avivar para reduzir custos comerciais em 70% como mencionado na call. Pode absorver imediatamente.',
    licensePotential: 'medium',
    licenseNotes: 'Já tem estrutura própria e 26 anos de mercado. Pode considerar licença para acelerar no novo mercado, mas perfil mais independente.',
    legalPotential: 'medium',
    legalNotes: 'Precisa de contratos específicos para transplante (TCI, termo de imagem). Assessoria para transição de especialidade.',
    
    painPoints: [
      'Mercado de rinoplastia saturado',
      'Insatisfação de pacientes com rinoplastia é alta',
      'Quer "carta na manga" diferenciada',
      'Ninguém faz transplante de qualidade em Alagoas'
    ],
    objectives: [
      'Adicionar transplante capilar ao portfólio',
      'Não migrar totalmente, apenas ampliar',
      'Ser referência em Alagoas',
      'Manter qualidade de vida'
    ],
    objections: [
      'Custo de R$ 5-6k por cirurgia parece alto',
      'Quer entender se já tem equipe preparada'
    ],
    decisionFactors: [
      'Já tem experiência cirúrgica sólida',
      'Já tem consultório estruturado',
      'Interior de Alagoas sem concorrência',
      'Faturamento de R$ 15-18k por cirurgia'
    ],
    
    recommendedApproach: 'Destacar que experiência cirúrgica acelera curva de aprendizado. Enfatizar que pode capacitar própria equipe atual. Mostrar potencial de dominar mercado alagoano. IA Avivar para escalar no interior.',
    urgencyLevel: 'high',
    nextSteps: [
      'Enviar proposta com condições especiais',
      'Agendar demonstração da IA Avivar',
      'Definir turma mais próxima'
    ]
  },
  {
    id: 'gelson-nei-vaz',
    name: 'Dr. Gelson Nei Vaz dos Santos',
    role: 'Cirurgião Geral',
    callDate: '18/11/2025',
    callDuration: '30 min',
    summary: 'Cirurgião geral com 40 ANOS de formado! Trabalha com cirurgia plástica e grupo Gabriel Almeida (emagrecimento, implante hormonal). Perfil "onde tem vaga para ganhar mais, eu estou". Opera 750 pacientes/ano. Mato Grosso.',
    
    currentSituation: '40 anos de medicina. Cirurgião geral. Atende em 4 hospitais. Trabalha com grupo Gabriel Almeida (emagrecimento).',
    location: 'Mato Grosso',
    experience: '40 anos como cirurgião geral. Volume altíssimo: 750 cirurgias/ano. Cirurgia plástica.',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Volume de 750 pacientes/ano! IA Avivar essencial para gerenciar esse fluxo. Perfil que entende de escala.',
    licensePotential: 'medium',
    licenseNotes: 'Perfil independente, mas pode considerar licença para acelerar entrada no mercado capilar. Já tem estrutura.',
    legalPotential: 'low',
    legalNotes: '40 anos de mercado, provavelmente já tem assessoria jurídica estabelecida.',
    
    painPoints: [
      'Vida de cirurgião geral é muito corrida',
      'Quer diversificar faturamento',
      'Área de cirurgia geral desgastante'
    ],
    objectives: [
      'Aprender transplante capilar',
      'Diversificar fontes de receita',
      'Ganhar mais com menos desgaste',
      'Aproveitar experiência cirúrgica'
    ],
    objections: [
      'Quer ver "o esquema todo" de marketing e gestão',
      'Preocupado com cursos "picaretas"'
    ],
    decisionFactors: [
      'Formação 360 diferente de cursos tradicionais',
      'Parte de marketing e gestão incluída',
      'Equipe Neofolic pode ir ao Mato Grosso',
      'Case do Dr. Patrick: 600-800k/mês em 6 meses'
    ],
    
    recommendedApproach: 'Valorizar 40 anos de experiência cirúrgica. Mostrar case do Patrick que também era iniciante. Destacar que equipe Neofolic vai até o Mato Grosso. IA Avivar como diferencial para gerenciar alto volume.',
    urgencyLevel: 'medium',
    nextSteps: [
      'Enviar cases de médicos experientes',
      'Detalhar logística da equipe para MT',
      'Confirmar disponibilidade de turma'
    ]
  },
  {
    id: 'julio-moyses',
    name: 'Dr. Julio Moyses',
    role: 'Médico (PSF + CTI)',
    callDate: '10-12/11/2025',
    callDuration: '60+ min (2 calls)',
    summary: 'Formou na Argentina, revalidou em 2024. Trabalha PSF de dia e CTI à noite/fins de semana. Terminando pós de intensiva e medicina familiar. NÃO tem consultório nem é cirurgião. Interesse antigo no transplante. São Borja, RS (fronteira).',
    
    currentSituation: 'PSF de dia, CTI noite/fim de semana. Sem consultório próprio. Pós em intensiva e medicina familiar.',
    location: 'São Borja, RS (fronteira com Argentina)',
    experience: 'Formado 2022 (Argentina). Revalidou 2024. Não é cirurgião nem dermatologista.',
    
    iaAvivarPotential: 'medium',
    iaAvivarNotes: 'Perfil iniciante sem estrutura. IA Avivar será relevante quando começar a operar, mas não no curto prazo.',
    licensePotential: 'low',
    licenseNotes: 'Não tem consultório, não tem estrutura. R$ 80k totalmente inviável no momento atual.',
    legalPotential: 'medium',
    legalNotes: 'Vai precisar de orientação jurídica básica para começar do zero. Contratos iniciais.',
    
    painPoints: [
      'Vida de plantão cansativa e sem qualidade',
      'Não tem consultório nem estrutura',
      'Indeciso se transplante é para ele',
      'Não é cirurgião (insegurança)'
    ],
    objectives: [
      'Sair da vida de plantão',
      'Área rentável sem residência longa',
      'Qualidade de vida melhor',
      'Começar negócio próprio'
    ],
    objections: [
      'Dr. Igor fala que é para quem já tem estrutura',
      'Não tem capital inicial',
      'Não é cirurgião/dermatologista'
    ],
    decisionFactors: [
      'CRM ativo é único requisito',
      'Pode terceirizar tudo no início',
      'Interior do RS é oceano azul',
      'Case Patrick: começou do zero'
    ],
    
    recommendedApproach: 'Quebrar objeção de que precisa ser cirurgião. Mostrar modelo de terceirização total. Enfatizar que interior do RS é oceano azul. Começar com expectativas realistas de investimento inicial baixo.',
    urgencyLevel: 'medium',
    nextSteps: [
      'Enviar modelo de início terceirizado',
      'Cases de médicos não-cirurgiões',
      'Simular custos para começar em São Borja'
    ]
  },
  {
    id: 'mario-cezar-motta',
    name: 'Dr. Mario Cezar da Motta',
    role: 'Médico (Plantões)',
    callDate: '10/11/2025',
    callDuration: '49 min',
    summary: 'Formado 2020, queria fazer neurocirurgia mas não pode por questão financeira. Sócio já equipou clínica com 2 salas cirúrgicas. JÁ FEZ CURSO (R$ 53k!) mas ficou insatisfeito. Ficou 96 dias internado com pneumonia severa em 2025. Quer retomar.',
    
    currentSituation: 'Voltando de doença grave (96 dias internado). Sócio tem clínica pronta. Já fez outro curso (ruim).',
    location: 'Novo Hamburgo, RS',
    experience: 'Formado 2020. Fez hands-on com Leonardo Sauer (R$ 53k). Conhece Dr. Tony (ex-aluno Ibramec).',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Sócio já tem clínica estruturada! IA Avivar seria diferencial para retomar com força. Estrutura pronta.',
    licensePotential: 'high',
    licenseNotes: 'Já tem sócio com clínica montada (2 salas cirúrgicas). Licença pode ser caminho para padronizar operação.',
    legalPotential: 'medium',
    legalNotes: 'Precisa de contratos para sociedade e operação da clínica. Assessoria pode ajudar.',
    
    painPoints: [
      'Investiu R$ 53k em curso que não entregou teoria',
      'Ficou 96 dias internado, perdeu pacientes',
      'Precisa de educação continuada e protocolos',
      'Não sabe vender/comercializar transplante'
    ],
    objectives: [
      'Sair da vida de plantão definitivamente',
      'Completar formação teórica que faltou',
      'Aprender a comercializar e vender',
      'Ser referência na região metropolitana'
    ],
    objections: [
      'Já gastou R$ 53k em curso anterior ruim',
      'Precisa ver diferencial claro'
    ],
    decisionFactors: [
      'Conhece Dr. Tony que virou licenciado',
      'Formação entrega teoria + prática + comercial',
      'RS é oceano azul no transplante',
      '24 pacientes reais no hands-on vs 1 que fez antes'
    ],
    
    recommendedApproach: 'Usar frustração do curso anterior como alavanca. Comparar: 1 paciente (R$ 53k) vs 24 pacientes (Formação 360). Envolver Dr. Tony como prova social. Licença pode ser caminho para operação da clínica do sócio.',
    urgencyLevel: 'high',
    nextSteps: [
      'Conectar com Dr. Tony para conversa',
      'Proposta especial considerando investimento anterior',
      'Apresentar opção de licença para a clínica'
    ]
  },
  {
    id: 'joselio-alves',
    name: 'Dr. Josélio Alves',
    role: 'Médico',
    callDate: '05/11/2025',
    callDuration: '56 min',
    summary: 'Atendido durante correria (dirigindo). Perfil de médico muito ocupado buscando alternativa rentável. Interessado na parte comercial e captação de pacientes além da técnica.',
    
    currentSituation: 'Correria intensa de trabalho. Buscando diversificar.',
    location: 'Não especificado',
    experience: 'Médico em atividade, experiência não detalhada na call.',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Perfil corrido que precisa de automação. IA Avivar resolve o problema de tempo.',
    licensePotential: 'medium',
    licenseNotes: 'Perfil interessado em modelo estruturado. Pode considerar licença se demonstrar ROI.',
    legalPotential: 'medium',
    legalNotes: 'Precisa de estrutura jurídica básica para nova operação.',
    
    painPoints: [
      'Correria intensa no dia a dia',
      'Falta tempo para gerenciar novos negócios',
      'Precisa de modelo que funcione sem ele'
    ],
    objectives: [
      'Diversificar fonte de renda',
      'Modelo que funcione mesmo ocupado',
      'Aprender captação de pacientes'
    ],
    objections: [
      'Tempo é principal barreira',
      'Precisa ver modelo que funcione sem dedicação integral'
    ],
    decisionFactors: [
      'Equipe Neofolic opera por ele inicialmente',
      'IA Avivar reduz necessidade de pessoal',
      'Mentoria contínua mesmo à distância'
    ],
    
    recommendedApproach: 'Enfatizar modelo de terceirização que permite atuar sem abandonar rotina atual. IA Avivar como multiplicador de tempo. Mentoria assíncrona.',
    urgencyLevel: 'medium',
    nextSteps: [
      'Enviar material sobre modelo terceirizado',
      'Demonstração de IA Avivar',
      'Agendar call com mais tempo'
    ]
  },
  {
    id: 'deibson-santos',
    name: 'Dr. Deibson Santos Lisboa',
    role: 'Médico (UTIs)',
    callDate: '29/10/2025',
    callDuration: '50 min',
    summary: '30 anos, formou maio/2024. Trabalha em 3 UTIs. INICIOU pós na RedeStanding (NÃO recomenda!). Viu que método lá é quantitativo, não qualitativo. Apenas 4-5 práticas, desligou. Quer formação de verdade. Salvador, BA.',
    
    currentSituation: 'Trabalha em 3 UTIs. Desistiu de pós da RedeStanding (ruim). Sem consultório, fazendo pé de meia.',
    location: 'Salvador, BA (natural do Maranhão)',
    experience: 'Formado maio/2024. Fez 4-5 práticas na RedeStanding (insatisfatório). Faz curso com Priscila Barreto.',
    
    iaAvivarPotential: 'medium',
    iaAvivarNotes: 'Ainda fazendo pé de meia, sem estrutura. IA Avivar para quando começar a operar.',
    licensePotential: 'low',
    licenseNotes: 'Não tem estrutura nem capital. Foco no curso e mentoria primeiro. Licença é para fase posterior.',
    legalPotential: 'high',
    legalNotes: 'Vai começar do zero, precisa de toda estrutura jurídica: contratos, termos, regulamentação.',
    
    painPoints: [
      'Pós da RedeStanding não ensina direito',
      'Equipe de lá só quer terminar rápido (quantitativo)',
      'Não tem networking em Salvador',
      'Não sabe como se estabilizar no mercado'
    ],
    objectives: [
      'Formação de verdade com qualidade',
      'Aprender a operar corretamente',
      'Montar clínica própria no futuro',
      'Sair da vida de UTI'
    ],
    objections: [
      'Já gastou com pós que não entregou',
      'Precisa terminar pós ruim para pegar certificado',
      'Não tem capital para investir'
    ],
    decisionFactors: [
      'Neofolic: +1000 avaliações 5 estrelas Google',
      '24 cirurgias no curso vs 10 da pós',
      'Comunidade de ex-alunos ativa',
      'Mentoria contínua pós-curso'
    ],
    
    recommendedApproach: 'Comparar qualidade: RedeStanding vs Formação 360. Mostrar que não precisa de estrutura própria para começar. Destacar comunidade e network. Assessoria jurídica como diferencial para começar certo.',
    urgencyLevel: 'high',
    nextSteps: [
      'Comparativo RedeStanding vs Formação 360',
      'Modelo de início sem capital próprio',
      'Pacote com assessoria jurídica básica'
    ]
  },
  {
    id: 'marcia-dertkigil',
    name: 'Dra. Márcia San Juan Dertkigil',
    role: 'Médica Tricologista',
    callDate: '27/10/2025',
    callDuration: '38 min',
    summary: 'Médica há 28 ANOS! Formada pela UNICAMP. Fez gineco, depois imagem por 20 anos. Na pandemia fez longevidade e conheceu Priscila Barreto (HAT). Hoje SÓ trabalha com tricologia clínica. NÃO QUER operar, quer entender transplante para INDICAR melhor.',
    
    currentSituation: 'Tricologista clínica há 3 anos. Não quer fazer transplante, quer saber indicar. Speaker de marcas, escreveu livro.',
    location: 'São Paulo, SP',
    experience: '28 anos de medicina. Gineco → Imagem (20 anos) → Longevidade → Tricologia. Aluna da Priscila Barreto.',
    
    iaAvivarPotential: 'low',
    iaAvivarNotes: 'Não vai operar, só indicar. IA Avivar não faz sentido para o perfil dela.',
    licensePotential: 'low',
    licenseNotes: 'Não quer operar transplante. Perfil de encaminhadora, não operadora.',
    legalPotential: 'low',
    legalNotes: 'Já tem estrutura jurídica consolidada após 28 anos de mercado.',
    
    painPoints: [
      'Precisa entender melhor o transplante para indicar',
      'Quer saber todos os "fasos" do procedimento',
      'Atende pré e pós transplante mas não sabe tudo'
    ],
    objectives: [
      'Entender transplante para indicar melhor',
      'Conhecer processo completo mesmo sem operar',
      'Agregar valor no pré e pós operatório'
    ],
    objections: [
      'Não quer operar, só quer conhecimento',
      'Já trabalha só com tricologia clínica'
    ],
    decisionFactors: [
      'Conhece a estrutura de Alphaville',
      'Quer hands-on mesmo sem querer operar depois',
      'Formação completa em 3 dias'
    ],
    
    recommendedApproach: 'Curso como investimento em conhecimento, não em prática. Pode encaminhar pacientes para Neofolic. Parceria de indicação pode ser interessante.',
    urgencyLevel: 'low',
    nextSteps: [
      'Verificar interesse em parceria de indicação',
      'Oferecer condição especial como formadora de opinião',
      'Network com Priscila Barreto'
    ]
  },
  {
    id: 'robister-moreno',
    name: 'Dr. Robister Moreno',
    role: 'Cirurgião Geral / Médico da Marinha',
    callDate: '22-23/10/2025',
    callDuration: '60+ min (2 calls)',
    summary: 'Formado desde 2002! Cirurgião geral desde 2016. Médico da Marinha em Ladário (próximo a Corumbá, MS). JÁ FEZ TRANSPLANTE como paciente e colegas notaram resultado. Ninguém faz transplante em Corumbá! Oceano azul total.',
    
    currentSituation: 'Médico da Marinha, atua também fora. Não tem nada próprio. Corumbá não tem ninguém fazendo transplante.',
    location: 'Corumbá, MS (fronteira Bolívia/Paraguai)',
    experience: 'Formado 2002. Cirurgião geral desde 2016. Experiência em emergência. Já foi paciente de transplante.',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Corumbá é região isolada, vai precisar de automação para escalar. IA Avivar essencial para região de fronteira.',
    licensePotential: 'high',
    licenseNotes: 'Região sem concorrência! Licença pode ser caminho para dominar MS/fronteira. Alto potencial de sociedade.',
    legalPotential: 'medium',
    legalNotes: 'Precisa de estrutura jurídica para começar do zero. Contratos e regulamentação.',
    
    painPoints: [
      'Quer ampliar atuação além da Marinha',
      'Vida de emergência desgastante',
      'Nenhuma oferta de transplante na região'
    ],
    objectives: [
      'Ser o médico do cabelo de Corumbá e região',
      'Diversificar fonte de renda',
      'Atuar com algo menos desgastante'
    ],
    objections: [
      'Não tem estrutura própria ainda',
      'Precisa entender como montar equipe'
    ],
    decisionFactors: [
      'É cirurgião geral (diferencial competitivo)',
      'Já fez transplante como paciente (prova social)',
      'Corumbá sem concorrência (demanda reprimida)',
      'Equipe Neofolic pode ir até lá',
      'Possibilidade de sociedade com Neofolic'
    ],
    
    recommendedApproach: 'Destacar que será PRIMEIRO da região. RQE como diferencial. Oferecer sociedade/franquia para região. Usar experiência como paciente na comunicação.',
    urgencyLevel: 'high',
    nextSteps: [
      'Proposta de sociedade/franquia para região',
      'Simulação de mercado Corumbá + região',
      'Definir turma mais próxima'
    ]
  },
  {
    id: 'flavio-felipe',
    name: 'Dr. Flávio Machado + Dr. Felipe Telles',
    role: 'Oftalmo + Radioterapeuta (Parceiros)',
    callDate: '08/10/2025',
    callDuration: '42 min',
    summary: 'DUPLA de médicos! Flávio (oftalmo) em São Paulo, Felipe (radioterapeuta) em Curvelo-MG. Já têm parcerias fora da medicina. Querem entender se podem fazer parceria futura no capilar também.',
    
    currentSituation: 'Flávio: Oftalmo em SP. Felipe: Radioterapeuta em Curvelo-MG. Já são parceiros em negócios fora medicina.',
    location: 'São Paulo, SP + Curvelo, MG',
    experience: 'Ambos com RQE (especialização). Experiência em parcerias empresariais.',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Dois mercados (SP e MG interior). IA Avivar para gerenciar operação à distância entre os dois.',
    licensePotential: 'medium',
    licenseNotes: 'Já têm mentalidade de parceria. Podem considerar modelo conjunto de licença.',
    legalPotential: 'high',
    legalNotes: 'Vão precisar de estrutura jurídica para sociedade médica + operação em dois estados.',
    
    painPoints: [
      'Curva de aprendizado é muito rápida? (3 dias só)',
      'Querem entender se podem estudar juntos para parceria futura',
      'Comparando com pós de 6-8 meses'
    ],
    objectives: [
      'Fazer curso juntos',
      'Montar parceria no capilar como já fazem em outros negócios',
      'Atuar em duas cidades (SP e MG)'
    ],
    objections: [
      'Preocupados se 3 dias é suficiente',
      'Não têm estrutura própria ainda'
    ],
    decisionFactors: [
      'Curso perto de SP (Alphaville)',
      '24 cirurgias para praticar',
      'Mentoria individual no terceiro dia',
      'Materiais prontos (metodologia)'
    ],
    
    recommendedApproach: 'Vender como investimento de parceria. Destacar que podem operar em duas cidades. 4 pilares do curso (conhecimento + local + equipe + pacientes). Assessoria jurídica para sociedade médica.',
    urgencyLevel: 'medium',
    nextSteps: [
      'Proposta especial para dupla',
      'Modelo de operação multi-cidade',
      'Assessoria para sociedade médica'
    ]
  },
  {
    id: 'joselio-alves-full',
    name: 'Dr. Josélio Alves (Atualizado)',
    role: 'Cirurgião + Nutrólogo',
    callDate: '05/11/2025',
    callDuration: '56 min',
    summary: 'CIRURGIÃO com +15 anos de formado! Também é nutrólogo. Tem clínica própria no Maranhão. Quer adicionar transplante capilar para agregar valor. Viu Amatland 60 e gostou da parte de marketing.',
    
    currentSituation: 'Cirurgião + Nutrólogo com clínica própria no Maranhão. Quer adicionar transplante ao portfólio.',
    location: 'Maranhão',
    experience: '+15 anos de formado. Cirurgião + Nutrólogo. Tem clínica própria.',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Já tem clínica! IA Avivar perfeita para adicionar novo serviço sem aumentar equipe.',
    licensePotential: 'medium',
    licenseNotes: 'Já tem estrutura própria. Pode considerar licença para padronizar operação capilar.',
    legalPotential: 'medium',
    legalNotes: 'Precisa de contratos específicos para adicionar transplante à clínica existente.',
    
    painPoints: [
      'Quer agregar valor à clínica existente',
      'Interesse na parte de marketing além da técnica',
      'Maranhão tem poucos profissionais de transplante'
    ],
    objectives: [
      'Adicionar transplante à clínica',
      'Aprender marketing e captação',
      'Ser referência no Maranhão'
    ],
    objections: [
      'Correria do dia a dia',
      'Precisa ver se encaixa na rotina'
    ],
    decisionFactors: [
      'Dr. Elenilton é franqueado no Maranhão (prova social local)',
      'Formação inclui marketing e gestão',
      'Equipe Neofolic pode auxiliar'
    ],
    
    recommendedApproach: 'Destacar que já tem estrutura, só precisa adicionar o serviço. Conectar com Dr. Elenilton do Maranhão. IA Avivar como diferencial para gerenciar novo serviço.',
    urgencyLevel: 'high',
    nextSteps: [
      'Conectar com Dr. Elenilton (franqueado MA)',
      'Demonstração IA Avivar',
      'Proposta para adicionar transplante à clínica'
    ]
  }
];

const getPotentialBadge = (potential: 'high' | 'medium' | 'low') => {
  switch (potential) {
    case 'high':
      return <Badge className="bg-primary/10 text-primary border-primary/30"><TrendingUp className="h-3 w-3 mr-1" />Alto</Badge>;
    case 'medium':
      return <Badge className="bg-warning/10 text-warning border-warning/30"><Thermometer className="h-3 w-3 mr-1" />Médio</Badge>;
    case 'low':
      return <Badge className="bg-muted text-muted-foreground border-muted-foreground/30"><Snowflake className="h-3 w-3 mr-1" />Baixo</Badge>;
  }
};

const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
  switch (urgency) {
    case 'high':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/30"><Flame className="h-3 w-3 mr-1" />Urgente</Badge>;
    case 'medium':
      return <Badge className="bg-warning/10 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />Moderado</Badge>;
    case 'low':
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Baixa</Badge>;
  }
};

interface Day2CallProfilesPanelProps {
  className?: string;
}

export function Day2CallProfilesPanel({ className }: Day2CallProfilesPanelProps) {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Perfil de Calls de Vendas</CardTitle>
              <CardDescription>
                Insights extraídos das transcrições de calls para qualificação comercial
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Cards */}
      {callProfiles.map((profile) => (
        <Card key={profile.id} className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{profile.role}</span>
                    <span>•</span>
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>Call em {profile.callDate} ({profile.callDuration})</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getUrgencyBadge(profile.urgencyLevel)}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4 p-3 bg-background/50 rounded-lg border">
              <MessageSquare className="h-4 w-4 inline mr-2 text-primary" />
              {profile.summary}
            </p>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Commercial Potential Grid */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Potencial Comercial
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                {/* IA Avivar */}
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">IA Avivar</span>
                    </div>
                    {getPotentialBadge(profile.iaAvivarPotential)}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.iaAvivarNotes}</p>
                </div>
                
                {/* Licença */}
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Licença R$ 80k</span>
                    </div>
                    {getPotentialBadge(profile.licensePotential)}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.licenseNotes}</p>
                </div>
                
                {/* Jurídico */}
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-warning" />
                      <span className="font-medium text-sm">Assessoria Jurídica</span>
                    </div>
                    {getPotentialBadge(profile.legalPotential)}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.legalNotes}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pain Points & Objectives */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Dores Identificadas
                </h4>
                <ul className="space-y-2">
                  {profile.painPoints.map((pain, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-destructive mt-1">•</span>
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Objetivos do Lead
                </h4>
                <ul className="space-y-2">
                  {profile.objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            {/* Objections & Decision Factors */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-warning" />
                  Objeções Levantadas
                </h4>
                <ul className="space-y-2">
                  {profile.objections.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-warning mt-1">!</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Fatores de Decisão
                </h4>
                <ul className="space-y-2">
                  {profile.decisionFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">✓</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            {/* Recommended Approach & Next Steps */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Abordagem Recomendada
              </h4>
              <p className="text-sm text-muted-foreground mb-4">{profile.recommendedApproach}</p>
              
              <h4 className="font-medium text-sm mb-2">Próximos Passos:</h4>
              <div className="flex flex-wrap gap-2">
                {profile.nextSteps.map((step, idx) => (
                  <Badge key={idx} variant="outline" className="bg-background">
                    {idx + 1}. {step}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Resumo das Calls</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total de Calls Analisadas</p>
                  <p className="text-2xl font-bold text-primary">{callProfiles.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leads com Alto Potencial (IA)</p>
                  <p className="text-2xl font-bold text-primary">
                    {callProfiles.filter(p => p.iaAvivarPotential === 'high').length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leads com Alto Potencial (Licença)</p>
                  <p className="text-2xl font-bold text-primary">
                    {callProfiles.filter(p => p.licensePotential === 'high').length}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">🔥 Leads Prioritários:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Dr. Mario Cezar da Motta</strong> - Sócio já tem clínica pronta. Frustrado com curso anterior (R$53k). Alto potencial licença.</li>
                  <li><strong>Dr. André Valente</strong> - 26 anos de experiência, quer dominar Alagoas. Alto potencial IA + licença.</li>
                  <li><strong>Dr. Deibson Santos</strong> - Jovem motivado, insatisfeito com RedeStanding. Precisa de assessoria jurídica completa.</li>
                  <li><strong>Dr. Nilson Silva</strong> - Advogado + futuro médico em Floripa. Alto potencial IA quando montar clínica.</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
