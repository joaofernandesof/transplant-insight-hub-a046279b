/**
 * AvivarContacts - Página de Listas/Contatos do CRM Avivar
 * Exibe todos os contatos únicos por telefone, com contagem de leads
 */

import React, { useState, useMemo } from 'react';
import { AvivarSidebar } from './AvivarSidebar';
import { useAvivarContacts, AvivarContact, CreateContactData } from '@/hooks/useAvivarContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Building2,
  Users,
  MessageSquare,
  Trash2,
  Edit,
  RefreshCw,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function ContactCard({ 
  contact, 
  onEdit, 
  onDelete,
  onViewLeads 
}: { 
  contact: AvivarContact;
  onEdit: () => void;
  onDelete: () => void;
  onViewLeads: () => void;
}) {
  const initials = contact.name 
    ? contact.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : contact.phone.slice(-2);

  return (
    <Card className="hover:shadow-md transition-shadow border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border-2 border-[hsl(var(--avivar-primary)/0.2)]">
            <AvatarImage src={contact.avatar_url || undefined} />
            <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] truncate">
                  {contact.name || 'Sem nome'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{contact.phone}</span>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onViewLeads}>
                    <Users className="h-4 w-4 mr-2" />
                    Ver Leads ({contact.lead_count || 0})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}`, '_blank')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Abrir WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {contact.email && (
                <div className="flex items-center gap-1 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{contact.email}</span>
                </div>
              )}
              {contact.company_name && (
                <div className="flex items-center gap-1 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{contact.company_name}</span>
                </div>
              )}
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))] border-0"
              >
                <Users className="h-3 w-3 mr-1" />
                {contact.lead_count || 0} leads
              </Badge>
              <Badge variant="outline" className="text-xs">
                {contact.source}
              </Badge>
              {contact.tags && contact.tags.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {contact.tags.length}
                </Badge>
              )}
            </div>
            
            <div className="mt-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
              <Calendar className="h-3 w-3 inline mr-1" />
              Último contato: {format(new Date(contact.last_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateContactDialog({ 
  open, 
  onOpenChange, 
  onCreate 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateContactData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<CreateContactData>({
    phone: '',
    name: '',
    email: '',
    company_name: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return;
    
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setFormData({ phone: '', name: '', email: '', company_name: '', notes: '' });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Novo Contato
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Nome do contato"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              placeholder="Nome da empresa"
              value={formData.company_name}
              onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre o contato..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.phone || isSubmitting}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
            >
              {isSubmitting ? 'Salvando...' : 'Criar Contato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AvivarContacts() {
  const { contacts, isLoading, isRefreshing, fetchContacts, createContact, deleteContact } = useAvivarContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'companies' | 'all'>('contacts');

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.company_name?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleCreateContact = async (data: CreateContactData) => {
    await createContact(data);
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contato? Os leads associados não serão excluídos.')) {
      await deleteContact(id);
    }
  };

  const handleViewLeads = (contact: AvivarContact) => {
    // Navigate to leads page filtered by contact
    window.location.href = `/avivar/leads?contact=${contact.id}`;
  };

  return (
    <AvivarSidebar>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">Listas</h1>
              <p className="text-[hsl(var(--avivar-muted-foreground))]">
                Gerencie seus contatos e empresas
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchContacts(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Contato
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-2 border-b border-[hsl(var(--avivar-border))]">
          <button
            onClick={() => setActiveTab('contacts')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === 'contacts'
                ? "border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-primary))]"
                : "border-transparent text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            )}
          >
            Contatos
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === 'companies'
                ? "border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-primary))]"
                : "border-transparent text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            )}
          >
            Empresas
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === 'all'
                ? "border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-primary))]"
                : "border-transparent text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            )}
          >
            Todos os contatos e empresas
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
            <Input
              placeholder="Buscar por nome, telefone, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)]">
                  <User className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{contacts.length}</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Contatos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                    {contacts.reduce((sum, c) => sum + (c.lead_count || 0), 0)}
                  </p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Leads Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                    {contacts.filter(c => c.company_name).length}
                  </p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Com Empresa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts List */}
        <ScrollArea className="h-[calc(100vh-420px)]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="border-[hsl(var(--avivar-border))]">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))] mb-4" />
              <h3 className="text-lg font-semibold text-[hsl(var(--avivar-foreground))] mb-2">
                {searchQuery ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
              </h3>
              <p className="text-[hsl(var(--avivar-muted-foreground))] mb-4">
                {searchQuery 
                  ? 'Tente ajustar sua busca'
                  : 'Contatos serão criados automaticamente quando alguém entrar em contato via WhatsApp'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Contato Manualmente
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={() => {/* TODO: Edit dialog */}}
                  onDelete={() => handleDeleteContact(contact.id)}
                  onViewLeads={() => handleViewLeads(contact)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Create Dialog */}
        <CreateContactDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={handleCreateContact}
        />
      </div>
    </AvivarSidebar>
  );
}
