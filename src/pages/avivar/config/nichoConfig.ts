/**
 * Configurações específicas por nicho/subnicho
 * Define serviços, campos do profissional e templates de prompt
 */

import { Service, SubnichoType, NichoType } from './types';

// ============= CONFIGURAÇÕES DE CAMPOS DA EMPRESA/LOCAL =============

export interface CompanyFieldConfig {
  stepTitle: string;
  stepSubtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  addressLabel: string;
  addressPlaceholder: string;
  addressHint: string;
  icon: 'building' | 'store' | 'home' | 'utensils' | 'briefcase';
}

export const COMPANY_FIELDS: Record<NichoType, CompanyFieldConfig> = {
  saude: {
    stepTitle: 'Dados da Clínica',
    stepSubtitle: 'Informações sobre o local de atendimento',
    nameLabel: 'Nome da Clínica',
    namePlaceholder: 'Ex: Clínica São Lucas',
    addressLabel: 'Endereço Completo',
    addressPlaceholder: 'Ex: Av. Paulista, 1000 - Sala 201\nSão Paulo/SP - CEP 01310-100',
    addressHint: 'Inclua: Rua, Número, Complemento, CEP',
    icon: 'building',
  },
  estetica: {
    stepTitle: 'Dados da Clínica',
    stepSubtitle: 'Informações sobre o estabelecimento',
    nameLabel: 'Nome da Clínica/Estabelecimento',
    namePlaceholder: 'Ex: Clínica Desiree Hickmann',
    addressLabel: 'Endereço Completo',
    addressPlaceholder: 'Ex: Av. Getúlio Vargas, 4841 - Conj. 705\nCanoas/RS - CEP 92020-333',
    addressHint: 'Inclua: Rua, Número, Complemento, CEP',
    icon: 'building',
  },
  vendas: {
    stepTitle: 'Dados da Loja',
    stepSubtitle: 'Informações sobre o ponto de venda',
    nameLabel: 'Nome da Loja',
    namePlaceholder: 'Ex: Tech Store Centro',
    addressLabel: 'Endereço da Loja',
    addressPlaceholder: 'Ex: Rua das Flores, 123 - Loja 5\nBelo Horizonte/MG - CEP 30130-000',
    addressHint: 'Se loja online, coloque "Loja Virtual"',
    icon: 'store',
  },
  imobiliario: {
    stepTitle: 'Dados do Escritório',
    stepSubtitle: 'Informações da imobiliária ou escritório',
    nameLabel: 'Nome da Imobiliária/Escritório',
    namePlaceholder: 'Ex: Imobiliária Premium',
    addressLabel: 'Endereço do Escritório',
    addressPlaceholder: 'Ex: Av. Brasil, 500 - Sala 1001\nRio de Janeiro/RJ - CEP 20040-020',
    addressHint: 'Endereço principal de atendimento',
    icon: 'home',
  },
  alimentacao: {
    stepTitle: 'Dados do Estabelecimento',
    stepSubtitle: 'Informações do restaurante ou lanchonete',
    nameLabel: 'Nome do Estabelecimento',
    namePlaceholder: 'Ex: Restaurante Sabor Caseiro',
    addressLabel: 'Endereço',
    addressPlaceholder: 'Ex: Rua da Gastronomia, 42\nCuritiba/PR - CEP 80020-000',
    addressHint: 'Endereço para entrega ou retirada',
    icon: 'utensils',
  },
  servicos: {
    stepTitle: 'Dados do Escritório',
    stepSubtitle: 'Informações do local de atendimento',
    nameLabel: 'Nome do Escritório/Empresa',
    namePlaceholder: 'Ex: Advocacia Silva & Associados',
    addressLabel: 'Endereço do Escritório',
    addressPlaceholder: 'Ex: Rua XV de Novembro, 200 - Sala 302\nPorto Alegre/RS - CEP 90020-000',
    addressHint: 'Endereço principal de atendimento',
    icon: 'briefcase',
  },
  outros: {
    stepTitle: 'Dados da Empresa',
    stepSubtitle: 'Informações do seu negócio',
    nameLabel: 'Nome da Empresa',
    namePlaceholder: 'Ex: Empresa XYZ',
    addressLabel: 'Endereço',
    addressPlaceholder: 'Ex: Rua Principal, 100\nSua Cidade/UF - CEP 00000-000',
    addressHint: 'Endereço comercial',
    icon: 'building',
  },
};

// Configurações específicas por subnicho (override do nicho para empresa)
export const SUBNICHO_COMPANY_OVERRIDES: Partial<Record<SubnichoType, Partial<CompanyFieldConfig>>> = {
  // Saúde
  hospital: { stepTitle: 'Dados do Hospital', nameLabel: 'Nome do Hospital', namePlaceholder: 'Ex: Hospital Santa Casa' },
  laboratorio: { stepTitle: 'Dados do Laboratório', nameLabel: 'Nome do Laboratório', namePlaceholder: 'Ex: Laboratório Central' },
  farmacia: { stepTitle: 'Dados da Farmácia', nameLabel: 'Nome da Farmácia', namePlaceholder: 'Ex: Farmácia Popular' },
  
  // Estética
  salao_beleza: { stepTitle: 'Dados do Salão', nameLabel: 'Nome do Salão', namePlaceholder: 'Ex: Salão Glamour' },
  barbearia: { stepTitle: 'Dados da Barbearia', nameLabel: 'Nome da Barbearia', namePlaceholder: 'Ex: Barbearia Vintage' },
  spa: { stepTitle: 'Dados do SPA', nameLabel: 'Nome do SPA', namePlaceholder: 'Ex: SPA Relaxante' },
  
  // Vendas
  celulares_eletronicos: { namePlaceholder: 'Ex: iStore Brasil' },
  roupas_moda: { namePlaceholder: 'Ex: Boutique Fashion' },
  joias_acessorios: { namePlaceholder: 'Ex: Joalheria Diamante' },
  
  // Imobiliário
  agente_imobiliario: { stepTitle: 'Dados do Corretor', stepSubtitle: 'Informações do corretor autônomo' },
  construtora: { stepTitle: 'Dados da Construtora', nameLabel: 'Nome da Construtora', namePlaceholder: 'Ex: Construtora Alfa' },
  administradora: { stepTitle: 'Dados da Administradora', nameLabel: 'Nome da Administradora' },
  
  // Alimentação
  restaurante: { nameLabel: 'Nome do Restaurante', namePlaceholder: 'Ex: Restaurante Sabor Caseiro' },
  delivery: { stepTitle: 'Dados do Delivery', nameLabel: 'Nome do Delivery', addressHint: 'Endereço da cozinha ou ponto de retirada' },
  pizzaria: { stepTitle: 'Dados da Pizzaria', nameLabel: 'Nome da Pizzaria', namePlaceholder: 'Ex: Pizzaria Bella Napoli' },
  cafeteria: { stepTitle: 'Dados da Cafeteria', nameLabel: 'Nome da Cafeteria', namePlaceholder: 'Ex: Café Aroma' },
  confeitaria: { stepTitle: 'Dados da Confeitaria', nameLabel: 'Nome da Confeitaria', namePlaceholder: 'Ex: Doces da Vovó' },
  food_truck: { stepTitle: 'Dados do Food Truck', nameLabel: 'Nome do Food Truck', namePlaceholder: 'Ex: Burger on Wheels' },
  lanchonete: { stepTitle: 'Dados da Lanchonete', nameLabel: 'Nome da Lanchonete', namePlaceholder: 'Ex: Lanchonete Central' },
  
  // Serviços
  advocacia: { nameLabel: 'Nome do Escritório', namePlaceholder: 'Ex: Advocacia Silva & Associados' },
  contabilidade: { nameLabel: 'Nome do Escritório', namePlaceholder: 'Ex: Contabilidade Express' },
  consultoria: { stepTitle: 'Dados da Consultoria', nameLabel: 'Nome da Consultoria', namePlaceholder: 'Ex: Consultoria Estratégica' },
  academia_personal: { stepTitle: 'Dados da Academia', nameLabel: 'Nome da Academia/Estúdio', namePlaceholder: 'Ex: Academia Power Fit' },
  oficina_mecanica: { stepTitle: 'Dados da Oficina', nameLabel: 'Nome da Oficina', namePlaceholder: 'Ex: Auto Mecânica Silva' },
  pet_shop_veterinario: { stepTitle: 'Dados do Pet Shop', nameLabel: 'Nome do Pet Shop', namePlaceholder: 'Ex: Pet Feliz' },
  limpeza_manutencao: { stepTitle: 'Dados da Empresa', nameLabel: 'Nome da Empresa', namePlaceholder: 'Ex: Limpeza Total' },
  marketing_agencia: { stepTitle: 'Dados da Agência', nameLabel: 'Nome da Agência', namePlaceholder: 'Ex: Agência Criativa' },
  cursos_educacao: { stepTitle: 'Dados da Escola/Curso', nameLabel: 'Nome da Instituição', namePlaceholder: 'Ex: Escola de Idiomas Global' },
  eventos: { stepTitle: 'Dados da Empresa', nameLabel: 'Nome da Empresa de Eventos', namePlaceholder: 'Ex: Eventos Prime' },
  fotografia: { stepTitle: 'Dados do Estúdio', nameLabel: 'Nome do Estúdio/Fotógrafo', namePlaceholder: 'Ex: Studio Imagem' },
  tecnologia_ti: { stepTitle: 'Dados da Empresa', nameLabel: 'Nome da Empresa de TI', namePlaceholder: 'Ex: Tech Solutions' },
};

// Função para obter configurações da empresa por nicho/subnicho
export function getCompanyFieldConfig(nicho: NichoType | null, subnicho: SubnichoType | null): CompanyFieldConfig {
  const baseConfig = COMPANY_FIELDS[nicho || 'outros'];
  const override = subnicho ? SUBNICHO_COMPANY_OVERRIDES[subnicho] : undefined;
  
  return {
    ...baseConfig,
    ...override,
  };
}

// ============= CONFIGURAÇÕES DE CAMPOS PROFISSIONAIS =============

export interface ProfessionalFieldConfig {
  nameLabel: string;
  namePlaceholder: string;
  nameHint: string;
  registrationLabel: string;
  registrationPlaceholder: string;
  registrationHint: string;
  showRegistration: boolean;
}

export const PROFESSIONAL_FIELDS: Record<NichoType, ProfessionalFieldConfig> = {
  saude: {
    nameLabel: 'Nome do Profissional',
    namePlaceholder: 'Ex: Dr. João Silva',
    nameHint: 'Use o nome como gostaria que os pacientes se refiram',
    registrationLabel: 'CRM / Registro Profissional',
    registrationPlaceholder: 'Ex: 12345 SP',
    registrationHint: 'CRM, CRO, CREFITO ou outro registro',
    showRegistration: true,
  },
  estetica: {
    nameLabel: 'Nome do Profissional',
    namePlaceholder: 'Ex: Dr. Mario',
    nameHint: 'Use o nome como gostaria que os clientes se refiram',
    registrationLabel: 'CRM / Registro',
    registrationPlaceholder: 'Ex: 50036 RS',
    registrationHint: 'Registro profissional (se aplicável)',
    showRegistration: true,
  },
  vendas: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: Carlos Mendes',
    nameHint: 'Nome do proprietário ou gerente',
    registrationLabel: 'CNPJ (opcional)',
    registrationPlaceholder: 'Ex: 12.345.678/0001-90',
    registrationHint: 'CNPJ da empresa',
    showRegistration: false,
  },
  imobiliario: {
    nameLabel: 'Nome do Corretor',
    namePlaceholder: 'Ex: Roberto Andrade',
    nameHint: 'Nome completo do corretor',
    registrationLabel: 'CRECI',
    registrationPlaceholder: 'Ex: 12345-F',
    registrationHint: 'Número do registro no CRECI',
    showRegistration: true,
  },
  alimentacao: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: Chef Maria',
    nameHint: 'Nome do proprietário ou chef',
    registrationLabel: 'CNPJ',
    registrationPlaceholder: 'Ex: 12.345.678/0001-90',
    registrationHint: 'CNPJ do estabelecimento',
    showRegistration: false,
  },
  servicos: {
    nameLabel: 'Nome do Profissional',
    namePlaceholder: 'Ex: Dr. Paulo Santos',
    nameHint: 'Nome profissional de apresentação',
    registrationLabel: 'Registro Profissional',
    registrationPlaceholder: 'Ex: OAB 12345 SP',
    registrationHint: 'OAB, CRC, CREA ou outro registro',
    showRegistration: true,
  },
  outros: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: João Silva',
    nameHint: 'Nome do responsável pelo negócio',
    registrationLabel: 'Registro/CNPJ',
    registrationPlaceholder: 'Ex: 12.345.678/0001-90',
    registrationHint: 'Registro profissional ou CNPJ',
    showRegistration: false,
  },
};

// Configurações específicas por subnicho (override do nicho)
export const SUBNICHO_PROFESSIONAL_OVERRIDES: Partial<Record<SubnichoType, Partial<ProfessionalFieldConfig>>> = {
  // SAÚDE - todos precisam de registro
  dentista: {
    registrationLabel: 'CRO',
    registrationPlaceholder: 'Ex: 12345 SP',
    registrationHint: 'Número do registro no CRO',
  },
  fisioterapia: {
    registrationLabel: 'CREFITO',
    registrationPlaceholder: 'Ex: 12345-F',
    registrationHint: 'Número do registro no CREFITO',
  },
  psicologia: {
    registrationLabel: 'CRP',
    registrationPlaceholder: 'Ex: 06/12345',
    registrationHint: 'Número do registro no CRP',
  },
  nutricao: {
    registrationLabel: 'CRN',
    registrationPlaceholder: 'Ex: CRN-3 12345',
    registrationHint: 'Número do registro no CRN',
  },
  
  // ESTÉTICA - alguns precisam, outros não
  transplante_capilar: {
    nameLabel: 'Nome do Médico',
    namePlaceholder: 'Ex: Dr. Mario Farinazzo',
    nameHint: 'Nome do médico responsável pelo procedimento',
    registrationLabel: 'CRM',
    registrationPlaceholder: 'Ex: 50036 RS',
    registrationHint: 'Número do CRM do médico',
    showRegistration: true,
  },
  clinica_estetica: {
    nameLabel: 'Nome do Profissional',
    namePlaceholder: 'Ex: Dra. Ana Paula',
    nameHint: 'Biomédico, dermatologista ou esteticista responsável',
    registrationLabel: 'Registro Profissional',
    registrationPlaceholder: 'Ex: CRM ou CRBM',
    registrationHint: 'CRM, CRBM ou registro do profissional',
    showRegistration: true,
  },
  salao_beleza: {
    nameLabel: 'Nome do Proprietário(a)',
    namePlaceholder: 'Ex: Maria das Graças',
    nameHint: 'Nome do proprietário ou gerente do salão',
    showRegistration: false,
  },
  barbearia: {
    nameLabel: 'Nome do Proprietário(a)',
    namePlaceholder: 'Ex: Carlos Barbeiro',
    nameHint: 'Nome do proprietário ou barbeiro principal',
    showRegistration: false,
  },
  spa: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: Fernanda Wellness',
    nameHint: 'Nome do gerente ou proprietário',
    showRegistration: false,
  },
  micropigmentacao: {
    nameLabel: 'Nome do Profissional',
    namePlaceholder: 'Ex: Juliana Soares',
    nameHint: 'Nome do micropigmentador(a)',
    showRegistration: false,
  },
  depilacao: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: Paula Lima',
    nameHint: 'Nome do profissional ou proprietário',
    showRegistration: false,
  },
  
  // IMOBILIÁRIO
  agente_imobiliario: {
    registrationLabel: 'CRECI',
    registrationPlaceholder: 'Ex: CRECI 12345-F',
    registrationHint: 'Número do registro no CRECI',
    showRegistration: true,
  },
  imobiliaria: {
    nameLabel: 'Nome da Imobiliária',
    namePlaceholder: 'Ex: Imobiliária Premium',
    nameHint: 'Nome fantasia da empresa',
    registrationLabel: 'CRECI-J',
    registrationPlaceholder: 'Ex: CRECI-J 12345',
    registrationHint: 'Registro da pessoa jurídica no CRECI',
    showRegistration: true,
  },
  construtora: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: Eng. Roberto Silva',
    nameHint: 'Engenheiro ou diretor responsável',
    registrationLabel: 'CREA',
    registrationPlaceholder: 'Ex: CREA 123456',
    registrationHint: 'Registro no CREA (opcional)',
    showRegistration: false,
  },
  administradora: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: João Administrador',
    nameHint: 'Diretor ou gerente responsável',
    showRegistration: false,
  },
  
  // SERVIÇOS - varia conforme profissão
  advocacia: {
    nameLabel: 'Nome do Advogado',
    namePlaceholder: 'Ex: Dr. Paulo Santos',
    registrationLabel: 'OAB',
    registrationPlaceholder: 'Ex: OAB 123456 SP',
    registrationHint: 'Número de inscrição na OAB',
    showRegistration: true,
  },
  contabilidade: {
    nameLabel: 'Nome do Contador',
    namePlaceholder: 'Ex: Marcos Contador',
    registrationLabel: 'CRC',
    registrationPlaceholder: 'Ex: CRC 1SP123456/O',
    registrationHint: 'Número do registro no CRC',
    showRegistration: true,
  },
  consultoria: {
    nameLabel: 'Nome do Consultor',
    namePlaceholder: 'Ex: Ricardo Estratégia',
    nameHint: 'Nome do consultor principal',
    showRegistration: false,
  },
  pet_shop_veterinario: {
    nameLabel: 'Nome do Veterinário',
    namePlaceholder: 'Ex: Dr. Caio Pets',
    registrationLabel: 'CRMV',
    registrationPlaceholder: 'Ex: CRMV-SP 12345',
    registrationHint: 'Registro no CRMV (obrigatório para veterinários)',
    showRegistration: true,
  },
  academia_personal: {
    nameLabel: 'Nome do Personal/Proprietário',
    namePlaceholder: 'Ex: Prof. Lucas Fitness',
    registrationLabel: 'CREF',
    registrationPlaceholder: 'Ex: CREF 012345-G/SP',
    registrationHint: 'Registro no CREF',
    showRegistration: true,
  },
  oficina_mecanica: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Seu João Mecânico',
    nameHint: 'Nome do mecânico ou proprietário',
    showRegistration: false,
  },
  limpeza_manutencao: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: Empresa Limpa Tudo',
    nameHint: 'Nome do gerente ou proprietário',
    showRegistration: false,
  },
  marketing_agencia: {
    nameLabel: 'Nome do Diretor',
    namePlaceholder: 'Ex: Carla Marketing',
    nameHint: 'Diretor de atendimento ou CEO',
    showRegistration: false,
  },
  cursos_educacao: {
    nameLabel: 'Nome do Coordenador',
    namePlaceholder: 'Ex: Prof. Ana Educadora',
    nameHint: 'Coordenador ou diretor pedagógico',
    showRegistration: false,
  },
  eventos: {
    nameLabel: 'Nome do Produtor',
    namePlaceholder: 'Ex: Marcos Eventos',
    nameHint: 'Produtor ou diretor de eventos',
    showRegistration: false,
  },
  fotografia: {
    nameLabel: 'Nome do Fotógrafo',
    namePlaceholder: 'Ex: Pedro Fotógrafo',
    nameHint: 'Fotógrafo principal ou estúdio',
    showRegistration: false,
  },
  tecnologia_ti: {
    nameLabel: 'Nome do Responsável',
    namePlaceholder: 'Ex: Rafael Tech',
    nameHint: 'CTO, desenvolvedor ou gerente de TI',
    showRegistration: false,
  },
  
  // ALIMENTAÇÃO - nenhum precisa de registro profissional
  restaurante: {
    nameLabel: 'Nome do Proprietário/Chef',
    namePlaceholder: 'Ex: Chef Antonio',
    nameHint: 'Nome do chef ou proprietário',
    showRegistration: false,
  },
  delivery: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Carlos Delivery',
    nameHint: 'Dono do negócio',
    showRegistration: false,
  },
  pizzaria: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Giovanni Pizza',
    nameHint: 'Dono ou pizzaiolo principal',
    showRegistration: false,
  },
  lanchonete: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Seu Zé Lanches',
    nameHint: 'Dono do estabelecimento',
    showRegistration: false,
  },
  cafeteria: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Barista João',
    nameHint: 'Dono ou barista principal',
    showRegistration: false,
  },
  confeitaria: {
    nameLabel: 'Nome do Confeiteiro(a)',
    namePlaceholder: 'Ex: Dona Maria Doces',
    nameHint: 'Confeiteiro(a) ou proprietário(a)',
    showRegistration: false,
  },
  food_truck: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Chefe do Truck',
    nameHint: 'Dono do food truck',
    showRegistration: false,
  },
  
  // VENDAS - nenhum precisa de registro profissional
  produtos_hospitalares: {
    nameLabel: 'Nome do Vendedor/Gerente',
    namePlaceholder: 'Ex: Carlos Vendas',
    nameHint: 'Responsável pelas vendas',
    showRegistration: false,
  },
  celulares_eletronicos: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Tech Carlos',
    nameHint: 'Dono ou gerente da loja',
    showRegistration: false,
  },
  roupas_moda: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Ana Fashion',
    nameHint: 'Dono(a) da loja',
    showRegistration: false,
  },
  joias_acessorios: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Maria Joias',
    nameHint: 'Dono(a) da joalheria',
    showRegistration: false,
  },
  cosmeticos: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Beleza Total',
    nameHint: 'Dono(a) ou consultor(a) de beleza',
    showRegistration: false,
  },
  suplementos: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Fitness Store',
    nameHint: 'Dono ou vendedor especializado',
    showRegistration: false,
  },
  moveis_decoracao: {
    nameLabel: 'Nome do Proprietário',
    namePlaceholder: 'Ex: Casa & Design',
    nameHint: 'Dono ou designer responsável',
    showRegistration: false,
  },
};

// ============= SERVIÇOS POR SUBNICHO =============

export const SERVICES_BY_SUBNICHO: Record<SubnichoType, Service[]> = {
  // SAÚDE
  clinica_medica: [
    { id: 'consulta_geral', name: 'Consulta Médica', description: 'Consulta clínica geral', enabled: false },
    { id: 'retorno', name: 'Retorno', description: 'Consulta de retorno', enabled: false },
    { id: 'exames', name: 'Exames', description: 'Solicitação e análise de exames', enabled: false },
    { id: 'atestado', name: 'Atestados', description: 'Emissão de atestados médicos', enabled: false },
    { id: 'receita', name: 'Receitas', description: 'Prescrição de medicamentos', enabled: false },
  ],
  hospital: [
    { id: 'emergencia', name: 'Emergência', description: 'Atendimento de urgência', enabled: false },
    { id: 'internacao', name: 'Internação', description: 'Internação hospitalar', enabled: false },
    { id: 'cirurgia', name: 'Cirurgias', description: 'Procedimentos cirúrgicos', enabled: false },
    { id: 'exames', name: 'Exames', description: 'Exames laboratoriais e imagem', enabled: false },
  ],
  dentista: [
    { id: 'limpeza', name: 'Limpeza Dental', description: 'Profilaxia e higienização', enabled: false },
    { id: 'clareamento', name: 'Clareamento', description: 'Clareamento dental', enabled: false },
    { id: 'implante', name: 'Implante Dentário', description: 'Implantes e próteses', enabled: false },
    { id: 'canal', name: 'Tratamento de Canal', description: 'Endodontia', enabled: false },
    { id: 'ortodontia', name: 'Ortodontia', description: 'Aparelhos e alinhadores', enabled: false },
    { id: 'restauracao', name: 'Restauração', description: 'Restaurações e obturações', enabled: false },
    { id: 'extracao', name: 'Extração', description: 'Extração dental', enabled: false },
  ],
  fisioterapia: [
    { id: 'avaliacao', name: 'Avaliação Fisioterapêutica', description: 'Primeira consulta e avaliação', enabled: false },
    { id: 'ortopedica', name: 'Fisioterapia Ortopédica', description: 'Tratamento muscular e articular', enabled: false },
    { id: 'neurologica', name: 'Fisioterapia Neurológica', description: 'Reabilitação neurológica', enabled: false },
    { id: 'respiratoria', name: 'Fisioterapia Respiratória', description: 'Tratamento pulmonar', enabled: false },
    { id: 'pilates', name: 'Pilates', description: 'Aulas de pilates', enabled: false },
  ],
  psicologia: [
    { id: 'terapia_individual', name: 'Terapia Individual', description: 'Atendimento psicológico individual', enabled: false },
    { id: 'terapia_casal', name: 'Terapia de Casal', description: 'Atendimento para casais', enabled: false },
    { id: 'terapia_familia', name: 'Terapia Familiar', description: 'Atendimento para famílias', enabled: false },
    { id: 'avaliacao', name: 'Avaliação Psicológica', description: 'Testes e avaliações', enabled: false },
  ],
  nutricao: [
    { id: 'consulta', name: 'Consulta Nutricional', description: 'Avaliação e orientação alimentar', enabled: false },
    { id: 'plano_alimentar', name: 'Plano Alimentar', description: 'Dieta personalizada', enabled: false },
    { id: 'retorno', name: 'Retorno', description: 'Acompanhamento mensal', enabled: false },
    { id: 'esportiva', name: 'Nutrição Esportiva', description: 'Nutrição para atletas', enabled: false },
  ],
  laboratorio: [
    { id: 'coleta', name: 'Coleta de Exames', description: 'Coleta de sangue e materiais', enabled: false },
    { id: 'resultado', name: 'Resultados', description: 'Entrega de resultados', enabled: false },
    { id: 'domicilio', name: 'Coleta Domiciliar', description: 'Coleta em casa', enabled: false },
  ],
  farmacia: [
    { id: 'medicamentos', name: 'Medicamentos', description: 'Venda de medicamentos', enabled: false },
    { id: 'manipulados', name: 'Manipulados', description: 'Medicamentos manipulados', enabled: false },
    { id: 'dermocosmeticos', name: 'Dermocosméticos', description: 'Produtos de beleza', enabled: false },
    { id: 'vacinas', name: 'Vacinas', description: 'Aplicação de vacinas', enabled: false },
  ],
  
  // ESTÉTICA
  transplante_capilar: [
    { id: 'cabelo', name: 'Transplante Capilar (Cabelo)', description: 'Técnicas: FUE, FUT, DHI', enabled: false },
    { id: 'barba', name: 'Transplante de Barba', description: 'Preenche falhas e aumenta densidade', enabled: false },
    { id: 'sobrancelha', name: 'Transplante de Sobrancelha', description: 'Correção de falhas e redesenho', enabled: false },
    { id: 'tratamento', name: 'Tratamento Capilar', description: 'PRP, Laser, Microagulhamento', enabled: false },
  ],
  clinica_estetica: [
    { id: 'botox', name: 'Botox', description: 'Toxina botulínica', enabled: false },
    { id: 'preenchimento', name: 'Preenchimento', description: 'Ácido hialurônico', enabled: false },
    { id: 'bioestimuladores', name: 'Bioestimuladores', description: 'Sculptra, Radiesse', enabled: false },
    { id: 'peeling', name: 'Peeling', description: 'Peeling químico e físico', enabled: false },
    { id: 'laser', name: 'Tratamentos a Laser', description: 'Rejuvenescimento, manchas', enabled: false },
    { id: 'criolipolise', name: 'Criolipólise', description: 'Redução de gordura localizada', enabled: false },
  ],
  salao_beleza: [
    { id: 'corte', name: 'Corte de Cabelo', description: 'Corte feminino e masculino', enabled: false },
    { id: 'coloracao', name: 'Coloração', description: 'Tintura e mechas', enabled: false },
    { id: 'escova', name: 'Escova', description: 'Escova e penteados', enabled: false },
    { id: 'manicure', name: 'Manicure/Pedicure', description: 'Unhas e esmaltação', enabled: false },
    { id: 'maquiagem', name: 'Maquiagem', description: 'Maquiagem profissional', enabled: false },
    { id: 'tratamentos', name: 'Tratamentos Capilares', description: 'Hidratação, reconstrução', enabled: false },
  ],
  barbearia: [
    { id: 'corte', name: 'Corte Masculino', description: 'Corte de cabelo', enabled: false },
    { id: 'barba', name: 'Barba', description: 'Aparar e desenhar barba', enabled: false },
    { id: 'combo', name: 'Combo Completo', description: 'Cabelo + barba', enabled: false },
    { id: 'sobrancelha', name: 'Sobrancelha', description: 'Design de sobrancelha', enabled: false },
    { id: 'pigmentacao', name: 'Pigmentação', description: 'Pigmentação capilar', enabled: false },
  ],
  spa: [
    { id: 'massagem', name: 'Massagem Relaxante', description: 'Massagem terapêutica', enabled: false },
    { id: 'day_spa', name: 'Day Spa', description: 'Pacote completo de relaxamento', enabled: false },
    { id: 'facial', name: 'Tratamento Facial', description: 'Limpeza de pele e hidratação', enabled: false },
    { id: 'corporal', name: 'Tratamento Corporal', description: 'Esfoliação e hidratação', enabled: false },
  ],
  micropigmentacao: [
    { id: 'sobrancelha', name: 'Micropigmentação de Sobrancelha', description: 'Fio a fio, shadow', enabled: false },
    { id: 'labios', name: 'Micropigmentação Labial', description: 'Contorno e preenchimento', enabled: false },
    { id: 'olhos', name: 'Micropigmentação de Olhos', description: 'Delineado permanente', enabled: false },
    { id: 'capilar', name: 'Micropigmentação Capilar', description: 'Simulação de cabelo', enabled: false },
  ],
  depilacao: [
    { id: 'laser', name: 'Depilação a Laser', description: 'Depilação definitiva', enabled: false },
    { id: 'cera', name: 'Depilação com Cera', description: 'Cera quente e fria', enabled: false },
    { id: 'pacote', name: 'Pacote Corpo Todo', description: 'Depilação completa', enabled: false },
  ],
  
  // VENDAS
  produtos_hospitalares: [
    { id: 'equipamentos', name: 'Equipamentos Médicos', description: 'Venda e locação', enabled: false },
    { id: 'insumos', name: 'Insumos', description: 'Materiais descartáveis', enabled: false },
    { id: 'ortopedicos', name: 'Produtos Ortopédicos', description: 'Órteses e próteses', enabled: false },
    { id: 'manutencao', name: 'Manutenção', description: 'Manutenção de equipamentos', enabled: false },
  ],
  celulares_eletronicos: [
    { id: 'smartphones', name: 'Smartphones', description: 'iPhones e Android', enabled: false },
    { id: 'acessorios', name: 'Acessórios', description: 'Capas, películas, carregadores', enabled: false },
    { id: 'assistencia', name: 'Assistência Técnica', description: 'Reparo de dispositivos', enabled: false },
    { id: 'usados', name: 'Seminovos', description: 'Produtos usados garantidos', enabled: false },
  ],
  roupas_moda: [
    { id: 'feminino', name: 'Moda Feminina', description: 'Roupas e acessórios', enabled: false },
    { id: 'masculino', name: 'Moda Masculina', description: 'Roupas e acessórios', enabled: false },
    { id: 'infantil', name: 'Moda Infantil', description: 'Roupas para crianças', enabled: false },
    { id: 'calcados', name: 'Calçados', description: 'Sapatos e tênis', enabled: false },
  ],
  joias_acessorios: [
    { id: 'joias', name: 'Joias', description: 'Anéis, brincos, colares', enabled: false },
    { id: 'relogios', name: 'Relógios', description: 'Relógios de pulso', enabled: false },
    { id: 'semi_joias', name: 'Semi-joias', description: 'Peças folheadas', enabled: false },
    { id: 'personalizados', name: 'Personalizados', description: 'Gravação e customização', enabled: false },
  ],
  cosmeticos: [
    { id: 'skincare', name: 'Skincare', description: 'Cuidados com a pele', enabled: false },
    { id: 'maquiagem', name: 'Maquiagem', description: 'Produtos de beleza', enabled: false },
    { id: 'cabelos', name: 'Cabelos', description: 'Tratamentos capilares', enabled: false },
    { id: 'perfumaria', name: 'Perfumaria', description: 'Perfumes e fragrâncias', enabled: false },
  ],
  suplementos: [
    { id: 'whey', name: 'Whey Protein', description: 'Proteínas em pó', enabled: false },
    { id: 'vitaminas', name: 'Vitaminas', description: 'Suplementação vitamínica', enabled: false },
    { id: 'pre_treino', name: 'Pré-Treino', description: 'Energia e performance', enabled: false },
    { id: 'emagrecimento', name: 'Emagrecimento', description: 'Termogênicos e fat burners', enabled: false },
  ],
  moveis_decoracao: [
    { id: 'moveis', name: 'Móveis', description: 'Sofás, mesas, cadeiras', enabled: false },
    { id: 'decoracao', name: 'Decoração', description: 'Itens decorativos', enabled: false },
    { id: 'iluminacao', name: 'Iluminação', description: 'Luminárias e lustres', enabled: false },
    { id: 'planejados', name: 'Móveis Planejados', description: 'Projetos sob medida', enabled: false },
  ],
  
  // IMOBILIÁRIO
  agente_imobiliario: [
    { id: 'venda', name: 'Venda de Imóveis', description: 'Casas, apartamentos, terrenos', enabled: false },
    { id: 'locacao', name: 'Locação', description: 'Aluguel residencial e comercial', enabled: false },
    { id: 'avaliacao', name: 'Avaliação', description: 'Avaliação de imóveis', enabled: false },
    { id: 'consultoria', name: 'Consultoria', description: 'Assessoria imobiliária', enabled: false },
    { id: 'financiamento', name: 'Financiamento', description: 'Auxílio em financiamentos', enabled: false },
  ],
  imobiliaria: [
    { id: 'venda', name: 'Venda', description: 'Compra e venda de imóveis', enabled: false },
    { id: 'locacao', name: 'Locação', description: 'Aluguel e administração', enabled: false },
    { id: 'lancamentos', name: 'Lançamentos', description: 'Imóveis na planta', enabled: false },
    { id: 'comercial', name: 'Comercial', description: 'Imóveis comerciais', enabled: false },
  ],
  construtora: [
    { id: 'residencial', name: 'Residencial', description: 'Casas e apartamentos', enabled: false },
    { id: 'comercial', name: 'Comercial', description: 'Prédios comerciais', enabled: false },
    { id: 'reforma', name: 'Reformas', description: 'Reformas e ampliações', enabled: false },
    { id: 'projeto', name: 'Projetos', description: 'Elaboração de projetos', enabled: false },
  ],
  administradora: [
    { id: 'condominio', name: 'Administração de Condomínio', description: 'Gestão condominial', enabled: false },
    { id: 'locacao', name: 'Administração de Locação', description: 'Gestão de aluguéis', enabled: false },
    { id: 'cobranca', name: 'Cobrança', description: 'Cobrança de inadimplentes', enabled: false },
    { id: 'manutencao', name: 'Manutenção', description: 'Manutenção predial', enabled: false },
  ],
  
  // ALIMENTAÇÃO
  restaurante: [
    { id: 'almoco', name: 'Almoço', description: 'Refeições no almoço', enabled: false },
    { id: 'jantar', name: 'Jantar', description: 'Refeições à noite', enabled: false },
    { id: 'reserva', name: 'Reservas', description: 'Reserva de mesas', enabled: false },
    { id: 'eventos', name: 'Eventos', description: 'Eventos e confraternizações', enabled: false },
  ],
  delivery: [
    { id: 'pedido', name: 'Fazer Pedido', description: 'Pedidos para entrega', enabled: false },
    { id: 'cardapio', name: 'Cardápio', description: 'Ver opções disponíveis', enabled: false },
    { id: 'rastreio', name: 'Rastrear Pedido', description: 'Acompanhar entrega', enabled: false },
    { id: 'combo', name: 'Combos', description: 'Ofertas especiais', enabled: false },
  ],
  lanchonete: [
    { id: 'lanches', name: 'Lanches', description: 'Hambúrgueres, hot dogs', enabled: false },
    { id: 'porcoes', name: 'Porções', description: 'Batatas, nuggets', enabled: false },
    { id: 'bebidas', name: 'Bebidas', description: 'Refrigerantes, sucos', enabled: false },
    { id: 'delivery', name: 'Delivery', description: 'Entrega em casa', enabled: false },
  ],
  pizzaria: [
    { id: 'cardapio', name: 'Cardápio', description: 'Pizzas e sabores', enabled: false },
    { id: 'delivery', name: 'Delivery', description: 'Entrega de pizzas', enabled: false },
    { id: 'rodizio', name: 'Rodízio', description: 'Rodízio de pizzas', enabled: false },
    { id: 'reserva', name: 'Reserva', description: 'Reservar mesa', enabled: false },
  ],
  cafeteria: [
    { id: 'cafe', name: 'Cafés', description: 'Espresso, cappuccino, latte', enabled: false },
    { id: 'doces', name: 'Doces', description: 'Bolos e sobremesas', enabled: false },
    { id: 'salgados', name: 'Salgados', description: 'Pães de queijo, croissants', enabled: false },
    { id: 'especiais', name: 'Bebidas Especiais', description: 'Drinks e frappés', enabled: false },
  ],
  confeitaria: [
    { id: 'bolos', name: 'Bolos', description: 'Bolos decorados', enabled: false },
    { id: 'doces_festa', name: 'Doces para Festa', description: 'Brigadeiros, beijinhos', enabled: false },
    { id: 'encomendas', name: 'Encomendas', description: 'Encomendas especiais', enabled: false },
    { id: 'tortas', name: 'Tortas', description: 'Tortas doces e salgadas', enabled: false },
  ],
  food_truck: [
    { id: 'cardapio', name: 'Cardápio do Dia', description: 'Ver opções disponíveis', enabled: false },
    { id: 'localizacao', name: 'Localização', description: 'Onde estamos hoje', enabled: false },
    { id: 'eventos', name: 'Eventos', description: 'Contratação para eventos', enabled: false },
  ],
  
  // SERVIÇOS
  advocacia: [
    { id: 'consulta', name: 'Consulta Jurídica', description: 'Orientação inicial', enabled: false },
    { id: 'trabalhista', name: 'Direito Trabalhista', description: 'Ações trabalhistas', enabled: false },
    { id: 'civil', name: 'Direito Civil', description: 'Contratos, família, consumidor', enabled: false },
    { id: 'criminal', name: 'Direito Criminal', description: 'Defesa criminal', enabled: false },
    { id: 'empresarial', name: 'Direito Empresarial', description: 'Contratos e societário', enabled: false },
  ],
  contabilidade: [
    { id: 'abertura', name: 'Abertura de Empresa', description: 'Constituição de CNPJ', enabled: false },
    { id: 'mensal', name: 'Contabilidade Mensal', description: 'Escrituração e impostos', enabled: false },
    { id: 'irpf', name: 'Imposto de Renda PF', description: 'Declaração anual', enabled: false },
    { id: 'consultoria', name: 'Consultoria Fiscal', description: 'Planejamento tributário', enabled: false },
  ],
  consultoria: [
    { id: 'diagnostico', name: 'Diagnóstico Empresarial', description: 'Análise da empresa', enabled: false },
    { id: 'planejamento', name: 'Planejamento Estratégico', description: 'Definição de metas', enabled: false },
    { id: 'processos', name: 'Melhoria de Processos', description: 'Otimização operacional', enabled: false },
    { id: 'mentoria', name: 'Mentoria', description: 'Acompanhamento individual', enabled: false },
  ],
  academia_personal: [
    { id: 'avaliacao', name: 'Avaliação Física', description: 'Avaliação inicial', enabled: false },
    { id: 'treino', name: 'Treino Personalizado', description: 'Planilha de treino', enabled: false },
    { id: 'mensal', name: 'Plano Mensal', description: 'Acesso à academia', enabled: false },
    { id: 'personal', name: 'Personal Trainer', description: 'Acompanhamento individual', enabled: false },
  ],
  oficina_mecanica: [
    { id: 'revisao', name: 'Revisão Geral', description: 'Check-up completo', enabled: false },
    { id: 'oleo', name: 'Troca de Óleo', description: 'Óleo e filtros', enabled: false },
    { id: 'freios', name: 'Freios', description: 'Pastilhas e discos', enabled: false },
    { id: 'eletrica', name: 'Parte Elétrica', description: 'Bateria, alternador', enabled: false },
    { id: 'ar', name: 'Ar Condicionado', description: 'Manutenção do A/C', enabled: false },
  ],
  pet_shop_veterinario: [
    { id: 'consulta_vet', name: 'Consulta Veterinária', description: 'Atendimento clínico', enabled: false },
    { id: 'vacinas', name: 'Vacinas', description: 'Vacinação e vermifugação', enabled: false },
    { id: 'banho_tosa', name: 'Banho e Tosa', description: 'Higiene e estética', enabled: false },
    { id: 'racao', name: 'Ração e Produtos', description: 'Alimentação e acessórios', enabled: false },
    { id: 'hotel', name: 'Hotel Pet', description: 'Hospedagem', enabled: false },
  ],
  limpeza_manutencao: [
    { id: 'limpeza_residencial', name: 'Limpeza Residencial', description: 'Faxina em casas', enabled: false },
    { id: 'limpeza_comercial', name: 'Limpeza Comercial', description: 'Empresas e escritórios', enabled: false },
    { id: 'manutencao', name: 'Manutenção Geral', description: 'Reparos e consertos', enabled: false },
    { id: 'eletrica', name: 'Serviços Elétricos', description: 'Instalações elétricas', enabled: false },
    { id: 'hidraulica', name: 'Serviços Hidráulicos', description: 'Encanamento', enabled: false },
  ],
  marketing_agencia: [
    { id: 'social_media', name: 'Social Media', description: 'Gestão de redes sociais', enabled: false },
    { id: 'trafego', name: 'Tráfego Pago', description: 'Google Ads, Facebook Ads', enabled: false },
    { id: 'design', name: 'Design Gráfico', description: 'Artes e materiais', enabled: false },
    { id: 'site', name: 'Criação de Sites', description: 'Desenvolvimento web', enabled: false },
    { id: 'branding', name: 'Branding', description: 'Identidade visual', enabled: false },
  ],
  cursos_educacao: [
    { id: 'matricula', name: 'Matrícula', description: 'Informações e inscrição', enabled: false },
    { id: 'cursos', name: 'Cursos Disponíveis', description: 'Grade de cursos', enabled: false },
    { id: 'horarios', name: 'Horários', description: 'Horários das turmas', enabled: false },
    { id: 'valores', name: 'Valores', description: 'Mensalidades e pacotes', enabled: false },
  ],
  eventos: [
    { id: 'orcamento', name: 'Orçamento', description: 'Solicitar orçamento', enabled: false },
    { id: 'casamento', name: 'Casamentos', description: 'Organização de casamentos', enabled: false },
    { id: 'corporativo', name: 'Eventos Corporativos', description: 'Empresas e convenções', enabled: false },
    { id: 'festas', name: 'Festas', description: 'Aniversários e celebrações', enabled: false },
  ],
  fotografia: [
    { id: 'ensaio', name: 'Ensaio Fotográfico', description: 'Books e retratos', enabled: false },
    { id: 'casamento', name: 'Casamentos', description: 'Cobertura de casamentos', enabled: false },
    { id: 'produto', name: 'Fotografia de Produto', description: 'E-commerce e catálogos', enabled: false },
    { id: 'corporativo', name: 'Corporativo', description: 'Fotos profissionais', enabled: false },
  ],
  tecnologia_ti: [
    { id: 'suporte', name: 'Suporte Técnico', description: 'Atendimento e manutenção', enabled: false },
    { id: 'desenvolvimento', name: 'Desenvolvimento', description: 'Software e aplicativos', enabled: false },
    { id: 'infraestrutura', name: 'Infraestrutura', description: 'Redes e servidores', enabled: false },
    { id: 'consultoria', name: 'Consultoria TI', description: 'Análise e projetos', enabled: false },
  ],
  
  // OUTROS
  personalizado: [
    { id: 'servico_1', name: 'Serviço 1', description: 'Descreva seu serviço', enabled: false },
    { id: 'servico_2', name: 'Serviço 2', description: 'Descreva seu serviço', enabled: false },
    { id: 'servico_3', name: 'Serviço 3', description: 'Descreva seu serviço', enabled: false },
  ],
};

// ============= HELPER FUNCTIONS =============

/**
 * Retorna a configuração de campos do profissional baseado no nicho/subnicho
 */
export function getProfessionalFieldConfig(nicho: NichoType | null, subnicho: SubnichoType | null): ProfessionalFieldConfig {
  const defaultConfig = PROFESSIONAL_FIELDS.outros;
  
  if (!nicho) return defaultConfig;
  
  const nichoConfig = PROFESSIONAL_FIELDS[nicho];
  
  // Aplicar override do subnicho se existir
  if (subnicho && SUBNICHO_PROFESSIONAL_OVERRIDES[subnicho]) {
    return {
      ...nichoConfig,
      ...SUBNICHO_PROFESSIONAL_OVERRIDES[subnicho],
    };
  }
  
  return nichoConfig;
}

/**
 * Retorna a lista de serviços para um subnicho
 */
export function getServicesForSubnicho(subnicho: SubnichoType | null): Service[] {
  if (!subnicho) return SERVICES_BY_SUBNICHO.personalizado;
  return SERVICES_BY_SUBNICHO[subnicho] || SERVICES_BY_SUBNICHO.personalizado;
}

/**
 * Retorna o nome amigável do nicho
 */
export function getNichoDisplayName(nicho: NichoType): string {
  const names: Record<NichoType, string> = {
    saude: 'Saúde',
    estetica: 'Estética',
    vendas: 'Vendas',
    imobiliario: 'Imobiliário',
    alimentacao: 'Alimentação',
    servicos: 'Serviços',
    outros: 'Outros',
  };
  return names[nicho] || nicho;
}

/**
 * Retorna a terminologia correta para o nicho
 */
export function getNichoTerminology(nicho: NichoType | null): {
  cliente: string;
  empresa: string;
  profissional: string;
} {
  switch (nicho) {
    case 'saude':
      return { cliente: 'paciente', empresa: 'clínica', profissional: 'profissional de saúde' };
    case 'estetica':
      return { cliente: 'cliente', empresa: 'clínica/salão', profissional: 'profissional' };
    case 'vendas':
      return { cliente: 'cliente', empresa: 'loja', profissional: 'vendedor' };
    case 'imobiliario':
      return { cliente: 'cliente', empresa: 'imobiliária', profissional: 'corretor' };
    case 'alimentacao':
      return { cliente: 'cliente', empresa: 'estabelecimento', profissional: 'atendente' };
    case 'servicos':
      return { cliente: 'cliente', empresa: 'empresa', profissional: 'profissional' };
    default:
      return { cliente: 'cliente', empresa: 'empresa', profissional: 'responsável' };
  }
}

// ============= CONFIGURAÇÕES DE TIPO DE ATENDIMENTO =============

export interface ConsultationFieldConfig {
  stepTitle: string;
  stepSubtitle: string;
  presencialLabel: string;
  presencialDescription: string;
  onlineLabel: string;
  onlineDescription: string;
  domicilioLabel: string;
  domicilioDescription: string;
  showDomicilio: boolean;
  showOnline: boolean;
  locationLabel: string;
}

export const CONSULTATION_FIELDS: Record<NichoType, ConsultationFieldConfig> = {
  saude: {
    stepTitle: 'Como você atende seus pacientes?',
    stepSubtitle: 'Você pode oferecer várias modalidades',
    presencialLabel: 'Consulta Presencial',
    presencialDescription: 'Pacientes vão até sua clínica',
    onlineLabel: 'Teleconsulta',
    onlineDescription: 'Atenda pacientes de qualquer lugar',
    domicilioLabel: 'Atendimento Domiciliar',
    domicilioDescription: 'Você vai até a casa do paciente',
    showDomicilio: true,
    showOnline: true,
    locationLabel: 'Local',
  },
  estetica: {
    stepTitle: 'Como você atende seus clientes?',
    stepSubtitle: 'Você pode oferecer várias modalidades',
    presencialLabel: 'Atendimento Presencial',
    presencialDescription: 'Clientes vão até seu estabelecimento',
    onlineLabel: 'Consultoria Online',
    onlineDescription: 'Orientações e avaliações virtuais',
    domicilioLabel: 'Atendimento a Domicílio',
    domicilioDescription: 'Você vai até a casa do cliente',
    showDomicilio: true,
    showOnline: true,
    locationLabel: 'Local',
  },
  vendas: {
    stepTitle: 'Como você atende seus clientes?',
    stepSubtitle: 'Selecione os canais de atendimento',
    presencialLabel: 'Loja Física',
    presencialDescription: 'Clientes visitam sua loja',
    onlineLabel: 'Vendas Online',
    onlineDescription: 'Atendimento por chat, WhatsApp ou e-commerce',
    domicilioLabel: 'Entrega/Visita',
    domicilioDescription: 'Você leva os produtos até o cliente',
    showDomicilio: true,
    showOnline: true,
    locationLabel: 'Endereço',
  },
  imobiliario: {
    stepTitle: 'Como você atende seus clientes?',
    stepSubtitle: 'Selecione as modalidades de atendimento',
    presencialLabel: 'Atendimento no Escritório',
    presencialDescription: 'Clientes vão até sua imobiliária',
    onlineLabel: 'Atendimento Online',
    onlineDescription: 'Reuniões virtuais e tour 360°',
    domicilioLabel: 'Visita ao Imóvel',
    domicilioDescription: 'Você acompanha o cliente na visita',
    showDomicilio: true,
    showOnline: true,
    locationLabel: 'Escritório',
  },
  alimentacao: {
    stepTitle: 'Como você atende seus clientes?',
    stepSubtitle: 'Selecione as modalidades de atendimento',
    presencialLabel: 'Atendimento no Local',
    presencialDescription: 'Clientes consomem no estabelecimento',
    onlineLabel: 'Pedidos Online',
    onlineDescription: 'Pedidos por app, WhatsApp ou site',
    domicilioLabel: 'Delivery',
    domicilioDescription: 'Entrega na casa do cliente',
    showDomicilio: true,
    showOnline: true,
    locationLabel: 'Endereço',
  },
  servicos: {
    stepTitle: 'Como você atende seus clientes?',
    stepSubtitle: 'Selecione as modalidades de atendimento',
    presencialLabel: 'Atendimento Presencial',
    presencialDescription: 'Clientes vão até seu escritório',
    onlineLabel: 'Atendimento Online',
    onlineDescription: 'Reuniões virtuais e chamadas de vídeo',
    domicilioLabel: 'Atendimento Externo',
    domicilioDescription: 'Você vai até o cliente',
    showDomicilio: true,
    showOnline: true,
    locationLabel: 'Escritório',
  },
  outros: {
    stepTitle: 'Como você atende seus clientes?',
    stepSubtitle: 'Selecione as modalidades de atendimento',
    presencialLabel: 'Atendimento Presencial',
    presencialDescription: 'Clientes vão até você',
    onlineLabel: 'Atendimento Online',
    onlineDescription: 'Atendimento remoto',
    domicilioLabel: 'Atendimento a Domicílio',
    domicilioDescription: 'Você vai até o cliente',
    showDomicilio: true,
    showOnline: true,
    locationLabel: 'Local',
  },
};

// Configurações específicas por subnicho (override do nicho para atendimento)
export const SUBNICHO_CONSULTATION_OVERRIDES: Partial<Record<SubnichoType, Partial<ConsultationFieldConfig>>> = {
  // Saúde
  laboratorio: { showDomicilio: true, domicilioLabel: 'Coleta Domiciliar', domicilioDescription: 'Coleta de exames em casa' },
  farmacia: { showDomicilio: true, domicilioLabel: 'Entrega em Domicílio', domicilioDescription: 'Entrega de medicamentos' },
  fisioterapia: { domicilioLabel: 'Fisioterapia Domiciliar', domicilioDescription: 'Sessões na casa do paciente' },
  
  // Estética
  salao_beleza: { showOnline: false, domicilioLabel: 'Atendimento a Domicílio', domicilioDescription: 'Serviços na casa da cliente' },
  barbearia: { showOnline: false, domicilioLabel: 'Atendimento a Domicílio', domicilioDescription: 'Corte na casa do cliente' },
  micropigmentacao: { showOnline: false },
  depilacao: { showOnline: false },
  
  // Vendas
  celulares_eletronicos: { showDomicilio: false },
  roupas_moda: { showDomicilio: false },
  joias_acessorios: { showDomicilio: false },
  
  // Alimentação
  restaurante: { domicilioLabel: 'Delivery', domicilioDescription: 'Entrega de refeições' },
  pizzaria: { domicilioLabel: 'Delivery', domicilioDescription: 'Entrega de pizzas' },
  lanchonete: { domicilioLabel: 'Delivery', domicilioDescription: 'Entrega de lanches' },
  cafeteria: { showDomicilio: false },
  food_truck: { showDomicilio: false, presencialLabel: 'Atendimento no Truck', presencialDescription: 'Clientes vão até o food truck' },
  confeitaria: { domicilioLabel: 'Entrega de Encomendas', domicilioDescription: 'Entrega de bolos e doces' },
  
  // Serviços
  advocacia: { domicilioLabel: 'Atendimento Externo', domicilioDescription: 'Reuniões no local do cliente' },
  contabilidade: { domicilioLabel: 'Visita ao Cliente', domicilioDescription: 'Reuniões no escritório do cliente' },
  academia_personal: { showDomicilio: true, domicilioLabel: 'Treino a Domicílio', domicilioDescription: 'Treino na casa do aluno', presencialLabel: 'Treino na Academia' },
  pet_shop_veterinario: { domicilioLabel: 'Atendimento Domiciliar', domicilioDescription: 'Consulta veterinária em casa ou busca do pet' },
  fotografia: { domicilioLabel: 'Ensaio Externo', domicilioDescription: 'Fotos no local escolhido pelo cliente' },
};

/**
 * Retorna a configuração de campos de atendimento para um nicho/subnicho
 */
export function getConsultationFieldConfig(nicho: NichoType | null, subnicho: SubnichoType | null): ConsultationFieldConfig {
  const baseConfig = CONSULTATION_FIELDS[nicho || 'outros'];
  const override = subnicho ? SUBNICHO_CONSULTATION_OVERRIDES[subnicho] : undefined;
  return { ...baseConfig, ...override };
}

// ============= CONFIGURAÇÃO DE ETAPAS POR NICHO =============

/**
 * Define quais nichos/subnichos devem mostrar a etapa de fotos antes/depois
 * Por padrão, apenas saúde e estética fazem sentido para esse tipo de conteúdo
 */
export const NICHOS_WITH_BEFORE_AFTER: NichoType[] = ['saude', 'estetica'];

/**
 * Subnichos específicos que NÃO devem mostrar antes/depois mesmo sendo de saúde/estética
 */
export const SUBNICHOS_WITHOUT_BEFORE_AFTER: SubnichoType[] = [
  'farmacia',
  'laboratorio',
];

/**
 * Subnichos de outros nichos que DEVEM mostrar antes/depois (exceções)
 */
export const SUBNICHOS_WITH_BEFORE_AFTER: SubnichoType[] = [
  'academia_personal', // Personal trainers podem mostrar transformações de clientes
];

/**
 * Verifica se o nicho/subnicho deve exibir a etapa de fotos antes/depois
 */
export function shouldShowBeforeAfterStep(nicho: NichoType | null, subnicho: SubnichoType | null): boolean {
  // Se tem um subnicho específico que deve mostrar, retorna true
  if (subnicho && SUBNICHOS_WITH_BEFORE_AFTER.includes(subnicho)) {
    return true;
  }
  
  // Se tem um subnicho específico que não deve mostrar, retorna false
  if (subnicho && SUBNICHOS_WITHOUT_BEFORE_AFTER.includes(subnicho)) {
    return false;
  }
  
  // Caso contrário, verifica se o nicho está na lista de nichos que mostram
  if (nicho && NICHOS_WITH_BEFORE_AFTER.includes(nicho)) {
    return true;
  }
  
  return false;
}

// ============= PROMPT TEMPLATES POR NICHO =============

export interface PromptTemplate {
  systemPromptIntro: string;
  objectives: string[];
  personality: string;
  restrictions: string[];
  exampleResponses: string[];
}

/**
 * Templates de prompt base por nicho para a IA
 */
export const PROMPT_TEMPLATES: Record<NichoType, PromptTemplate> = {
  saude: {
    systemPromptIntro: 'Você é {attendantName}, assistente virtual da {companyName}, uma clínica de saúde.',
    objectives: [
      'Agendar consultas e exames',
      'Informar sobre serviços e especialidades',
      'Tirar dúvidas sobre procedimentos',
      'Coletar informações do paciente para pré-atendimento',
    ],
    personality: 'Seja acolhedor, empático e transmita confiança. Use linguagem acessível para explicar termos médicos.',
    restrictions: [
      'NUNCA dê diagnósticos ou prescrições médicas',
      'Sempre recomende consulta presencial para avaliação',
      'Não prometa resultados de tratamentos',
    ],
    exampleResponses: [
      'Olá! Sou a {attendantName}, assistente virtual da {companyName}. Como posso ajudar você hoje?',
      'Entendo sua preocupação. O Dr. {professionalName} poderá avaliar isso na consulta. Gostaria de agendar um horário?',
    ],
  },
  estetica: {
    systemPromptIntro: 'Você é {attendantName}, assistente virtual da {companyName}, especializada em procedimentos estéticos.',
    objectives: [
      'Agendar avaliações e procedimentos',
      'Apresentar os serviços e técnicas disponíveis',
      'Quebrar objeções sobre preço e segurança',
      'Qualificar o interesse do cliente',
    ],
    personality: 'Seja entusiasmado, profissional e inspirador. Destaque os benefícios e a autoestima.',
    restrictions: [
      'Não prometa resultados específicos antes da avaliação',
      'Valores detalhados apenas após avaliação presencial',
      'Sempre mencione a segurança dos procedimentos',
    ],
    exampleResponses: [
      'Olá! Sou a {attendantName} da {companyName}! 💜 Vou te ajudar a tirar todas as dúvidas sobre nossos procedimentos.',
      'Entendo sua preocupação! O procedimento é seguro e realizado pelo {professionalName}. Que tal agendar uma avaliação gratuita?',
    ],
  },
  vendas: {
    systemPromptIntro: 'Você é {attendantName}, assistente de vendas da {companyName}.',
    objectives: [
      'Apresentar produtos e catálogo',
      'Informar preços e condições de pagamento',
      'Ajudar na escolha do produto ideal',
      'Finalizar vendas e pedidos',
    ],
    personality: 'Seja prestativo, conhecedor dos produtos e focado em ajudar o cliente a encontrar o que precisa.',
    restrictions: [
      'Verifique disponibilidade antes de confirmar',
      'Seja transparente sobre prazos de entrega',
      'Não pressione excessivamente para compra',
    ],
    exampleResponses: [
      'Olá! 👋 Bem-vindo à {companyName}! Posso te ajudar a encontrar o produto perfeito!',
      'Esse modelo está disponível! Aceito PIX, cartão em até 12x ou boleto. Qual prefere?',
    ],
  },
  imobiliario: {
    systemPromptIntro: 'Você é {attendantName}, assistente imobiliário da {companyName}.',
    objectives: [
      'Apresentar imóveis disponíveis',
      'Agendar visitas',
      'Coletar perfil do cliente (orçamento, localização, tipo)',
      'Informar sobre financiamento e documentação',
    ],
    personality: 'Seja consultivo, paciente e demonstre conhecimento do mercado local.',
    restrictions: [
      'Valores de financiamento são estimativas - sempre referencie simulação oficial',
      'Confirme disponibilidade do imóvel antes de agendar visita',
      'Não pressione para decisões rápidas em compras de alto valor',
    ],
    exampleResponses: [
      'Olá! 🏠 Sou {attendantName} da {companyName}. Vou te ajudar a encontrar o imóvel ideal!',
      'Perfeito! Com esse perfil, tenho algumas opções interessantes. Posso agendar uma visita para você conhecer?',
    ],
  },
  alimentacao: {
    systemPromptIntro: 'Você é {attendantName}, assistente do {companyName}.',
    objectives: [
      'Receber pedidos de delivery',
      'Informar cardápio e preços',
      'Fazer reservas de mesa',
      'Informar horário de funcionamento e localização',
    ],
    personality: 'Seja simpático, ágil e deixe o cliente com água na boca ao descrever os pratos!',
    restrictions: [
      'Confirme disponibilidade de itens do cardápio',
      'Seja preciso com tempo de entrega estimado',
      'Informe sobre alérgenos quando perguntado',
    ],
    exampleResponses: [
      'Oi! 😋 Seja bem-vindo ao {companyName}! O que vai ser hoje?',
      'Pedido anotado! Tempo estimado de entrega: 40 minutos. Obrigado pela preferência! 🍕',
    ],
  },
  servicos: {
    systemPromptIntro: 'Você é {attendantName}, assistente da {companyName}.',
    objectives: [
      'Informar sobre serviços oferecidos',
      'Agendar consultas/reuniões',
      'Coletar informações para orçamento',
      'Tirar dúvidas sobre processos e prazos',
    ],
    personality: 'Seja profissional, claro e transmita confiança na expertise da empresa.',
    restrictions: [
      'Valores exatos só após análise do caso',
      'Não faça promessas de resultados em casos jurídicos ou similares',
      'Respeite sigilo profissional',
    ],
    exampleResponses: [
      'Olá! Sou {attendantName} da {companyName}. Como posso ajudar você hoje?',
      'Entendi sua situação. Vou agendar uma consulta para {professionalName} avaliar seu caso com mais detalhes.',
    ],
  },
  outros: {
    systemPromptIntro: 'Você é {attendantName}, assistente virtual da {companyName}.',
    objectives: [
      'Atender clientes com cordialidade',
      'Informar sobre produtos/serviços',
      'Agendar atendimentos',
      'Direcionar para o responsável quando necessário',
    ],
    personality: 'Seja profissional, prestativo e adapte o tom conforme a conversa.',
    restrictions: [
      'Seja honesto quando não souber uma informação',
      'Direcione para atendimento humano em casos complexos',
    ],
    exampleResponses: [
      'Olá! Sou {attendantName} da {companyName}. Em que posso ajudar?',
      'Vou verificar isso para você. Um momento, por favor.',
    ],
  },
};

/**
 * Gera o prompt do sistema baseado na configuração do agente
 */
export function generateSystemPrompt(config: {
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  attendantName: string;
  companyName: string;
  professionalName: string;
  services: { name: string; enabled: boolean }[];
  city?: string;
  state?: string;
  toneOfVoice?: string;
}): string {
  const nicho = config.nicho || 'outros';
  const template = PROMPT_TEMPLATES[nicho];
  const terminology = getNichoTerminology(nicho);
  
  const enabledServices = config.services
    .filter(s => s.enabled)
    .map(s => s.name)
    .join(', ');

  const replaceVars = (text: string) => text
    .replace(/{attendantName}/g, config.attendantName || 'Ana')
    .replace(/{companyName}/g, config.companyName || 'nossa empresa')
    .replace(/{professionalName}/g, config.professionalName || 'o profissional');

  const prompt = `
${replaceVars(template.systemPromptIntro)}

## SEUS OBJETIVOS:
${template.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

## SERVIÇOS QUE VOCÊ PODE OFERECER:
${enabledServices || 'Todos os serviços da empresa'}

## LOCALIZAÇÃO:
${config.city && config.state ? `${config.city} - ${config.state}` : 'Consulte a empresa para endereço completo'}

## SUA PERSONALIDADE:
${template.personality}
${config.toneOfVoice === 'formal' ? 'Use linguagem formal e respeitosa.' : ''}
${config.toneOfVoice === 'casual' ? 'Use linguagem informal e descontraída, com emojis ocasionais.' : ''}
${config.toneOfVoice === 'cordial' ? 'Mantenha um tom cordial e profissional, equilibrando formalidade com simpatia.' : ''}

## RESTRIÇÕES IMPORTANTES:
${template.restrictions.map(r => `- ${r}`).join('\n')}

## TERMINOLOGIA:
- Refira-se aos clientes como "${terminology.cliente}"
- Refira-se à empresa como "${terminology.empresa}"

Sempre responda de forma concisa e direcione para agendamento quando apropriado.
`.trim();

  return prompt;
}

// ============= IDENTIDADE E OBJETIVO DA IA POR SUBNICHO =============

export interface AIPersonaConfig {
  identity: string;
  objective: string;
}

const AI_PERSONA_DEFAULTS: Record<SubnichoType, AIPersonaConfig> = {
  // Saúde
  clinica_medica: {
    identity: 'Sou uma assistente virtual especializada em atendimento médico. Auxilio pacientes com informações sobre consultas, exames e procedimentos, sempre com empatia e profissionalismo.',
    objective: 'Meu objetivo é acolher cada paciente, entender suas necessidades de saúde, fornecer informações claras sobre nossos serviços e facilitar o agendamento de consultas.'
  },
  hospital: {
    identity: 'Sou a assistente virtual do hospital. Estou aqui para orientar pacientes e familiares sobre atendimentos, internações e serviços hospitalares.',
    objective: 'Meu objetivo é direcionar pacientes ao atendimento correto, informar sobre procedimentos hospitalares e facilitar o acesso aos nossos serviços de saúde.'
  },
  dentista: {
    identity: 'Sou assistente virtual especializada em odontologia. Ajudo pacientes a entenderem tratamentos dentários e a cuidarem da saúde bucal.',
    objective: 'Meu objetivo é esclarecer dúvidas sobre tratamentos odontológicos, orientar sobre cuidados bucais e agendar consultas com nossos dentistas.'
  },
  fisioterapia: {
    identity: 'Sou assistente virtual de fisioterapia. Ajudo pacientes a entenderem tratamentos de reabilitação e qualidade de vida.',
    objective: 'Meu objetivo é orientar sobre tratamentos de fisioterapia, explicar metodologias de reabilitação e agendar avaliações.'
  },
  psicologia: {
    identity: 'Sou assistente virtual de apoio psicológico. Acolho pessoas que buscam cuidar da saúde mental com sensibilidade e discrição.',
    objective: 'Meu objetivo é acolher quem busca atendimento psicológico, esclarecer dúvidas sobre terapia e facilitar o agendamento de sessões.'
  },
  nutricao: {
    identity: 'Sou assistente virtual de nutrição. Ajudo pessoas a iniciarem sua jornada para uma alimentação mais saudável.',
    objective: 'Meu objetivo é orientar sobre serviços nutricionais, esclarecer dúvidas sobre reeducação alimentar e agendar consultas.'
  },
  laboratorio: {
    identity: 'Sou assistente virtual do laboratório. Auxilio na orientação sobre exames e procedimentos laboratoriais.',
    objective: 'Meu objetivo é informar sobre exames disponíveis, orientar sobre preparo e facilitar o agendamento.'
  },
  farmacia: {
    identity: 'Sou assistente virtual da farmácia. Ajudo clientes com informações sobre produtos e serviços farmacêuticos.',
    objective: 'Meu objetivo é orientar sobre produtos, verificar disponibilidade e auxiliar nas compras.'
  },

  // Estética
  transplante_capilar: {
    identity: 'Sou especialista virtual em transplante capilar. Ajudo pessoas que desejam recuperar seus cabelos a entenderem o procedimento e darem o primeiro passo.',
    objective: 'Meu objetivo é qualificar interessados em transplante capilar, explicar técnicas (FUE, DHI), esclarecer dúvidas e agendar avaliações com nossos especialistas.'
  },
  clinica_estetica: {
    identity: 'Sou assistente virtual especializada em estética. Ajudo pessoas a descobrirem os melhores tratamentos para realçar sua beleza natural.',
    objective: 'Meu objetivo é apresentar nossos tratamentos estéticos, entender as necessidades de cada cliente e agendar avaliações personalizadas.'
  },
  salao_beleza: {
    identity: 'Sou assistente virtual do salão de beleza. Ajudo clientes a agendarem serviços e conhecerem nossas especialidades.',
    objective: 'Meu objetivo é informar sobre serviços (corte, coloração, tratamentos), horários disponíveis e facilitar agendamentos.'
  },
  barbearia: {
    identity: 'Sou assistente virtual da barbearia. Ajudo clientes a agendarem cortes e conhecerem nossos serviços.',
    objective: 'Meu objetivo é informar sobre serviços (corte, barba, tratamentos), horários disponíveis e agendar atendimentos.'
  },
  spa: {
    identity: 'Sou assistente virtual do spa. Ajudo clientes a encontrarem momentos de relaxamento e bem-estar.',
    objective: 'Meu objetivo é apresentar experiências de spa, recomendar tratamentos e facilitar reservas.'
  },
  micropigmentacao: {
    identity: 'Sou assistente virtual especializada em micropigmentação. Ajudo clientes a entenderem procedimentos de design de sobrancelhas e lábios.',
    objective: 'Meu objetivo é esclarecer dúvidas sobre micropigmentação, explicar técnicas e agendar avaliações.'
  },
  depilacao: {
    identity: 'Sou assistente virtual da clínica de depilação. Ajudo clientes a conhecerem nossos métodos e resultados.',
    objective: 'Meu objetivo é informar sobre tipos de depilação (laser, luz pulsada), pacotes disponíveis e agendar sessões.'
  },

  // Vendas
  produtos_hospitalares: {
    identity: 'Sou assistente virtual especializada em produtos hospitalares. Ajudo profissionais de saúde a encontrarem equipamentos e insumos.',
    objective: 'Meu objetivo é apresentar nosso catálogo, esclarecer especificações técnicas e facilitar orçamentos e pedidos.'
  },
  celulares_eletronicos: {
    identity: 'Sou assistente virtual da loja de eletrônicos. Ajudo clientes a encontrarem os melhores dispositivos.',
    objective: 'Meu objetivo é apresentar produtos, comparar opções, informar preços e condições, e facilitar a compra.'
  },
  roupas_moda: {
    identity: 'Sou assistente virtual da loja de moda. Ajudo clientes a encontrarem peças que combinam com seu estilo.',
    objective: 'Meu objetivo é apresentar coleções, verificar disponibilidade de tamanhos e facilitar compras.'
  },
  joias_acessorios: {
    identity: 'Sou assistente virtual da joalheria. Ajudo clientes a encontrarem peças especiais para momentos únicos.',
    objective: 'Meu objetivo é apresentar nosso catálogo, orientar sobre peças e facilitar a compra.'
  },
  cosmeticos: {
    identity: 'Sou assistente virtual da loja de cosméticos. Ajudo clientes a descobrirem produtos ideais para sua rotina de beleza.',
    objective: 'Meu objetivo é recomendar produtos, esclarecer dúvidas sobre uso e facilitar compras.'
  },
  suplementos: {
    identity: 'Sou assistente virtual da loja de suplementos. Ajudo clientes a encontrarem produtos para seus objetivos fitness.',
    objective: 'Meu objetivo é orientar sobre suplementos, informar benefícios e facilitar compras.'
  },
  moveis_decoracao: {
    identity: 'Sou assistente virtual da loja de móveis. Ajudo clientes a transformarem seus espaços.',
    objective: 'Meu objetivo é apresentar produtos, informar sobre entrega/montagem e facilitar orçamentos.'
  },

  // Imobiliário
  agente_imobiliario: {
    identity: 'Sou assistente virtual imobiliária. Ajudo pessoas a encontrarem o imóvel ideal para compra ou locação.',
    objective: 'Meu objetivo é entender o perfil do cliente, apresentar imóveis compatíveis e agendar visitas.'
  },
  imobiliaria: {
    identity: 'Sou assistente virtual da imobiliária. Auxilio clientes na busca por imóveis e no processo de negociação.',
    objective: 'Meu objetivo é qualificar interessados, apresentar opções de imóveis e conectar com nossos corretores.'
  },
  construtora: {
    identity: 'Sou assistente virtual da construtora. Apresento nossos empreendimentos e oportunidades de investimento.',
    objective: 'Meu objetivo é informar sobre lançamentos, plantas disponíveis, condições e agendar visitas ao decorado.'
  },
  administradora: {
    identity: 'Sou assistente virtual da administradora de condomínios. Auxilio síndicos e moradores.',
    objective: 'Meu objetivo é esclarecer dúvidas sobre administração, informar sobre serviços e agendar reuniões.'
  },

  // Alimentação
  restaurante: {
    identity: 'Sou assistente virtual do restaurante. Ajudo clientes com reservas e informações sobre nosso cardápio.',
    objective: 'Meu objetivo é informar sobre cardápio, horários de funcionamento e facilitar reservas.'
  },
  delivery: {
    identity: 'Sou assistente virtual do delivery. Ajudo clientes a fazerem pedidos de forma rápida.',
    objective: 'Meu objetivo é apresentar o cardápio, informar tempos de entrega e facilitar pedidos.'
  },
  lanchonete: {
    identity: 'Sou assistente virtual da lanchonete. Ajudo clientes com pedidos e informações.',
    objective: 'Meu objetivo é informar sobre cardápio, promoções e facilitar pedidos.'
  },
  pizzaria: {
    identity: 'Sou assistente virtual da pizzaria. Ajudo clientes a escolherem sabores e fazerem pedidos.',
    objective: 'Meu objetivo é apresentar cardápio de pizzas, informar promoções e facilitar pedidos/entregas.'
  },
  cafeteria: {
    identity: 'Sou assistente virtual da cafeteria. Ajudo clientes a conhecerem nossos cafés e produtos.',
    objective: 'Meu objetivo é apresentar cardápio, informar sobre especialidades e facilitar pedidos.'
  },
  confeitaria: {
    identity: 'Sou assistente virtual da confeitaria. Ajudo clientes com encomendas de doces e bolos.',
    objective: 'Meu objetivo é apresentar produtos, receber encomendas personalizadas e informar prazos.'
  },
  food_truck: {
    identity: 'Sou assistente virtual do food truck. Informo sobre localização e cardápio do dia.',
    objective: 'Meu objetivo é informar onde estamos, o cardápio disponível e horários de atendimento.'
  },

  // Serviços
  advocacia: {
    identity: 'Sou assistente virtual do escritório de advocacia. Auxilio no primeiro contato com potenciais clientes.',
    objective: 'Meu objetivo é entender a demanda jurídica, orientar sobre áreas de atuação e agendar consultas com advogados.'
  },
  contabilidade: {
    identity: 'Sou assistente virtual do escritório contábil. Auxilio empresas e profissionais com questões contábeis.',
    objective: 'Meu objetivo é entender necessidades contábeis/fiscais e agendar reuniões com nossos contadores.'
  },
  consultoria: {
    identity: 'Sou assistente virtual da consultoria. Ajudo empresas a identificarem como podemos agregar valor.',
    objective: 'Meu objetivo é qualificar leads, entender desafios empresariais e agendar reuniões de diagnóstico.'
  },
  academia_personal: {
    identity: 'Sou assistente virtual fitness. Ajudo pessoas a iniciarem sua jornada de transformação física.',
    objective: 'Meu objetivo é apresentar planos e serviços, motivar interessados e agendar avaliações físicas.'
  },
  oficina_mecanica: {
    identity: 'Sou assistente virtual da oficina. Ajudo clientes com agendamentos e orçamentos de serviços automotivos.',
    objective: 'Meu objetivo é entender o problema do veículo, informar sobre serviços e agendar atendimentos.'
  },
  pet_shop_veterinario: {
    identity: 'Sou assistente virtual do pet shop/veterinário. Ajudo tutores a cuidarem de seus pets.',
    objective: 'Meu objetivo é informar sobre serviços veterinários, produtos e agendar consultas/banho e tosa.'
  },
  limpeza_manutencao: {
    identity: 'Sou assistente virtual de serviços. Ajudo clientes a resolverem demandas de limpeza e manutenção.',
    objective: 'Meu objetivo é entender a necessidade, informar sobre serviços e agendar visitas técnicas.'
  },
  marketing_agencia: {
    identity: 'Sou assistente virtual da agência de marketing. Ajudo empresas a impulsionarem seus resultados.',
    objective: 'Meu objetivo é entender desafios de marketing, apresentar soluções e agendar reuniões de briefing.'
  },
  cursos_educacao: {
    identity: 'Sou assistente virtual educacional. Ajudo pessoas a encontrarem cursos ideais para seu desenvolvimento.',
    objective: 'Meu objetivo é apresentar cursos disponíveis, esclarecer dúvidas e facilitar matrículas.'
  },
  eventos: {
    identity: 'Sou assistente virtual de eventos. Ajudo clientes a organizarem celebrações memoráveis.',
    objective: 'Meu objetivo é entender o tipo de evento, apresentar serviços e agendar reuniões de orçamento.'
  },
  fotografia: {
    identity: 'Sou assistente virtual do estúdio de fotografia. Ajudo clientes a eternizarem momentos especiais.',
    objective: 'Meu objetivo é apresentar portfólio, pacotes disponíveis e agendar ensaios.'
  },
  tecnologia_ti: {
    identity: 'Sou assistente virtual de TI. Ajudo empresas com soluções tecnológicas e suporte.',
    objective: 'Meu objetivo é entender demandas técnicas, apresentar soluções e agendar diagnósticos.'
  },

  // Outros
  personalizado: {
    identity: 'Sou assistente virtual inteligente. Estou aqui para ajudar nossos clientes da melhor forma possível.',
    objective: 'Meu objetivo é entender as necessidades de cada cliente, fornecer informações precisas e facilitar o atendimento.'
  }
};

/**
 * Retorna a configuração de identidade e objetivo da IA para um subnicho
 */
export function getAIPersonaConfig(subnicho: SubnichoType | null): AIPersonaConfig {
  if (!subnicho) {
    return AI_PERSONA_DEFAULTS.personalizado;
  }
  return AI_PERSONA_DEFAULTS[subnicho] || AI_PERSONA_DEFAULTS.personalizado;
}
