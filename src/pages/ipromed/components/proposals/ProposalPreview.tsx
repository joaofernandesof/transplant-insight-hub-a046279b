/**
 * CPG Advocacia Médica - Preview da Proposta Comercial
 * Layout compacto para impressão em uma única página A4
 * Cores da identidade visual: Verde escuro (#3d5a47) e Dourado (#c9a55c)
 * Suporta edição inline clicando nos textos
 */

import React, { forwardRef } from "react";
import { Check, Shield, FileText, Phone, Mail, Globe } from "lucide-react";
import type { ProposalData } from "../../IpromedProposals";
import cpgLogo from "@/assets/cpg-logo.jpg";
import { EditableText, EditableNumber } from "./EditableText";

// Cores da identidade visual CPG
const CPG_COLORS = {
  green: "#3d5a47",
  greenLight: "#4a6b54",
  gold: "#c9a55c",
  goldLight: "#d4b46d",
  cream: "#f9f7f3",
};

const SERVICE_LABELS: Record<string, string> = {
  consultoria: "Consultoria jurídica preventiva ilimitada",
  defesa_crm: "Defesa ética perante o CRM",
  defesa_civel: "Defesa cível (danos morais/materiais)",
  audiencias: "Acompanhamento em audiências",
  processos_3: "Até 3 processos concomitantes",
  atendimento: "Atendimento contínuo e estratégico",
  contratos: "Análise e revisão de contratos",
  defesa_criminal: "Defesa criminal médica",
  defesa_admin: "Defesa administrativa (Vigilância, ANS)",
  gestao_crise: "Gestão de crise e reputação",
  parecer: "Parecer jurídico técnico",
  processos_ilimitados: "Processos ilimitados",
};

const DOCUMENT_LABELS: Record<string, string> = {
  contrato_servicos: "Contrato de Prestação de Serviços",
  tcle_procedimentos: "TCLEs personalizados",
  tcle_teleconsulta: "TCLE para Teleconsulta",
  termo_imagem: "Termo de Uso de Imagem",
  politica_prontuario: "Política de Prontuário",
  politica_agendamento: "Política de Agendamento",
  termo_sigilo: "Termo de Sigilo",
  termo_recusa: "Termo de Recusa de Tratamento",
  anamnese: "Formulário de Anamnese",
};

interface ProposalPreviewProps {
  proposal: ProposalData;
  onUpdate?: (updates: Partial<ProposalData>) => void;
  editable?: boolean;
}

export const ProposalPreview = forwardRef<HTMLDivElement, ProposalPreviewProps>(
  ({ proposal, onUpdate, editable = true }, ref) => {
    const isEditable = editable && !!onUpdate;

    const documentsText = proposal.documentsIncluded === "full" 
      ? "100% inclusa" 
      : proposal.documentsIncluded === "discount" 
        ? "com desconto" 
        : "";

    return (
      <div
        ref={ref}
        className="bg-white print:text-black"
        style={{ 
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          width: "210mm",
          minHeight: "297mm",
          maxHeight: "297mm",
          overflow: "hidden",
          padding: "12mm 14mm",
          boxSizing: "border-box",
        }}
      >
        {/* Header com logo */}
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `2px solid ${CPG_COLORS.gold}` }}>
          <div className="flex items-center gap-3">
            <img 
              src={cpgLogo} 
              alt="CPG Advocacia" 
              className="h-14 w-14 rounded-lg object-cover shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: CPG_COLORS.green }}>
                Cartaxo Parahyba Guerreiro - Advocacia Médica
              </h1>
              <p className="text-[9px] mt-0.5" style={{ color: CPG_COLORS.greenLight }}>
                CNPJ: 33.947.033/0001-0
              </p>
              <p className="text-[8px] leading-snug" style={{ color: CPG_COLORS.greenLight }}>
                Rua Marcos Macêdo, 1333, Pátio Dom Luis, Torre 02, sala 2201, Aldeota, Fortaleza/CE
              </p>
              <p className="text-[8px]" style={{ color: CPG_COLORS.greenLight }}>
                contato@cpgadvocacia.com.br | WhatsApp: (85) 98841-8796
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Proposta Comercial</p>
            <p className="text-xs font-semibold" style={{ color: CPG_COLORS.green }}>
              {new Date().toLocaleDateString("pt-BR", { 
                day: "2-digit", 
                month: "long", 
                year: "numeric" 
              })}
            </p>
          </div>
        </div>

        {/* Destinatário */}
        <div className="text-center mb-4">
          <p className="text-sm" style={{ color: CPG_COLORS.green }}>
            Proposta para{" "}
            <span className="font-semibold">
              {isEditable ? (
                <EditableText
                  value={proposal.clientName}
                  onChange={(value) => onUpdate({ clientName: value })}
                  placeholder="Nome do cliente"
                  style={{ color: CPG_COLORS.green }}
                />
              ) : (
                proposal.clientName || "Cliente"
              )}
            </span>
          </p>
        </div>

        {/* Introdução compacta */}
        <div 
          className="rounded-lg p-3 mb-4 text-xs leading-relaxed"
          style={{ backgroundColor: CPG_COLORS.cream }}
        >
          <p style={{ color: CPG_COLORS.green }}>
            Olá{proposal.clientName ? `, ${proposal.clientName.split(" ")[0]}` : ""}!{" "}
            {isEditable ? (
              <EditableText
                value={proposal.introMessage}
                onChange={(value) => onUpdate({ introMessage: value })}
                placeholder="Mensagem de introdução..."
                multiline
                style={{ color: CPG_COLORS.green }}
              />
            ) : (
              proposal.introMessage
            )}
          </p>
        </div>

        {/* Box do Plano - Centralizado */}
        <div className="flex justify-center mb-4">
          <div 
            className="rounded-xl p-4 text-white max-w-sm w-full"
            style={{ background: `linear-gradient(135deg, ${CPG_COLORS.green} 0%, ${CPG_COLORS.greenLight} 100%)` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ backgroundColor: CPG_COLORS.gold }}
              >
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                {isEditable ? (
                  <EditableText
                    value={proposal.planName}
                    onChange={(value) => onUpdate({ planName: value })}
                    placeholder="Nome do plano"
                    className="text-sm font-bold leading-tight text-white"
                  />
                ) : (
                  <h3 className="text-sm font-bold leading-tight">{proposal.planName}</h3>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[10px]" style={{ color: CPG_COLORS.goldLight }}>Valor mensal:</span>
              <span className="text-2xl font-bold" style={{ color: CPG_COLORS.gold }}>
                R${" "}
                {isEditable ? (
                  <EditableNumber
                    value={proposal.monthlyValue}
                    onChange={(value) => onUpdate({ monthlyValue: value })}
                    style={{ color: CPG_COLORS.gold }}
                    className="text-2xl font-bold"
                  />
                ) : (
                  proposal.monthlyValue.toLocaleString("pt-BR")
                )}
              </span>
            </div>
            <p className="text-[9px] opacity-80 leading-snug">
              Base jurídica para atuar com segurança e tranquilidade.
            </p>
          </div>
        </div>

        {/* Serviços incluídos */}
        {proposal.services.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" style={{ color: CPG_COLORS.gold }} />
              <h3 className="text-xs font-semibold" style={{ color: CPG_COLORS.green }}>
                Serviços Incluídos
              </h3>
            </div>
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: CPG_COLORS.cream }}
            >
              <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                {proposal.services.map(serviceId => (
                  <div key={serviceId} className="flex items-start gap-1 text-[10px]" style={{ color: CPG_COLORS.green }}>
                    <Check className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: CPG_COLORS.gold }} />
                    <span>{SERVICE_LABELS[serviceId] || serviceId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documentação Jurídica */}
        {proposal.documents.length > 0 && proposal.documentsIncluded !== "none" && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" style={{ color: CPG_COLORS.gold }} />
              <h3 className="text-xs font-semibold" style={{ color: CPG_COLORS.green }}>
                Documentação Jurídica Preventiva
              </h3>
              {documentsText && (
                <span 
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: CPG_COLORS.cream, color: CPG_COLORS.green }}
                >
                  {documentsText}
                </span>
              )}
            </div>
            <div 
              className="rounded-lg p-3"
              style={{ backgroundColor: CPG_COLORS.cream }}
            >
              <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                {proposal.documents.map(docId => (
                  <div key={docId} className="flex items-start gap-1 text-[10px]" style={{ color: CPG_COLORS.green }}>
                    <Check className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: CPG_COLORS.gold }} />
                    <span>{DOCUMENT_LABELS[docId] || docId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de fechamento */}
        <div className="text-[10px] italic mb-4 leading-relaxed" style={{ color: CPG_COLORS.green }}>
          "
          {isEditable ? (
            <EditableText
              value={proposal.closingMessage}
              onChange={(value) => onUpdate({ closingMessage: value })}
              placeholder="Mensagem de fechamento..."
              multiline
              style={{ color: CPG_COLORS.green }}
            />
          ) : (
            proposal.closingMessage
          )}
          "
        </div>

        {/* CTA e Contato */}
        <div 
          className="rounded-xl p-4 text-center mb-3"
          style={{ background: `linear-gradient(135deg, ${CPG_COLORS.cream} 0%, #f5f2ed 100%)`, border: `1px solid ${CPG_COLORS.gold}` }}
        >
          <h3 className="text-sm font-bold mb-1" style={{ color: CPG_COLORS.green }}>
            Pronto para começar?
          </h3>
          <p className="text-[10px] mb-3" style={{ color: CPG_COLORS.greenLight }}>
            Entre em contato para dar início à sua proteção jurídica.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-[10px]" style={{ color: CPG_COLORS.green }}>
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" style={{ color: CPG_COLORS.gold }} />
              <span>(11) 99999-9999</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" style={{ color: CPG_COLORS.gold }} />
              <span>contato@cpgadvocacia.com.br</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" style={{ color: CPG_COLORS.gold }} />
              <span>www.cpgadvocacia.com.br</span>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center text-[9px]" style={{ color: CPG_COLORS.greenLight }}>
          <p className="font-medium">Cartaxo Parahyba Guerreiro - Advocacia Médica • Proteção Jurídica Especializada</p>
          <p className="mt-0.5 opacity-70">Esta proposta é válida por 30 dias a partir da data de emissão.</p>
        </div>
      </div>
    );
  }
);

ProposalPreview.displayName = "ProposalPreview";
