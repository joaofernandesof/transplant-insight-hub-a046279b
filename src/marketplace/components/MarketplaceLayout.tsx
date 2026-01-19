import { ReactNode } from "react";
import { ModuleSidebar } from "@/components/ModuleSidebar";

interface MarketplaceLayoutProps {
  children: ReactNode;
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <ModuleSidebar>
      <div className="min-h-screen bg-marketplace-background">
        {children}
      </div>
    </ModuleSidebar>
  );
}
