import React from 'react';
import { cn } from '@/lib/utils';

interface DataField {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'currency' | 'decimal' | 'time';
  placeholder?: string;
}

interface DataEntryTableProps {
  values: Record<string, number | string | null>;
  onChange: (key: string, value: number | null) => void;
  isEditable: boolean;
}

const dataFields: DataField[] = [
  { key: 'gastoMidia', label: 'Gasto em Mídia', description: 'Investimento total em anúncios', type: 'currency', placeholder: 'R$ 0,00' },
  { key: 'impressoes', label: 'Impressões', description: 'Total de impressões dos anúncios', type: 'number', placeholder: '0' },
  { key: 'alcance', label: 'Alcance', description: 'Pessoas únicas alcançadas', type: 'number', placeholder: '0' },
  { key: 'cliques', label: 'Cliques', description: 'Cliques nos anúncios', type: 'number', placeholder: '0' },
  { key: 'interacoes', label: 'Interações', description: 'Curtidas, comentários, salvamentos', type: 'number', placeholder: '0' },
  { key: 'visualizacoes', label: 'Visualizações de Vídeo', description: 'Views de vídeos', type: 'number', placeholder: '0' },
  { key: 'visualizacoes3s', label: 'Visualizações 3s', description: 'Views com mais de 3 segundos', type: 'number', placeholder: '0' },
  { key: 'visitas', label: 'Visitas à Landing', description: 'Visitantes na página', type: 'number', placeholder: '0' },
  { key: 'tempoCarregamento', label: 'Tempo de Carregamento', description: 'Segundos para carregar a página', type: 'decimal', placeholder: '0.0' },
  { key: 'saidasRapidas', label: 'Saídas Rápidas', description: 'Visitantes que saíram imediatamente', type: 'number', placeholder: '0' },
  { key: 'leadsTotal', label: 'Total de Leads', description: 'Leads gerados no período', type: 'number', placeholder: '0' },
  { key: 'leadsICP', label: 'Leads ICP', description: 'Leads com perfil ideal', type: 'number', placeholder: '0' },
  { key: 'enviosForm', label: 'Envios de Formulário', description: 'Formulários enviados', type: 'number', placeholder: '0' },
  { key: 'acessosForm', label: 'Acessos ao Formulário', description: 'Pessoas que acessaram o form', type: 'number', placeholder: '0' },
  { key: 'abandonosForm', label: 'Abandonos de Formulário', description: 'Abandonos durante preenchimento', type: 'number', placeholder: '0' },
  { key: 'cliquesWhats', label: 'Cliques no WhatsApp', description: 'Cliques no botão de WhatsApp', type: 'number', placeholder: '0' },
  { key: 'leadsContatados', label: 'Leads Contatados', description: 'Leads que receberam contato', type: 'number', placeholder: '0' },
  { key: 'leadsResponderam', label: 'Leads que Responderam', description: 'Leads que responderam ao contato', type: 'number', placeholder: '0' },
  { key: 'totalFollowUps', label: 'Total de Follow Ups', description: 'Follow ups realizados', type: 'number', placeholder: '0' },
  { key: 'agendamentosFollowUp', label: 'Agendamentos via Follow', description: 'Agendamentos vindos de follow up', type: 'number', placeholder: '0' },
  { key: 'consultasAgendadas', label: 'Consultas Agendadas', description: 'Total de consultas marcadas', type: 'number', placeholder: '0' },
  { key: 'consultasRealizadas', label: 'Consultas Realizadas', description: 'Consultas que aconteceram', type: 'number', placeholder: '0' },
  { key: 'noShows', label: 'No Shows (Faltas)', description: 'Pacientes que não compareceram', type: 'number', placeholder: '0' },
  { key: 'MQLs', label: 'MQLs', description: 'Leads qualificados pelo marketing', type: 'number', placeholder: '0' },
  { key: 'SQLs', label: 'SQLs', description: 'Leads qualificados para vendas', type: 'number', placeholder: '0' },
  { key: 'propostas', label: 'Propostas Apresentadas', description: 'Propostas feitas aos pacientes', type: 'number', placeholder: '0' },
  { key: 'vendas', label: 'Vendas Realizadas', description: 'Fechamentos concretizados', type: 'number', placeholder: '0' },
  { key: 'receita', label: 'Receita Total', description: 'Faturamento do período', type: 'currency', placeholder: 'R$ 0,00' },
  { key: 'lucro', label: 'Lucro Líquido', description: 'Lucro após custos', type: 'currency', placeholder: 'R$ 0,00' },
  { key: 'leadsPerdidos', label: 'Leads Perdidos', description: 'Leads não atendidos ou perdidos', type: 'number', placeholder: '0' },
  { key: 'custoFixo', label: 'Custos Fixos', description: 'Custos fixos do período', type: 'currency', placeholder: 'R$ 0,00' },
  { key: 'custoVariavel', label: 'Custos Variáveis', description: 'Custos variáveis do período', type: 'currency', placeholder: 'R$ 0,00' }
];

export function DataEntryTable({ values, onChange, isEditable }: DataEntryTableProps) {
  const handleChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(key, null);
      return;
    }
    const numVal = parseFloat(val.replace(',', '.'));
    if (!isNaN(numVal)) {
      onChange(key, numVal);
    }
  };
  
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Dados Base para Cálculo</h3>
        <p className="text-xs text-muted-foreground">
          Preencha os dados abaixo. Os indicadores automáticos serão calculados automaticamente.
        </p>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Campo</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-40">Valor</th>
            </tr>
          </thead>
          <tbody>
            {dataFields.map((field, idx) => (
              <tr 
                key={field.key} 
                className={cn(
                  'border-b border-border last:border-b-0',
                  idx % 2 === 0 && 'bg-muted/10'
                )}
              >
                <td className="px-4 py-2 font-medium text-foreground">
                  {field.label}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {field.description}
                </td>
                <td className="px-4 py-2">
                  <div className="relative">
                    {field.type === 'currency' && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        R$
                      </span>
                    )}
                    <input
                      type="number"
                      step={field.type === 'decimal' || field.type === 'currency' ? '0.01' : '1'}
                      value={values[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e)}
                      disabled={!isEditable}
                      placeholder={field.placeholder}
                      className={cn(
                        'input-metric w-full',
                        field.type === 'currency' && 'pl-8'
                      )}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
