/**
 * CPG Advocacia Médica - Preview da Proposta Comercial
 * Layout profissional para impressão/PDF
 */

import React, { forwardRef } from "react";
import { Check, Shield, FileText, Scale, Phone, Mail, Globe } from "lucide-react";
import type { ProposalData } from "../../IpromedProposals";

// Mapeamento de IDs para labels
const CONDITION_LABELS: Record<string, string> = {
  mesma_clinica: "Ser médico(a) atuando na mesma clínica",
  ex_aluno_ibramec: "Ser cônjuge de aluna IBRAMEC",
  indicacao: "Ser indicação de um cliente ativo",
  parceiro: "Fazer parte de parceria estratégica",
  estrutura_organizada: "Já estar inserido(a) em uma estrutura assistencial organizada",
};

const SERVICE_LABELS: Record<string, string> = {
  consultoria: "Consultoria jurídica preventiva ilimitada",
  defesa_crm: "Defesa ética perante o CRM",
  defesa_civel: "Defesa cível (danos morais e materiais)",
  audiencias: "Acompanhamento em audiências",
  processos_3: "Até 3 processos concomitantes",
  atendimento: "Atendimento contínuo e estratégico",
  // Serviços do plano Integral
  contratos: "Análise e revisão de contratos médicos",
  defesa_criminal: "Defesa criminal médica",
  defesa_admin: "Defesa administrativa (Vigilância, ANS)",
  gestao_crise: "Gestão de crise e reputação",
  parecer: "Parecer jurídico técnico",
  processos_ilimitados: "Processos concomitantes ilimitados",
};

const DOCUMENT_LABELS: Record<string, string> = {
  contrato_servicos: "Contrato de Prestação de Serviços Médicos",
  tcle_procedimentos: "TCLEs personalizados por procedimento",
  tcle_teleconsulta: "TCLE para Teleconsulta",
  termo_imagem: "Termo de Uso de Imagem",
  politica_prontuario: "Política de Prontuário",
  politica_agendamento: "Política de Agendamento",
  termo_sigilo: "Termo de Sigilo",
  termo_recusa: "Termo de Recusa de Tratamento",
  anamnese: "Formulário de Anamnese Guiado",
};

interface ProposalPreviewProps {
  proposal: ProposalData;
}

export const ProposalPreview = forwardRef<HTMLDivElement, ProposalPreviewProps>(
  ({ proposal }, ref) => {
    const allConditions = [
      ...proposal.conditions.map(id => CONDITION_LABELS[id] || id),
      ...proposal.customConditions,
    ];

    const documentsText = proposal.documentsIncluded === "full" 
      ? "100% inclusa" 
      : proposal.documentsIncluded === "discount" 
        ? "com desconto especial" 
        : "disponível para contratação";

    return (
      <div
        ref={ref}
        className="bg-white text-slate-800 print:text-black"
        style={{ 
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        {/* Page 1 */}
        <div className="p-8 lg:p-12 min-h-[29.7cm] print:min-h-[29.7cm] print:max-h-[29.7cm] print:overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-amber-500">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Scale className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">CPG Advocacia Médica</h1>
                <p className="text-amber-600 font-medium">Proteção Jurídica Especializada</p>
              </div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>Proposta Comercial</p>
              <p className="font-semibold text-slate-700">
                {new Date().toLocaleDateString("pt-BR", { 
                  day: "2-digit", 
                  month: "long", 
                  year: "numeric" 
                })}
              </p>
            </div>
          </div>

          {/* Title Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-6 py-2">
              <Shield className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-800">
                Proposta Comercial • Assessoria Jurídica Especial
              </span>
            </div>
          </div>

          {/* Subtitle */}
          {proposal.planSubtitle && (
            <p className="text-center text-lg text-slate-600 mb-8">
              {proposal.planSubtitle}
              {proposal.clientName && (
                <> para <span className="font-semibold text-primary">{proposal.clientName}</span></>
              )}
            </p>
          )}

          {/* Introduction */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <p className="text-lg leading-relaxed">
              Olá{proposal.clientName ? `, ${proposal.clientName.split(" ")[0]}` : ""}, tudo bem?
            </p>
            <p className="mt-3 text-slate-600 leading-relaxed">
              {proposal.introMessage}
            </p>
          </div>

          {/* Conditions Section */}
          {allConditions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-amber-500">Por você:</span>
              </h2>
              <ul className="space-y-2">
                {allConditions.map((condition, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{condition}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-slate-600 italic">
                Conseguimos aplicar uma condição diferenciada, mantendo o mesmo nível de proteção jurídica essencial.
              </p>
            </div>
          )}

          {/* Plan Box */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{proposal.planName}</h3>
                {proposal.planSubtitle && (
                  <p className="text-amber-400 text-sm">{proposal.planSubtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-amber-400 text-lg">💰 Valor mensal:</span>
              <span className="text-4xl font-bold">
                R$ {proposal.monthlyValue.toLocaleString("pt-BR")}
              </span>
            </div>

            <p className="text-slate-300 text-sm">
              Esse plano garante a base jurídica necessária para atuar com segurança, 
              previsibilidade e tranquilidade no exercício da medicina.
            </p>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Inclui:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {proposal.services.map(serviceId => (
                <div key={serviceId} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{SERVICE_LABELS[serviceId] || serviceId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Page Break for Print */}
        <div className="print:break-before-page" />

        {/* Page 2 */}
        <div className="p-8 lg:p-12 min-h-[29.7cm] print:min-h-[29.7cm]">
          {/* Documents Section */}
          {proposal.documents.length > 0 && proposal.documentsIncluded !== "none" && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-amber-500" />
                <h3 className="text-xl font-semibold text-slate-800">
                  Documentação Jurídica Preventiva
                </h3>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                  {documentsText}
                </span>
              </div>

              {proposal.documentsIncluded === "full" && (
                <p className="text-slate-600 mb-4">
                  Diferente do plano padrão, onde a documentação tem apenas desconto, 
                  nessa proposta especial você recebe <strong>100% dos documentos inclusos</strong>, 
                  sem custo adicional.
                </p>
              )}

              <div className="bg-slate-50 rounded-xl p-6">
                <p className="font-medium text-slate-700 mb-4">Documentos contemplados:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proposal.documents.map(docId => (
                    <div key={docId} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{DOCUMENT_LABELS[docId] || docId}</span>
                    </div>
                  ))}
                </div>
              </div>

              {proposal.closingMessage && (
                <p className="mt-6 text-slate-600 italic">
                  {proposal.closingMessage}
                </p>
              )}
            </div>
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-8 text-center mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Pronto para começar?
            </h3>
            <p className="text-slate-600 mb-6">
              Entre em contato conosco para dar início à sua proteção jurídica.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-slate-700">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-amber-600" />
                <span>(11) 99999-9999</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-600" />
                <span>contato@cpgadvocacia.com.br</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-600" />
                <span>www.cpgadvocacia.com.br</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-center text-sm text-slate-500">
            <p>
              CPG Advocacia Médica • Proteção Jurídica Especializada para Profissionais da Saúde
            </p>
            <p className="mt-1">
              Esta proposta é válida por 30 dias a partir da data de emissão.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ProposalPreview.displayName = "ProposalPreview";
