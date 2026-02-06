import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, RefreshCw, Loader2, Upload, Users, Lock, UserCheck } from 'lucide-react';
import { useHotLeads } from '@/hooks/useHotLeads';
import { AvailableLeadCard } from '@/components/hotleads/AvailableLeadCard';
import { AcquiredLeadCard } from '@/components/hotleads/AcquiredLeadCard';
import { LeadAcquireDialog } from '@/components/hotleads/LeadAcquireDialog';
import { LeadImportDialog } from '@/components/hotleads/LeadImportDialog';
import { LeadExportButton } from '@/components/hotleads/LeadExportButton';
import type { HotLead } from '@/hooks/useHotLeads';

export default function HotLeads() {
  const { isAdmin } = useAuth();
  const {
    leads,
    availableLeads,
    myLeads,
    acquiredLeads,
    isLoading,
    isRefreshing,
    fetchLeads,
    acquireLead,
    importLeads,
    getClaimerName,
  } = useHotLeads();

  const [selectedLead, setSelectedLead] = useState<HotLead | null>(null);
  const [isAcquireOpen, setIsAcquireOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleAcquireClick = (lead: HotLead) => {
    setSelectedLead(lead);
    setIsAcquireOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2 pl-12 lg:pl-0">
              <Flame className="h-6 w-6 text-orange-500" />
              HotLeads
            </h1>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <LeadExportButton leads={leads} getClaimerName={getClaimerName} />
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLeads(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{availableLeads.length}</p>
                  <p className="text-xs text-muted-foreground">Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myLeads.length}</p>
                  <p className="text-xs text-muted-foreground">Meus Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acquiredLeads.length}</p>
                  <p className="text-xs text-muted-foreground">Adquiridos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available */}
          <div>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                Leads Disponíveis ({availableLeads.length})
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {availableLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum lead disponível no momento.
                </p>
              ) : (
                availableLeads.map(lead => (
                  <AvailableLeadCard
                    key={lead.id}
                    lead={lead}
                    onAcquire={handleAcquireClick}
                  />
                ))
              )}
            </div>
          </div>

          {/* My Leads */}
          <div>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                Meus Leads ({myLeads.length})
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {myLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Você ainda não adquiriu nenhum lead.
                </p>
              ) : (
                myLeads.map(lead => (
                  <AcquiredLeadCard
                    key={lead.id}
                    lead={lead}
                    claimerName={getClaimerName(lead.claimed_by)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Acquired by others */}
          <div>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                Leads Adquiridos ({acquiredLeads.length})
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {acquiredLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum lead adquirido por outros.
                </p>
              ) : (
                acquiredLeads.map(lead => (
                  <AcquiredLeadCard
                    key={lead.id}
                    lead={lead}
                    claimerName={getClaimerName(lead.claimed_by)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <LeadAcquireDialog
        lead={selectedLead}
        open={isAcquireOpen}
        onOpenChange={setIsAcquireOpen}
        onConfirm={acquireLead}
      />

      <LeadImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={importLeads}
      />
    </div>
  );
}
