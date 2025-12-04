import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type TopOperatorResponse } from "../types";

interface MostActiveOperatorsProps {
  operators: TopOperatorResponse[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const MostActiveOperators = ({
  operators = [],
}: MostActiveOperatorsProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Top Nhà Xe Hoạt Động</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhà xe</TableHead>
              <TableHead className="text-right">Vé bán</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operators.length > 0 ? (
              operators.map((operator) => (
                <TableRow key={operator.operatorId}>
                  <TableCell className="font-medium">
                    {operator.operatorName}
                  </TableCell>
                  <TableCell className="text-right">
                    {operator.ticketsSold}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(operator.totalRevenue)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
