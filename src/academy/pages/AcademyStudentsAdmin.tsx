import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, GraduationCap, Settings } from "lucide-react";
import { EnrollmentManagementPanel } from "../components/EnrollmentManagementPanel";
import { ClassSettingsPanel } from "../components/ClassSettingsPanel";

export function AcademyStudentsAdmin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pt-16 lg:pt-6 pb-6 overflow-x-hidden w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/academy")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Gerenciamento de Alunos
            </h1>
            <p className="text-sm text-muted-foreground">
              Administração de matrículas e turmas
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="enrollments">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="enrollments" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Matrículas
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enrollments" className="mt-6">
            <EnrollmentManagementPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <ClassSettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
