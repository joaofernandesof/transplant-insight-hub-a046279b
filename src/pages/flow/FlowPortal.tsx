/**
 * FlowPortal - Layout principal do portal Flow.do
 */

import { Outlet } from "react-router-dom";
import { FlowSidebar } from "@/components/flow/layout/FlowSidebar";
import { FlowHeader } from "@/components/flow/layout/FlowHeader";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function FlowPortal() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <FlowSidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <FlowHeader />
        
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
