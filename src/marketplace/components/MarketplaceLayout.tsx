import { ReactNode } from "react";

interface MarketplaceLayoutProps {
  children: ReactNode;
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <div className="min-h-screen w-full min-w-0 bg-marketplace-background overflow-x-hidden">
      {children}
    </div>
  );
}
