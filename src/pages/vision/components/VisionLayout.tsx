/**
 * VisionLayout - Main layout wrapper for Vision portal with header + bottom nav
 */

import { ReactNode, useState } from "react";
import { VisionHeader } from "./VisionHeader";
import { VisionBottomNav } from "./VisionBottomNav";
import { ScanPlansModal } from "./ScanPlansModal";

interface VisionLayoutProps {
  children: ReactNode;
  onStartAnalysis?: () => void;
}

export function VisionLayout({ children, onStartAnalysis }: VisionLayoutProps) {
  const [showPlansModal, setShowPlansModal] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <VisionHeader />
      
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      <VisionBottomNav 
        onOpenPlans={() => setShowPlansModal(true)}
        onStartAnalysis={onStartAnalysis}
      />

      <ScanPlansModal 
        open={showPlansModal} 
        onOpenChange={setShowPlansModal}
      />
    </div>
  );
}
