import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Users, Plus, Eye, Edit3, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, Column, PaginationData } from '@/components/data-table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';

interface UserItem {
    id: number;
    name: string;
    nip: string;
    role_id: number;
    department_id: number;
    department?: {
        id: number;
        code: string;
        name: string;
    };
    created_at: string;
    role?: {
        id: number;
        name: string;
        display_name: string;
    };
}

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Daftar User' },
];

export default function UserIndexPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    const fetchUsers = useCallback(async (targetPage = page, targetPerPage = perPage, targetSearch = search) => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                page: targetPage,
                limit: targetPerPage,
            };
            if (targetSearch.trim()) {
                params.search = targetSearch.trim();
            }

            const res = await api.get('/users', { params });
            const list: UserItem[] = res.data.data || [];
            setUsers(list);

            const meta = res.data.meta;
            if (meta) {
                const total = Number(meta.total || 0);
                const p = Number(meta.current_page || 1);
                const limit = Number(meta.per_page || targetPerPage);
                const totalPages = Number(meta.total_pages || Math.max(1, Math.ceil(total / limit)));
                const from = total === 0 ? 0 : (p - 1) * limit + 1;
                const to = Math.min(from + limit - 1, total);

                setPagination({
                    current_page: p,
                    last_page: totalPages,
                    per_page: limit,
                    total: total,
                    from: from,
                    to: to,
                });
            }
        } catch {
            toast.error('Gagal memuat data pengguna dari database');
        } finally {
            setLoading(false);
        }
    }, [page, perPage, search]);

    useEffect(() => {
        fetchUsers(page, perPage, search);
    }, [page, perPage, search, fetchUsers]);

    const handleSearch = (newSearch: string) => {
        setSearch(newSearch);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteTarget({ id, name });
    };

    const columns: Column<UserItem>[] = [
        {
            key: 'name',
            label: 'Nama Pegawai & NIP',
            className: 'min-w-[260px]',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-700 dark:text-neutral-200 uppercase shrink-0">
                        {row.name.substring(0, 2)}
                    </div>
                    <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                            {row.name}
                        </div>
                        <div className="font-mono text-xs text-neutral-500">
                            NIP: {row.nip}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role / Peran',
            className: 'w-48',
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 rounded-none">
                    <Shield className="size-3 text-neutral-500" />
                    {row.role?.display_name || row.role?.name || (row.role_id ? `Role #${row.role_id}` : '-')}
                </span>
            ),
        },
        {
            key: 'department',
            label: 'Departemen',
            className: 'w-48 text-neutral-800 dark:text-neutral-200 text-xs',
            render: (row) =>
                row.department?.name ? (
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {row.department.name}
                    </span>
                ) : row.department_id ? (
                    <span className="text-neutral-500 font-mono">Dept #{row.department_id}</span>
                ) : (
                    <span className="text-neutral-400 italic">-</span>
                ),
        },
        {
            key: 'status',
            label: 'Status',
            className: 'w-28 text-center',
            render: () => (
                <span className="inline-block px-2.5 py-0.5 rounded-none text-xs font-medium border border-emerald-400 text-emerald-600 bg-emerald-50/30">
                    Aktif
                </span>
            ),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            sortable: false,
            className: 'w-32 text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    {/* View Button (Blue) */}
                    <Can permission={['user.view', 'users.view']}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                            title="Lihat Detail User"
                            onClick={() => navigate(`/users/${row.id}`)}
                        >
                            <Eye className="size-4" />
                        </Button>
                    </Can>

                    {/* Edit Button (Amber) */}
                    <Can permission={['user.edit', 'users.edit']}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                            title="Edit User"
                            onClick={() => navigate(`/users/${row.id}/edit`)}
                        >
                            <Edit3 className="size-4" />
                        </Button>
                    </Can>

                    {/* Delete Button (Rose) */}
                    <Can permission={['user.delete', 'users.delete']}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                            title="Hapus User"
                            onClick={() => handleDelete(row.id, row.name)}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </Can>
                </div>
            ),
        },
    ];

    const headerActions = (
        <Can permission={['user.create', 'users.create']}>
            <Button
                size="sm"
                className="bg-black text-white hover:bg-neutral-800 rounded-none h-9 px-3.5 text-xs sm:text-sm font-semibold gap-1.5 shadow-none"
                onClick={() => navigate('/users/create')}
            >
                <Plus className="size-4" />
                Tambah User
            </Button>
        </Can>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <DataTable
                    columns={columns}
                    data={users}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    perPageOptions={[10, 20, 50, 100, 500]}
                    searchValue={search}
                    onSearch={handleSearch}
                    rowKey={(row) => row.id}
                    cardIcon={<Users className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />}
                    cardTitle="Daftar User Pegawai"
                    searchPlaceholder="Cari nama pegawai atau NIP..."
                    headerActions={headerActions}
                    onRefresh={() => fetchUsers(page, perPage, search)}
                    emptyText={loading ? 'Memuat data pengguna...' : 'Tidak ada data pengguna yang sesuai.'}
                />

                <ConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Hapus Akun Pengguna"
                    description={
                        <span>
                            Apakah Anda yakin ingin menghapus akun pengguna{' '}
                            <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
                                "{deleteTarget?.name}"
                            </strong>
                            ? Pengguna tidak akan dapat masuk ke sistem lagi.
                        </span>
                    }
                    confirmText="Ya, Hapus"
                    cancelText="Batal"
                    variant="destructive"
                    loading={deleteLoading}
                    onConfirm={async () => {
                        if (!deleteTarget) return;
                        setDeleteLoading(true);
                        try {
                            await api.delete(`/users/${deleteTarget.id}`);
                            toast.success(`Pengguna "${deleteTarget.name}" berhasil dihapus`);
                            setDeleteTarget(null);
                            fetchUsers(page, perPage, search);
                        } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Gagal menghapus pengguna');
                        } finally {
                            setDeleteLoading(false);
                        }
                    }}
                />
            </div>
        </AppLayout>
    );
}
