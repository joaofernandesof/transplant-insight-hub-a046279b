// ====================================
// PageLayout - Layout padrão para páginas com breadcrumb fixo
// ====================================

import React from 'react';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';

interface PageLayoutProps {
  children: React.ReactNode;
  /** Título da página (h1) */
  title?: string;
  /** Descrição sob o título */
  description?: string;
  /** Conteúdo adicional no cabeçalho (botões, filtros) */
  headerActions?: React.ReactNode;
  /** Padding padrão */
  noPadding?: boolean;
  /** Ocultar breadcrumb */
  hideBreadcrumb?: boolean;
}

export function PageLayout({
  children,
  title,
  description,
  headerActions,
  noPadding = false,
  hideBreadcrumb = false,
}: PageLayoutProps) {
  return (
    <div className={noPadding ? '' : 'p-4 lg:p-6 space-y-4'}>
      {/* Breadcrumb fixo */}
      {!hideBreadcrumb && <GlobalBreadcrumb />}
      
      {/* Header com título e ações */}
      {(title || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {title && (
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {headerActions && (
            <div className="flex items-center gap-3 flex-wrap">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      {/* Conteúdo da página */}
      {children}
    </div>
  );
}
