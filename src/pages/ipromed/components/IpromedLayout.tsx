/**
 * IPROMED Layout - Layout dedicado com Sidebar Astrea
 * Wrapper para todas as páginas do portal IPROMED
 */

import { ReactNode } from "react";
import AstreaStyleSidebar from "./AstreaStyleSidebar";

interface IpromedLayoutProps {
  children: ReactNode;
}

export default function IpromedLayout({ children }: IpromedLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AstreaStyleSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
