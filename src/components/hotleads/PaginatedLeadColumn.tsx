import { useState, useMemo } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 15;

interface PaginatedLeadColumnProps {
  title: string;
  dotColor: string;
  items: any[];
  emptyMessage: string;
  renderItem: (item: any) => React.ReactNode;
}

export function PaginatedLeadColumn({ title, dotColor, items, emptyMessage, renderItem }: PaginatedLeadColumnProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, page]);

  // Reset to page 1 if items shrink
  if (page > totalPages) setPage(1);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 3;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="px-0 pt-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${dotColor}`} />
          {title} ({items.length})
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 min-h-0" style={{ height: 'calc(100vh - 280px)' }}>
        <div className="space-y-3 pr-2">
          {paginatedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
          ) : (
            paginatedItems.map(renderItem)
          )}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <Pagination className="mt-3">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={`cursor-pointer text-xs ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
              />
            </PaginationItem>
            {pageNumbers.map(n => (
              <PaginationItem key={n}>
                <PaginationLink
                  isActive={n === page}
                  onClick={() => setPage(n)}
                  className="cursor-pointer text-xs"
                >
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={`cursor-pointer text-xs ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
