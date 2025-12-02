import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ColumnDef<TData> {
  key: keyof TData | "actions";
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
  sorting: { key: string | null; direction: "asc" | "desc" };
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
    return (
      <div className="p-8 text-center text-slate-500">Loading data...</div>
    );
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
                  className={`h-12 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0 ${
                    col.className || ""
                  }`}
                >
                  {col.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => onSort(col.key as string)}
                    >
                      {col.header}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                      {sorting.key === col.key && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({sorting.direction.toUpperCase()})
                        </span>
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
                <TableCell
                  colSpan={columns.length}
                  className="p-4 text-center h-24 text-slate-500"
                >
                  Refreshing...
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
                          : col.key !== "actions"
                            ? String(row[col.key as keyof TData] ?? "")
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-slate-500 hidden md:block">
          Showing {(meta.page - 1) * meta.pageSize + 1} to{" "}
          {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}{" "}
          entries
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <div className="w-[70px]">
              <Combobox
                value={String(pageSize)}
                onSelect={(val) => onPageSizeChange(Number(val))}
                options={[
                  { label: "5", value: "5" },
                  { label: "10", value: "10" },
                  { label: "20", value: "20" },
                  { label: "50", value: "50" },
                ]}
              />
            </div>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {meta.page} of {meta.totalPages}
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
