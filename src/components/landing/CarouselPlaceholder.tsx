import React from 'react';
import { cn } from '@/lib/utils';
import { 
  BarChart3, Calendar, User, Columns3, MessageSquare, 
  Search, Smartphone, ClipboardList 
} from 'lucide-react';

interface CarouselPlaceholderProps {
  type: 'dashboard-kpis' | 'dashboard-calendar' | 'dashboard-patient' | 
        'crm-pipeline' | 'crm-whatsapp' | 'crm-detective' |
        'mobile-scheduling' | 'mobile-journey';
  className?: string;
}

export function CarouselPlaceholder({ type, className }: CarouselPlaceholderProps) {
  const renderContent = () => {
    switch (type) {
      case 'dashboard-kpis':
        return <DashboardKPIsPlaceholder />;
      case 'dashboard-calendar':
        return <CalendarPlaceholder />;
      case 'dashboard-patient':
        return <PatientPlaceholder />;
      case 'crm-pipeline':
        return <PipelinePlaceholder />;
      case 'crm-whatsapp':
        return <WhatsAppPlaceholder />;
      case 'crm-detective':
        return <DetectivePlaceholder />;
      case 'mobile-scheduling':
        return <MobileSchedulingPlaceholder />;
      case 'mobile-journey':
        return <MobileJourneyPlaceholder />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "w-full h-full bg-slate-900 rounded-lg overflow-hidden",
      className
    )}>
      {renderContent()}
    </div>
  );
}

// Dashboard KPIs - Cards com números e gráfico
function DashboardKPIsPlaceholder() {
  return (
    <div className="p-4 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <div className="h-3 w-24 bg-slate-700 rounded" />
        </div>
        <div className="h-6 w-20 bg-slate-800 rounded" />
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { color: 'bg-blue-500/20 border-blue-500/30', accent: 'text-blue-400' },
          { color: 'bg-emerald-500/20 border-emerald-500/30', accent: 'text-emerald-400' },
          { color: 'bg-amber-500/20 border-amber-500/30', accent: 'text-amber-400' },
          { color: 'bg-purple-500/20 border-purple-500/30', accent: 'text-purple-400' },
        ].map((card, i) => (
          <div key={i} className={cn("p-3 rounded-lg border", card.color)}>
            <div className={cn("text-lg font-bold", card.accent)}>
              {['128', 'R$ 45k', '94%', '12'][i]}
            </div>
            <div className="h-2 w-12 bg-slate-700 rounded mt-1" />
          </div>
        ))}
      </div>
      
      {/* Chart Area */}
      <div className="flex-1 bg-slate-800/50 rounded-lg p-3 flex flex-col">
        <div className="h-2 w-20 bg-slate-700 rounded mb-3" />
        <div className="flex-1 flex items-end gap-1">
          {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t opacity-80"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Calendar
function CalendarPlaceholder() {
  return (
    <div className="p-4 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-300">Janeiro 2025</span>
        </div>
        <div className="flex gap-1">
          <div className="h-6 w-6 bg-slate-800 rounded" />
          <div className="h-6 w-6 bg-slate-800 rounded" />
        </div>
      </div>
      
      {/* Week header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-xs text-slate-500">{d}</div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => {
          const day = i - 2;
          const isToday = day === 15;
          const hasEvent = [5, 8, 12, 15, 18, 22, 25].includes(day);
          return (
            <div 
              key={i} 
              className={cn(
                "flex flex-col items-center justify-center rounded text-xs",
                day > 0 && day <= 31 ? "text-slate-300" : "text-slate-600",
                isToday && "bg-blue-600 text-white",
                hasEvent && !isToday && "bg-emerald-500/20"
              )}
            >
              {day > 0 && day <= 31 ? day : ''}
              {hasEvent && <div className="w-1 h-1 bg-emerald-400 rounded-full mt-0.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Patient Profile
function PatientPlaceholder() {
  return (
    <div className="p-4 h-full flex gap-4">
      {/* Left - Patient Info */}
      <div className="w-1/3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="h-3 w-24 bg-slate-700 rounded" />
            <div className="h-2 w-16 bg-slate-800 rounded mt-1" />
          </div>
        </div>
        
        <div className="space-y-2 mt-2">
          {['Telefone', 'Email', 'CPF', 'Nascimento'].map((label) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="text-[10px] text-slate-500">{label}</div>
              <div className="h-2 w-full bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Right - Timeline */}
      <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
        <div className="text-xs text-slate-400 mb-3">Histórico</div>
        <div className="space-y-3">
          {[
            { color: 'bg-emerald-500', label: 'Consulta realizada' },
            { color: 'bg-blue-500', label: 'Exames solicitados' },
            { color: 'bg-amber-500', label: 'Retorno agendado' },
            { color: 'bg-purple-500', label: 'Procedimento' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", item.color)} />
              <div className="text-xs text-slate-400">{item.label}</div>
              <div className="h-1.5 flex-1 bg-slate-700 rounded ml-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// CRM Pipeline (Kanban)
function PipelinePlaceholder() {
  const columns = [
    { name: 'Novos', color: 'border-slate-500', count: 8 },
    { name: 'Contato', color: 'border-blue-500', count: 5 },
    { name: 'Agendados', color: 'border-amber-500', count: 12 },
    { name: 'Convertidos', color: 'border-emerald-500', count: 3 },
  ];

  return (
    <div className="p-4 h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Columns3 className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-slate-300">Pipeline de Vendas</span>
      </div>
      
      <div className="flex-1 grid grid-cols-4 gap-2">
        {columns.map((col) => (
          <div key={col.name} className={cn("bg-slate-800/50 rounded-lg p-2 border-t-2", col.color)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">{col.name}</span>
              <span className="text-xs text-slate-500">{col.count}</span>
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: Math.min(col.count, 4) }).map((_, i) => (
                <div key={i} className="bg-slate-700/50 rounded p-2">
                  <div className="h-2 w-full bg-slate-600 rounded mb-1" />
                  <div className="h-1.5 w-2/3 bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// WhatsApp Chat
function WhatsAppPlaceholder() {
  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-1/3 bg-slate-800/70 border-r border-slate-700 p-2">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400">Conversas</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={cn(
              "flex items-center gap-2 p-2 rounded",
              i === 1 ? "bg-slate-700" : "bg-transparent"
            )}>
              <div className="w-8 h-8 rounded-full bg-slate-600" />
              <div className="flex-1">
                <div className="h-2 w-16 bg-slate-600 rounded" />
                <div className="h-1.5 w-24 bg-slate-700 rounded mt-1" />
              </div>
              {i <= 2 && <div className="w-4 h-4 bg-emerald-500 rounded-full text-[10px] flex items-center justify-center text-white">2</div>}
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat */}
      <div className="flex-1 flex flex-col p-3">
        <div className="flex-1 space-y-2">
          {/* Received */}
          <div className="flex gap-2">
            <div className="bg-slate-700 rounded-lg rounded-tl-none p-2 max-w-[70%]">
              <div className="h-2 w-32 bg-slate-600 rounded" />
            </div>
          </div>
          {/* Sent */}
          <div className="flex gap-2 justify-end">
            <div className="bg-emerald-600 rounded-lg rounded-tr-none p-2 max-w-[70%]">
              <div className="h-2 w-40 bg-emerald-500 rounded" />
            </div>
          </div>
          {/* Received */}
          <div className="flex gap-2">
            <div className="bg-slate-700 rounded-lg rounded-tl-none p-2 max-w-[70%]">
              <div className="h-2 w-48 bg-slate-600 rounded mb-1" />
              <div className="h-2 w-24 bg-slate-600 rounded" />
            </div>
          </div>
        </div>
        
        {/* Input */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 h-8 bg-slate-700 rounded-full" />
          <div className="w-8 h-8 bg-emerald-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Detective / Lead Research
function DetectivePlaceholder() {
  return (
    <div className="p-4 h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-slate-300">Detetive de Leads</span>
      </div>
      
      <div className="flex gap-3 flex-1">
        {/* Lead Info */}
        <div className="w-1/2 bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <div>
              <div className="h-3 w-24 bg-slate-700 rounded" />
              <div className="h-2 w-16 bg-slate-800 rounded mt-1" />
            </div>
          </div>
          
          <div className="space-y-2">
            {['LinkedIn', 'Instagram', 'Site'].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-700 rounded" />
                <div className="h-2 flex-1 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Score */}
        <div className="w-1/2 bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-2">Score</div>
          <div className="text-3xl font-bold text-emerald-400 mb-2">87</div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-[87%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
          </div>
          
          <div className="mt-4 space-y-2">
            {['Interesse alto', 'Poder decisão', 'Urgência'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                </div>
                <span className="text-xs text-slate-400">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Scheduling
function MobileSchedulingPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="w-40 h-72 bg-slate-800 rounded-[24px] border-4 border-slate-700 overflow-hidden relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-xl" />
        
        <div className="p-3 pt-7 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-slate-400">Agendar</span>
          </div>
          
          {/* Mini calendar */}
          <div className="grid grid-cols-7 gap-0.5 mb-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-4 h-4 rounded text-[8px] flex items-center justify-center",
                  i === 8 ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400"
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          <div className="flex-1 space-y-1.5">
            {['09:00', '10:00', '11:00', '14:00', '15:00'].map((time, i) => (
              <div 
                key={time} 
                className={cn(
                  "h-5 rounded px-2 flex items-center text-[9px]",
                  i === 2 ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400"
                )}
              >
                {time}
              </div>
            ))}
          </div>
          
          {/* Button */}
          <div className="h-6 bg-blue-600 rounded-lg mt-2" />
        </div>
      </div>
    </div>
  );
}

// Mobile Journey
function MobileJourneyPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="w-40 h-72 bg-slate-800 rounded-[24px] border-4 border-slate-700 overflow-hidden relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-xl" />
        
        <div className="p-3 pt-7 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-slate-400">Jornada</span>
          </div>
          
          {/* Timeline */}
          <div className="flex-1 relative">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-700" />
            
            <div className="space-y-4 pl-5">
              {[
                { done: true, label: 'Consulta' },
                { done: true, label: 'Exames' },
                { done: true, label: 'Procedimento' },
                { done: false, label: 'Retorno' },
                { done: false, label: 'Alta' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 relative">
                  <div className={cn(
                    "absolute -left-5 w-3 h-3 rounded-full border-2",
                    step.done 
                      ? "bg-emerald-500 border-emerald-400" 
                      : "bg-slate-800 border-slate-600"
                  )}>
                    {step.done && (
                      <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px]",
                    step.done ? "text-slate-300" : "text-slate-500"
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
