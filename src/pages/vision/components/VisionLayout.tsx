/**
 * VisionLayout - Main layout wrapper for Vision portal with sidebar
 */

import { ReactNode, useState } from "react";
import { VisionSidebar } from "./VisionSidebar";
import { ScanPlansModal } from "./ScanPlansModal";

interface VisionLayoutProps {
  children: ReactNode;
  onStartAnalysis?: () => void;
}

export function VisionLayout({ children, onStartAnalysis }: VisionLayoutProps) {
  const [showPlansModal, setShowPlansModal] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <VisionSidebar 
        onOpenPlans={() => setShowPlansModal(true)}
        onStartAnalysis={onStartAnalysis}
      />
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <ScanPlansModal 
        open={showPlansModal} 
        onOpenChange={setShowPlansModal}
      />
    </div>
  );
}
