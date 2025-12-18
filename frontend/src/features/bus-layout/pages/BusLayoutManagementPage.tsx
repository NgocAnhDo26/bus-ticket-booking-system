import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import { type ColumnDef, GenericTable } from '@/components/common/GenericTable';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useBusLayouts, useDeleteBusLayout } from '../hooks';
import { type BusLayout } from '../types';

export const BusLayoutManagementPage = () => {
    const navigate = useNavigate();
    const { data: layouts, isLoading } = useBusLayouts();
    const deleteLayout = useDeleteBusLayout();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sorting, setSorting] = useState<{
        key: string | null;
        direction: 'asc' | 'desc';
    }>({
        key: null,
        direction: 'asc',
    });

    const handleDelete = () => {
        if (deletingId) {
            deleteLayout.mutate(deletingId, {
                onSuccess: () => setDeletingId(null),
            });
        }
    };

    const columns: ColumnDef<BusLayout>[] = [
        {
            header: 'Tên cấu hình',
            key: 'name',
            sortable: true,
        },
        {
            header: 'Loại xe',
            key: 'busType',
            sortable: true,
        },
        {
            header: 'Số tầng',
            key: 'totalFloors',
        },
        {
            header: 'Số ghế',
            key: 'totalSeats',
            sortable: true,
        },
        {
            header: 'Mô tả',
            key: 'description',
        },
        {
            key: 'actions',
            header: '',
            cell: (layout) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigate(`/admin/catalog/layouts/edit/${layout.id}`)}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeletingId(layout.id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    // Helper for client-side pagination since API currently returns all
    // In a real app, the API should handle pagination
    const filteredData = layouts || [];
    const total = filteredData.length;
    const totalPages = Math.ceil(total / pageSize);

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sorting.key) return 0;
        const aValue = a[sorting.key as keyof BusLayout];
        const bValue = b[sorting.key as keyof BusLayout];

        if (aValue === bValue) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sorting.direction === 'asc' ? comparison : -comparison;
    });

    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="flex flex-col gap-8 p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý sơ đồ xe</h1>
                    <p className="text-sm text-muted-foreground">
                        Danh sách các sơ đồ ghế được cấu hình trong hệ thống.
                    </p>
                </div>
                <Button onClick={() => navigate('/admin/catalog/layouts/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo mới
                </Button>
            </div>

            <GenericTable
                columns={columns}
                data={paginatedData}
                isLoading={isLoading}
                pageIndex={page}
                pageSize={pageSize}
                meta={{
                    total,
                    page,
                    pageSize,
                    totalPages: totalPages || 1,
                }}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
                sorting={sorting}
                onSort={(key) => {
                    setSorting((prev) => ({
                        key,
                        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
                    }));
                }}
                getRowId={(row) => row.id}
            />

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Sơ đồ này sẽ bị xóa vĩnh viễn. Lưu ý: Không thể xóa
                            sơ đồ đang được sử dụng bởi xe.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            {deleteLayout.isPending ? 'Đang xóa...' : 'Xóa'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
