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
}: GenericTableProps<TData>) {
  if (isLoading && data.length === 0) {
    return <div className="p-8 text-center text-slate-500">Loading data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
        <Table className="text-left">
          <TableHeader className="bg-slate-50">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key as string}
                  className={`h-12 pr-4 text-left text-md align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0 ${
                    col.className || ''
                  }`}
                >
                  {col.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent font-medium text-md"
                      onClick={() => onSort(col.key as string)}
                    >
                      {col.header}
                      {sorting.key !== col.key ? (
                        <ArrowUpDown />
                      ) : sorting.direction === 'asc' ? (
                        <ArrowUp />
                      ) : (
                        <ArrowDown />
                      )}
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-4 text-center h-24 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
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
                  className="h-24 text-center align-middle text-slate-500"
                >
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-slate-500 hidden md:block">
          Đang xem {(meta.page - 1) * meta.pageSize + 1} -{' '}
          {Math.min(meta.page * meta.pageSize, meta.total)} trong tổng {meta.total} dữ liệu
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Số dòng trên trang</p>
            <div className="w-[70px]">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => onPageSizeChange(Number(val))}
              >
                <SelectTrigger className="h-8 w-full">
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
  );
}
