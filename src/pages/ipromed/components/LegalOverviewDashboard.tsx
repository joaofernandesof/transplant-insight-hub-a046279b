/**
 * IPROMED Legal Hub - Overview Dashboard (Astrea Style)
 * Área de trabalho principal com layout inspirado no Astrea
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import AstreaTaskList from "./AstreaTaskList";
import AstreaGuidedTour from "./AstreaGuidedTour";
import { ActivityWidget, CasesWidget, StatsWidget } from "./AstreaStyleWidgets";

export default function LegalOverviewDashboard() {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Task List */}
          <AstreaTaskList />
        </div>

        {/* Right Sidebar Widgets */}
        <div className="w-80 flex-shrink-0 space-y-4">
          <ActivityWidget />
          <CasesWidget />
          <StatsWidget />
        </div>
      </div>

      {/* Guided Tour */}
      <AstreaGuidedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => setShowTour(false)}
      />

      {/* Help Button to Start Tour */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 gap-2 shadow-lg"
        onClick={() => setShowTour(true)}
      >
        <HelpCircle className="h-4 w-4" />
        Tour Guiado
      </Button>
    </>
  );
}