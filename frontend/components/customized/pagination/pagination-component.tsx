import { useI18n } from '@/app/providers/i18n';
import { buttonVariants } from '@/components/ui/button';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationComponent({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const { t } = useI18n();

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            {i === currentPage ? (
              <PaginationLink
                onClick={() => onPageChange(i)}
                isActive={i === currentPage}
                className={cn(
                  '!shadow-none hover:!text-primary-foreground',
                  buttonVariants({
                    size: 'sm',

                  }),
                )}
              >
                {i}
              </PaginationLink>
            ) : (
              <PaginationLink
                onClick={() => onPageChange(i)}
                isActive={i === currentPage}
                className="h-7"
              >
                {i}
              </PaginationLink>
            )}
          </PaginationItem>,
        );
      }
    } else {
      
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);

      if (start > 1) {
        items.push(
          <PaginationItem key={1}>
            <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
          </PaginationItem>,
        );
        if (start > 2) items.push(<PaginationEllipsis key="start-ellipsis" />);
      }

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            {i === currentPage ? (
              <PaginationLink
                onClick={() => onPageChange(i)}
                isActive={i === currentPage}
                className={cn(
                  '!shadow-none hover:!text-primary-foreground',
                  buttonVariants({
                    variant: 'default',
                    size: 'icon',
                  }),
                )}
              >
                {i}
              </PaginationLink>
            ) : (
              <PaginationLink
                onClick={() => onPageChange(i)}
                isActive={i === currentPage}
              >
                {i}
              </PaginationLink>
            )}
          </PaginationItem>,
        );
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          items.push(<PaginationEllipsis key="end-ellipsis" />);
        }
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>,
        );
      }
    }

    return items;
  };

  return (
    <Pagination className="pt-6">
      <PaginationContent>
        {/* */}
        <PaginationItem>
          <PaginationLink
            className="w-10 h-7"
            onClick={() => onPageChange(1)}
            isActive={Boolean(currentPage === 1)}
          >
            <span className="text-xs font-medium">{t('common.firstPage')}</span>
          </PaginationLink>
        </PaginationItem>

        {/* */}
        <PaginationItem>
          <PaginationPrevious
            className="text-xs font-medium h-7"
            onClick={() => onPageChange(currentPage - 1)}
            isActive={currentPage === 1}
          />
          {/* */}
        </PaginationItem>

        {/* */}
        {renderPaginationItems()}

        {/* */}
        <PaginationItem>
          <PaginationNext
            className="text-xs font-medium h-7"
            onClick={() => onPageChange(currentPage + 1)}
            isActive={currentPage === totalPages}
          />
          {/* */}
        </PaginationItem>

        {/* */}
        <PaginationItem>
          <PaginationLink
            onClick={() => onPageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="w-10 h-7"
          >
            <span className="text-xs font-medium">{t('common.lastPage')}</span>
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
