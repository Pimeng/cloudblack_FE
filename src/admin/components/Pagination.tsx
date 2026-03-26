import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  showPerPage?: boolean;
  total?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  perPage = 20,
  onPerPageChange,
  perPageOptions = [10, 20, 50, 100],
  showPerPage = false,
  total,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1 && !showPerPage) return null;

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {showPerPage && onPerPageChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">每页显示</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">条</span>
          {total !== undefined && (
            <span className="text-sm text-muted-foreground ml-2">
              共 {total} 条
            </span>
          )}
        </div>
      )}

      {!showPerPage && <div />}

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="outline"
            size="icon"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页
          </span>
          <Button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            variant="outline"
            size="icon"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// 简化版分页（仅上一页/下一页）
interface SimplePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  page,
  totalPages,
  onPageChange,
  className = '',
}: SimplePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        variant="outline"
        size="icon"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        第 {page} / {totalPages} 页
      </span>
      <Button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        variant="outline"
        size="icon"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// 带每页选择的分页（使用 shadcn Select）
interface SelectPaginationProps extends SimplePaginationProps {
  perPage: number;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
}

export function SelectPagination({
  page,
  totalPages,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions = [10, 20, 50, 100],
  className = '',
}: SelectPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">每页</span>
        <Select
          value={perPage.toString()}
          onValueChange={(v) => onPerPageChange(Number(v))}
        >
          <SelectTrigger className="w-[100px] bg-muted border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border">
            {perPageOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}/页
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          variant="outline"
          size="sm"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
