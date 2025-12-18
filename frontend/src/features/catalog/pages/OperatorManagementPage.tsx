import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Building2, Globe, Mail, MoreHorizontal, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import * as z from 'zod';

import { type ColumnDef, GenericTable } from '@/components/common';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

import { useCreateOperator, useDeleteOperator, useOperators, useUpdateOperator } from '../hooks';
import type { Operator } from '../types';

const formSchema = z.object({
    name: z.string().min(1, 'Tên nhà xe là bắt buộc'),
    phone: z.string().min(1, 'Số điện thoại là bắt buộc'),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    website: z.string().url('Website không hợp lệ').optional().or(z.literal('')),
});

export const OperatorManagementPage = () => {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const { data: operators, isLoading } = useOperators();
    const createOperator = useCreateOperator();
    const updateOperator = useUpdateOperator();
    const deleteOperator = useDeleteOperator();
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [deletingOperator, setDeletingOperator] = useState<Operator | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            website: '',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const payload = {
            name: values.name,
            contactInfo: {
                phone: values.phone,
                email: values.email || undefined,
                website: values.website || undefined,
            },
        };

        if (editingOperator) {
            updateOperator.mutate(
                { id: editingOperator.id, data: payload },
                {
                    onSuccess: () => {
                        setIsOpen(false);
                        setEditingOperator(null);
                        reset();
                    },
                },
            );
        } else {
            createOperator.mutate(payload, {
                onSuccess: () => {
                    setIsOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = useCallback(
        (operator: Operator) => {
            setEditingOperator(operator);
            reset({
                name: operator.name,
                phone: operator.contactInfo?.phone || '',
                email: operator.contactInfo?.email || '',
                website: operator.contactInfo?.website || '',
            });
            setIsOpen(true);
        },
        [reset],
    );

    const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);

    const handleDelete = () => {
        if (deletingOperator) {
            deleteOperator.mutate(
                { id: deletingOperator.id },
                {
                    onSuccess: () => {
                        setDeletingOperator(null);
                    },
                    onError: (error: Error) => {
                        const axiosError = error as AxiosError;
                        if (axiosError.response?.status === 409) {
                            setForceDeleteId(deletingOperator.id);
                            setDeletingOperator(null);
                        }
                    },
                },
            );
        }
    };

    const handleForceDelete = () => {
        if (forceDeleteId) {
            deleteOperator.mutate(
                { id: forceDeleteId, force: true },
                {
                    onSuccess: () => {
                        setForceDeleteId(null);
                        queryClient.invalidateQueries({ queryKey: ['operators'] });
                    },
                },
            );
        }
    };

    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sorting, setSorting] = useState<{
        key: string | null;
        direction: 'asc' | 'desc';
    }>({ key: 'name', direction: 'asc' });

    const sortedPaged = useMemo(() => {
        if (!operators) return { data: [], total: 0, totalPages: 1, page: 1 };
        const arr = [...operators];

        if (sorting.key) {
            const key = sorting.key as keyof Operator;
            arr.sort((a, b) => {
                const aVal = a[key] as unknown;
                const bVal = b[key] as unknown;
                if (aVal == null || bVal == null) return 0;
                if (aVal < bVal) return sorting.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sorting.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const total = arr.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(pageIndex, totalPages);
        const start = (safePage - 1) * pageSize;
        const end = start + pageSize;

        return {
            data: arr.slice(start, end),
            total,
            totalPages,
            page: safePage,
        };
    }, [operators, pageIndex, pageSize, sorting]);

    const meta = {
        total: sortedPaged.total,
        page: sortedPaged.page,
        pageSize,
        totalPages: sortedPaged.totalPages,
    };

    const columns: ColumnDef<Operator>[] = useMemo(
        () => [
            {
                key: 'name',
                header: 'Tên nhà xe',
                sortable: true,
                cell: (operator) => (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{operator.name}</span>
                    </div>
                ),
            },
            {
                key: 'contactInfo',
                header: 'Liên hệ',
                cell: (operator) => (
                    <div className="flex flex-col gap-1 text-sm">
                        {operator.contactInfo?.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {operator.contactInfo.phone}
                            </div>
                        )}
                        {operator.contactInfo?.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {operator.contactInfo.email}
                            </div>
                        )}
                        {operator.contactInfo?.website && (
                            <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                <a
                                    href={operator.contactInfo.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    Website
                                </a>
                            </div>
                        )}
                    </div>
                ),
            },
            {
                key: 'isActive',
                header: 'Trạng thái',
                sortable: true,
                cell: (operator) => (
                    <Badge variant={operator.isActive ? 'success' : 'default'}>
                        {operator.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </Badge>
                ),
            },
            {
                key: 'actions',
                header: '',
                cell: (operator) => (
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
                                <DropdownMenuItem onClick={() => handleEdit(operator)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDeletingOperator(operator)}
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
        ],
        [handleEdit],
    );

    return (
        <div className="flex flex-col gap-8 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhà xe</h1>
                <Sheet
                    open={isOpen}
                    onOpenChange={(open) => {
                        setIsOpen(open);
                        if (!open) {
                            setEditingOperator(null);
                            reset({
                                name: '',
                                phone: '',
                                email: '',
                                website: '',
                            });
                        }
                    }}
                >
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Thêm Nhà xe
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{editingOperator ? 'Cập nhật Nhà xe' : 'Thêm Nhà xe mới'}</SheetTitle>
                            <SheetDescription>Nhập thông tin chi tiết về nhà xe mới.</SheetDescription>
                        </SheetHeader>
                        <div className="py-4">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <FormField label="Tên nhà xe" error={errors.name?.message}>
                                    <Input placeholder="Phương Trang" {...register('name')} />
                                </FormField>
                                <FormField label="Số điện thoại" error={errors.phone?.message}>
                                    <Input placeholder="0909..." {...register('phone')} />
                                </FormField>
                                <FormField label="Email" error={errors.email?.message}>
                                    <Input placeholder="contact@example.com" {...register('email')} />
                                </FormField>
                                <FormField label="Website" error={errors.website?.message}>
                                    <Input placeholder="https://example.com" {...register('website')} />
                                </FormField>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={createOperator.isPending || updateOperator.isPending}
                                >
                                    {createOperator.isPending || updateOperator.isPending
                                        ? 'Đang xử lý...'
                                        : editingOperator
                                            ? 'Cập nhật'
                                            : 'Tạo Nhà xe'}
                                </Button>
                            </form>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Nhà xe</CardTitle>
                </CardHeader>
                <CardContent>
                    <GenericTable<Operator>
                        data={sortedPaged.data}
                        columns={columns}
                        isLoading={isLoading}
                        meta={meta}
                        pageIndex={meta.page}
                        pageSize={pageSize}
                        sorting={sorting}
                        onPageChange={setPageIndex}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPageIndex(1);
                        }}
                        onSort={(key) =>
                            setSorting((prev) =>
                                prev.key === key
                                    ? {
                                        key,
                                        direction: prev.direction === 'asc' ? 'desc' : 'asc',
                                    }
                                    : { key, direction: 'asc' },
                            )
                        }
                        getRowId={(operator) => operator.id}
                    />
                </CardContent>
            </Card>

            <AlertDialog
                open={!!deletingOperator}
                onOpenChange={(open) => !open && setDeletingOperator(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Nhà xe này sẽ bị xóa vĩnh viễn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            {deleteOperator.isPending ? 'Đang xóa...' : 'Xóa'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!forceDeleteId} onOpenChange={(open) => !open && setForceDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cảnh báo: Dữ liệu liên quan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Nhà xe này đang có các xe buýt và chuyến đi liên quan. Bạn có muốn xóa BẮT BUỘC không?
                            Hành động này sẽ xóa tất cả các dữ liệu liên quan (xe buýt, chuyến đi, vé).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleForceDelete}
                        >
                            {deleteOperator.isPending ? 'Đang xóa...' : 'Xóa bắt buộc'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
