/**
 * IPROMED - Workspace Quick Actions
 * Ações rápidas para acessar funcionalidades frequentes
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileSignature,
  Users,
  CalendarPlus,
  ClipboardList,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickActions = [
  {
    id: 'new-task',
    label: 'Nova Tarefa',
    icon: Plus,
    route: '/ipromed/legal',
    color: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  {
    id: 'new-client',
    label: 'Novo Cliente',
    icon: Users,
    route: '/ipromed/clients',
    color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'new-contract',
    label: 'Novo Contrato',
    icon: FileSignature,
    route: '/ipromed/contracts',
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    id: 'new-appointment',
    label: 'Agendar',
    icon: CalendarPlus,
    route: '/ipromed/agenda',
    color: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  {
    id: 'new-case',
    label: 'Novo Processo',
    icon: Briefcase,
    route: '/ipromed/cases',
    color: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  {
    id: 'ia-juridica',
    label: 'IA Jurídica',
    icon: MessageSquare,
    route: '/ipromed/ia-juridica',
    color: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white',
  },
];

export function WorkspaceQuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={`h-auto flex-col gap-2 py-4 ${action.color}`}
              onClick={() => navigate(action.route)}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
