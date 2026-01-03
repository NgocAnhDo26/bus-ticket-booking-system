import React from 'react';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ColumnDef<TData> {
  key: keyof TData | 'actions';
  header: string;
  cell?: (item: TData) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface GenericTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading: boolean;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  pageIndex: number;
  pageSize: number;
  sorting: { key: string | null; direction: 'asc' | 'desc' };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort: (key: string) => void;
  getRowId: (row: TData) => React.Key;
}

export function GenericTable<TData>({
  data,
  columns,
  isLoading,
  meta,
  pageIndex,
  pageSize,
  sorting,
  onPageChange,
  onPageSizeChange,
  onSort,
  getRowId,
  hidePagination = false,
}: GenericTableProps<TData> & { hidePagination?: boolean }) {
  const skeletonRowCount = 5;
  const skeletonWidths = ['w-24', 'w-32', 'w-40', 'w-28', 'w-36'];

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table className="text-left">
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key as string}
                  className={`h-12 pr-4 text-left text-md align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${
                    col.className || ''
                  }`}
                >
                  {col.sortable ? (
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 cursor-pointer"
                        onClick={() => onSort(col.key as string)}
                      >
                        {sorting.key !== col.key ? (
                          <ArrowUpDown className="h-4 w-4" />
                        ) : sorting.direction === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIdx) => (
                <TableRow key={`skeleton-${rowIdx}`} className="hover:bg-transparent">
                  {columns.map((col, colIdx) => (
                    <TableCell
                      key={`skeleton-${rowIdx}-${String(col.key)}`}
                      className="[&:has([role=checkbox])]:pr-0"
                    >
                      <Skeleton
                        className={`h-4 ${
                          col.key === 'actions'
                            ? 'w-16'
                            : skeletonWidths[(rowIdx + colIdx) % skeletonWidths.length]
                        }`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row) => {
                const rowId = getRowId(row);
                return (
                  <TableRow key={rowId}>
                    {columns.map((col) => (
                      <TableCell
                        key={`${String(rowId)}-${col.key as string}`}
                        className="[&:has([role=checkbox])]:pr-0"
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.key !== 'actions'
                            ? String(row[col.key as keyof TData] ?? '')
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center align-middle text-muted-foreground"
                >
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!hidePagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground hidden lg:block">
            <span className="font-medium">Tổng:</span>
            <span> {meta.total} dữ liệu</span>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Số dòng trên trang</p>
              <div className="w-[70px]">
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => onPageSizeChange(Number(val))}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue placeholder={String(pageSize)} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 50].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Trang {meta.page} / {meta.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => onPageChange(1)}
                  disabled={pageIndex === 1 || isLoading}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(pageIndex - 1)}
                  disabled={pageIndex === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(pageIndex + 1)}
                  disabled={pageIndex >= meta.totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => onPageChange(meta.totalPages)}
                  disabled={pageIndex >= meta.totalPages || isLoading}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
