/**
 * Hook para gerar o prompt final do agente
 */

import { useMemo } from 'react';
import { AgentConfig, DAY_NAMES, WeekSchedule } from '../types';

export function usePromptGenerator(config: AgentConfig) {
  const generateServiceQuestion = () => {
    const enabled = config.services.filter(s => s.enabled);
    if (enabled.length === 0) return "Como posso te ajudar?";
    if (enabled.length === 1) return `Vejo que tem interesse em ${enabled[0].name}, correto?`;
    if (enabled.length === 2) return `Tem interesse em ${enabled[0].name} ou ${enabled[1].name}?`;
    
    const names = enabled.map(s => s.name).join(', ');
    return `Qual procedimento te interessa?\n${names}?`;
  };
  
  const formatSchedule = () => {
    const days = DAY_NAMES;
    let result = '';
    
    (Object.keys(config.schedule) as Array<keyof WeekSchedule>).forEach((day) => {
      const sched = config.schedule[day];
      if (sched.enabled && sched.intervals.length > 0) {
        result += `📅 ${days[day]}: `;
        result += sched.intervals.map(i => `${i.start} às ${i.end}`).join(', ') + '\n';
      }
    });
    
    return result || 'Horários a combinar';
  };
  
  const formatPaymentMethods = () => {
    const enabled = config.paymentMethods.filter(m => m.enabled);
    return enabled.length 
      ? enabled.map(m => `• ${m.name}`).join('\n') 
      : '• Consulte formas de pagamento';
  };

  const generatePrompt = useMemo(() => {
    const attendantName = config.attendantName || 'Assistente';
    const companyName = config.companyName || 'Clínica';
    const professionalName = config.professionalName || 'Dr(a).';
    
    let prompt = `<identidade>
Você se chama ${attendantName}, especialista em atendimento via WhatsApp da ${companyName}.
Sua linguagem é ${config.toneOfVoice === 'formal' ? 'formal e profissional' : config.toneOfVoice === 'cordial' ? 'cordial, profissional e humanizada' : 'casual e descontraída'}.

O ${professionalName} atende${config.crm ? ` com CRM ${config.crm}` : ''}.`;
    
    if (config.instagram) {
      prompt += `\nInstagram: @${config.instagram.replace('@', '')}`;
    }
    
    prompt += `\n</identidade>

<objetivo>
Seu objetivo principal é qualificar o lead, entender suas necessidades e agendar uma consulta.
Siga todos os passos do fluxo sem pular etapas.
Transfira para um humano quando apropriado.
</objetivo>

<instrucoes>`;
    
    if (config.consultationType.presencial) {
      prompt += `\n- O ${professionalName} realiza atendimentos presenciais em ${config.city || 'cidade'} - ${config.state || 'UF'}.`;
      if (config.address) {
        prompt += `\n  Endereço: ${config.address}`;
      }
    }
    
    if (config.consultationType.online) {
      prompt += `\n- Consultas online disponíveis para todo Brasil e exterior.`;
      if (config.consultationType.presencial) {
        prompt += `\n  (Priorize atendimento presencial, mas ofereça online quando necessário)`;
      }
    }
    
    prompt += `\n</instrucoes>

<fluxo_atendimento>
# PASSO 1: Saudação
${config.welcomeMessage || `Olá! Meu nome é ${attendantName} e sou assistente virtual da ${companyName}. Como posso te ajudar hoje? 😊`}

# PASSO 2: Identificação
Pergunte o nome do paciente de forma natural.

# PASSO 3: Interesse
${generateServiceQuestion()}

# PASSO 4: Qualificação
Faça perguntas para entender melhor a situação do paciente.

# PASSO 5: Agendamento
Ofereça os horários disponíveis e agende a consulta.

# PASSO EXTRA: Transferência
${config.transferMessage || 'Vou te transferir para um especialista. Aguarde um momento! 🙂'}
</fluxo_atendimento>`;
    
    if (config.beforeAfterImages.length > 0) {
      prompt += `\n\n<passo_extra_fotos>
Quando o paciente pedir para ver resultados ou fotos de antes/depois, envie estas URLs:
${config.beforeAfterImages.join('\n')}
</passo_extra_fotos>`;
    }
    
    prompt += `\n\n<passo_extra_horarios>
Horários de atendimento disponíveis:
${formatSchedule()}</passo_extra_horarios>`;
    
    prompt += `\n\n<passo_extra_pagamento>
Formas de pagamento aceitas:
${formatPaymentMethods()}
</passo_extra_pagamento>`;

    prompt += `\n\n<configuracoes>
- Duração padrão da consulta: ${config.consultationDuration} minutos
- Tom de voz: ${config.toneOfVoice}
</configuracoes>`;
    
    return prompt;
  }, [config]);

  return { 
    prompt: generatePrompt,
    generateServiceQuestion,
    formatSchedule,
    formatPaymentMethods
  };
}
