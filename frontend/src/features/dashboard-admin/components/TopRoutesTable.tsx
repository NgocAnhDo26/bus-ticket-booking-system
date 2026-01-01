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
import type { TopRouteResponse } from '@/model';

export interface TopRoutesTableProps {
  routes?: TopRouteResponse[];
  isLoading?: boolean;
}

export const TopRoutesTable = ({ routes, isLoading }: TopRoutesTableProps) => {
  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Tuyến phổ biến</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Tuyến phổ biến</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tuyến</TableHead>
                <TableHead className="text-right">Vé đã bán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes?.length ? (
                routes.map((r) => (
                  <TableRow key={r.routeId}>
                    <TableCell className="font-medium">
                      {r.origin} → {r.destination}
                    </TableCell>
                    <TableCell className="text-right">{r.ticketsSold ?? 0}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
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
