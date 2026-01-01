import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TopOperatorResponse } from '@/model';

interface MostActiveOperatorsProps {
  operators: TopOperatorResponse[];
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const MostActiveOperators = ({ operators = [], isLoading }: MostActiveOperatorsProps) => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Top Nhà Xe</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="rounded-md border bg-card overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-muted-foreground">Nhà xe</TableHead>
                  <TableHead className="text-right text-muted-foreground">Vé đã bán</TableHead>
                  <TableHead className="text-right text-muted-foreground">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators.length > 0 ? (
                  operators.map((operator) => (
                    <TableRow key={operator.operatorId}>
                      <TableCell className="font-medium">{operator.operatorName}</TableCell>
                      <TableCell className="text-right">{operator.ticketsSold}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(operator.totalRevenue ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
