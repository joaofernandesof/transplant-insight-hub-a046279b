import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail, Building2, FolderOpen, MapPin, MessageCircle } from 'lucide-react';

// ====================================
// Contatos Oficiais - Neo Group
// ====================================

interface Contato {
  empresa: string;
  area: string;
  unidade: string;
  setor?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  observacao?: string;
}

const CONTATOS: Contato[] = [
  // NEO FOLIC
  { empresa: 'Neo Folic', area: 'Comercial', unidade: 'Fortaleza', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Neo Folic', area: 'Comercial', unidade: 'Juazeiro', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Neo Folic', area: 'Comercial', unidade: 'São Paulo', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Neo Folic', area: 'Pós-vendas', unidade: 'Fortaleza', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Neo Folic', area: 'Pós-vendas', unidade: 'Juazeiro', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Neo Folic', area: 'Pós-vendas', unidade: 'São Paulo', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Neo Folic', area: 'Financeiro', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Neo Folic', area: 'Jurídico', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Neo Folic', area: 'Agendamento de Transplante', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  // MEG
  { empresa: 'MEG', area: 'Comercial', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'MEG', area: 'Pós-vendas', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'MEG', area: 'Financeiro', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  // IBRAMEC
  { empresa: 'IBRAMEC', area: 'Comercial', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'IBRAMEC', area: 'Pós-vendas', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'IBRAMEC', area: 'Financeiro', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  // RENOVAFIOS
  { empresa: 'RenovaFios', area: 'Comercial', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'RenovaFios', area: 'Pós-vendas', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'RenovaFios', area: 'Financeiro', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  // AVIVAR
  { empresa: 'Avivar', area: 'Comercial', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Avivar', area: 'Pós-vendas', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Avivar', area: 'Financeiro', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  // LICENÇA
  { empresa: 'Licença', area: 'Comercial', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Licença', area: 'Pós-vendas', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
  { empresa: 'Licença', area: 'Financeiro', unidade: 'Geral', telefone: '', whatsapp: '', email: '' },
];

const EMPRESA_COLORS: Record<string, string> = {
  'Neo Folic': 'hsl(142, 60%, 40%)',
  'MEG': 'hsl(220, 60%, 50%)',
  'IBRAMEC': 'hsl(25, 70%, 50%)',
  'RenovaFios': 'hsl(280, 50%, 50%)',
  'Avivar': 'hsl(340, 60%, 50%)',
  'Licença': 'hsl(190, 60%, 40%)',
};

function ContatoCard({ contato }: { contato: Contato }) {
  const accentColor = EMPRESA_COLORS[contato.empresa] || 'hsl(var(--primary))';

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{contato.area}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{contato.unidade}</span>
            </div>
          </div>
          {contato.setor && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
              {contato.setor}
            </span>
          )}
        </div>

        {contato.observacao && (
          <p className="text-xs text-muted-foreground italic">{contato.observacao}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {contato.whatsapp ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
              asChild
            >
              <a href={`https://wa.me/${contato.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs opacity-40 cursor-default" disabled>
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          )}

          {contato.telefone ? (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
              <a href={`tel:${contato.telefone}`}>
                <Phone className="h-3.5 w-3.5" />
                Ligar
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs opacity-40 cursor-default" disabled>
              <Phone className="h-3.5 w-3.5" />
              Ligar
            </Button>
          )}

          {contato.email ? (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
              <a href={`mailto:${contato.email}`}>
                <Mail className="h-3.5 w-3.5" />
                E-mail
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs opacity-40 cursor-default" disabled>
              <Mail className="h-3.5 w-3.5" />
              E-mail
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContatosOficiais() {
  const [search, setSearch] = useState('');

  const empresas = useMemo(() => {
    const filtered = CONTATOS.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.empresa.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.unidade.toLowerCase().includes(q) ||
        (c.setor && c.setor.toLowerCase().includes(q))
      );
    });

    const grouped: Record<string, Contato[]> = {};
    for (const c of filtered) {
      if (!grouped[c.empresa]) grouped[c.empresa] = [];
      grouped[c.empresa].push(c);
    }
    return grouped;
  }, [search]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              CONTATOS OFICIAIS
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Selecione o setor correto para falar com nossa equipe
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa, setor ou região..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Contatos agrupados por empresa */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {Object.keys(empresas).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum contato encontrado para "{search}"</p>
          </div>
        )}

        {Object.entries(empresas).map(([empresa, contatos]) => {
          const color = EMPRESA_COLORS[empresa] || 'hsl(var(--primary))';
          return (
            <section key={empresa} className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">{empresa}</h2>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {contatos.length} {contatos.length === 1 ? 'contato' : 'contatos'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {contatos.map((c, i) => (
                  <ContatoCard key={`${empresa}-${i}`} contato={c} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Neo Group © {new Date().getFullYear()} — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
