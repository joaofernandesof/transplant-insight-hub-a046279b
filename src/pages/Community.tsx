import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Search,
  MapPin,
  Building2,
  Crown,
  Star,
  Award,
  Trophy,
  Gem,
  Shield,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleLayout } from "@/components/ModuleLayout";

interface Member {
  id: string;
  user_id: string;
  name: string;
  email: string;
  clinic_name: string | null;
  city: string | null;
  state: string | null;
  tier: string | null;
  avatar_url: string | null;
}

const tierIcons: Record<string, any> = { basic: Shield, pro: Star, expert: Award, master: Trophy, elite: Gem, titan: Crown, legacy: Sparkles };
const tierColors: Record<string, string> = { basic: 'bg-slate-100 text-slate-700', pro: 'bg-blue-100 text-blue-700', expert: 'bg-purple-100 text-purple-700', master: 'bg-amber-100 text-amber-700', elite: 'bg-rose-100 text-rose-700', titan: 'bg-emerald-100 text-emerald-700', legacy: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700' };

export default function Community() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('name');
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || member.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) || member.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'all' || member.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const uniqueStates = [...new Set(members.map(m => m.state).filter(Boolean))].sort();
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ModuleLayout>
      <div className="p-4 lg:p-6 lg:pt-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Comunidade
          </h1>
          <p className="text-sm text-muted-foreground">Conecte-se com outros licenciados</p>
        </div>

        {/* Hero Section */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-8 text-center">
            <Users className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Comunidade ByNeofolic</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Conecte-se com outros licenciados, compartilhe experiências e cresça junto com a rede.</p>
            <div className="mt-6 flex justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{members.length}</p>
                <p className="text-sm text-muted-foreground">Licenciados</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{uniqueStates.length}</p>
                <p className="text-sm text-muted-foreground">Estados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, clínica ou cidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-background">
                <option value="all">Todos os estados</option>
                {uniqueStates.map(state => <option key={state} value={state!}>{state}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Members Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum membro encontrado</h3>
              <p className="text-muted-foreground">Tente ajustar os filtros de busca.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member) => {
              const TierIcon = tierIcons[member.tier || 'basic'] || Shield;
              const tierColor = tierColors[member.tier || 'basic'] || tierColors.basic;
              const isCurrentUser = member.user_id === user?.id;
              
              return (
                <Card key={member.id} className={`hover:shadow-lg transition-all ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <Avatar className="h-20 w-20 mx-auto mb-3">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      {isCurrentUser && <Badge variant="outline" className="mt-1">Você</Badge>}
                    </div>
                    
                    {member.clinic_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{member.clinic_name}</span>
                      </div>
                    )}
                    
                    {(member.city || member.state) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{member.city}{member.city && member.state ? ', ' : ''}{member.state}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Badge className={tierColor}>
                        <TierIcon className="h-3 w-3 mr-1" />
                        {(member.tier || 'basic').charAt(0).toUpperCase() + (member.tier || 'basic').slice(1)}
                      </Badge>
                      {!isCurrentUser && <Button variant="ghost" size="sm" className="text-primary"><MessageCircle className="h-4 w-4" /></Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
