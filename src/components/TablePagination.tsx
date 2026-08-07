import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
};

const TablePagination = ({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
}: TablePaginationProps) => {
  const safeTotalPages = Math.max(1, totalPages);
  const currentPage = Math.min(Math.max(1, page), safeTotalPages);
  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <select
          className="h-7 rounded border border-border bg-background px-2 text-xs"
          value={pageSize}
          disabled={disabled}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="ml-2">
          {totalCount === 0 ? "0 of 0" : `${from}–${to} of ${totalCount}`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={disabled || currentPage === 1}
          onClick={() => onPageChange(1)}
        >
          « First
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={disabled || currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          ‹ Prev
        </Button>
        <span className="px-2 text-muted-foreground">
          Page {currentPage} of {safeTotalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={disabled || currentPage === safeTotalPages}
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
        >
          Next ›
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={disabled || currentPage === safeTotalPages}
          onClick={() => onPageChange(safeTotalPages)}
        >
          Last »
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;
