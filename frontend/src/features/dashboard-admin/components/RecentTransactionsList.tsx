"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Transaction {
  id: string;
  customerName: string;
  route: string;
  totalAmount: number;
  state: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  bookedAt: Date;
}

interface RecentTransactionsListProps {
  limit?: number;
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: "TXN-001",
    customerName: "Nguyễn Văn A",
    route: "Hà Nội - Hồ Chí Minh",
    totalAmount: 450000,
    state: "CONFIRMED",
    bookedAt: new Date("2024-01-15T10:30:00"),
  },
  {
    id: "TXN-002",
    customerName: "Trần Thị B",
    route: "Đà Nẵng - Hà Nội",
    totalAmount: 320000,
    state: "CONFIRMED",
    bookedAt: new Date("2024-01-15T09:15:00"),
  },
  {
    id: "TXN-003",
    customerName: "Lê Văn C",
    route: "Hồ Chí Minh - Cần Thơ",
    totalAmount: 180000,
    state: "PENDING",
    bookedAt: new Date("2024-01-15T08:45:00"),
  },
  {
    id: "TXN-004",
    customerName: "Phạm Thị D",
    route: "Hà Nội - Hải Phòng",
    totalAmount: 120000,
    state: "CONFIRMED",
    bookedAt: new Date("2024-01-14T16:20:00"),
  },
  {
    id: "TXN-005",
    customerName: "Hoàng Văn E",
    route: "Hồ Chí Minh - Đà Lạt",
    totalAmount: 280000,
    state: "CANCELLED",
    bookedAt: new Date("2024-01-14T14:10:00"),
  },
  {
    id: "TXN-006",
    customerName: "Vũ Thị F",
    route: "Hà Nội - Quảng Ninh",
    totalAmount: 150000,
    state: "REFUNDED",
    bookedAt: new Date("2024-01-14T11:30:00"),
  },
  {
    id: "TXN-007",
    customerName: "Đặng Văn G",
    route: "Hồ Chí Minh - Nha Trang",
    totalAmount: 350000,
    state: "CONFIRMED",
    bookedAt: new Date("2024-01-13T20:15:00"),
  },
  {
    id: "TXN-008",
    customerName: "Bùi Thị H",
    route: "Đà Nẵng - Huế",
    totalAmount: 95000,
    state: "CONFIRMED",
    bookedAt: new Date("2024-01-13T18:45:00"),
  },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStateBadgeVariant = (
  state: Transaction["state"],
): "default" | "success" | "warning" => {
  switch (state) {
    case "CONFIRMED":
      return "success";
    case "PENDING":
      return "warning";
    case "CANCELLED":
    case "REFUNDED":
      return "default";
    default:
      return "default";
  }
};

const getStateLabel = (state: Transaction["state"]): string => {
  switch (state) {
    case "CONFIRMED":
      return "Đã xác nhận";
    case "PENDING":
      return "Đang chờ";
    case "CANCELLED":
      return "Đã hủy";
    case "REFUNDED":
      return "Đã hoàn tiền";
    default:
      return state;
  }
};

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Mã giao dịch
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Tên khách hàng
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("customerName")}</div>,
  },
  {
    accessorKey: "route",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Tuyến đường
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("route")}</div>,
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Tổng tiền
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount"));
      return (
        <div className="text-right font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    accessorKey: "state",
    header: () => <div className="text-center">Trạng thái</div>,
    cell: ({ row }) => {
      const state = row.getValue("state") as Transaction["state"];
      return (
        <div className="text-center">
          <Badge variant={getStateBadgeVariant(state)}>
            {getStateLabel(state)}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "bookedAt",
    header: ({ column }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Thời gian đặt
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("bookedAt") as Date;
      return (
        <div className="text-center text-muted-foreground">
          {formatDateTime(date)}
        </div>
      );
    },
  },
];

export const RecentTransactionsList = ({
  limit = 5,
}: RecentTransactionsListProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const data = React.useMemo(() => mockTransactions.slice(0, limit), [limit]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giao dịch gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
