import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { KeyRound, Plus, Eye, Edit3, Trash2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, Column, PaginationData } from '@/components/data-table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import { cn } from '@/lib/utils';

interface PermissionItem {
    id: number;
    name: string;
    display_name: string;
    description: string;
    module: string;
}

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' }, { title: 'Daftar Permission' },
];

export default function PermissionIndexPage() {
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState<PermissionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedModule, setSelectedModule] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/permissions');
            if (res.data?.data) {
                setPermissions(res.data.data);
            }
        } catch {
            toast.error('Gagal memuat daftar permission');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleDelete = (id: number, name: string) => {
        setDeleteTarget({ id, name });
    };

    const modules = useMemo(() => {
        return Array.from(new Set(permissions.map((p) => p.module || 'Umum'))).sort();
    }, [permissions]);

    const filtered = useMemo(() => {
        return permissions.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.display_name && p.display_name.toLowerCase().includes(search.toLowerCase())) ||
                (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
            const matchesMod = selectedModule === 'all' || (p.module || 'Umum') === selectedModule;
            return matchesSearch && matchesMod;
        });
    }, [permissions, search, selectedModule]);

    const paginatedPermissions = useMemo(() => {
        const start = (page - 1) * perPage;
        return filtered.slice(start, start + perPage);
    }, [filtered, page, perPage]);

    const pagination: PaginationData = useMemo(() => {
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const from = total === 0 ? 0 : (page - 1) * perPage + 1;
        const to = Math.min(from + perPage - 1, total);
        return {
            current_page: page,
            last_page: totalPages,
            per_page: perPage,
            total,
            from,
            to,
        };
    }, [filtered.length, page, perPage]);

    const columns: Column<PermissionItem>[] = [
        {
            key: 'name',
            label: 'System Code & Label',
            className: 'min-w-[260px]',
            render: (row) => (
                <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                        {row.display_name || row.name}
                    </div>
                    <div className="font-mono text-xs text-neutral-500 font-medium">
                        {row.name}
                    </div>
                </div>
            ),
        },
        {
            key: 'module',
            label: 'Modul',
            className: 'w-48',
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 rounded-none">
                    <Layers className="size-3 text-neutral-500" />
                    {row.module || 'Umum'}
                </span>
            ),
        },
        {
            key: 'description',
            label: 'Deskripsi Hak Akses',
            className: 'min-w-[280px] text-sm text-neutral-600 dark:text-neutral-400',
            render: (row) => row.description || <span className="text-neutral-400 italic">-</span>,
        },
        {
            key: 'aksi',
            label: 'Aksi',
            sortable: false,
            className: 'w-32 text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    {/* View Button (Blue) */}
                    <Can permission={['permission.view', 'permissions.view']}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                            title="Lihat Detail Permission"
                            onClick={() => navigate(`/permissions/${row.id}`)}
                        >
                            <Eye className="size-4" />
                        </Button>
                    </Can>

                    {/* Edit Button (Amber) */}
                    <Can permission={['permission.edit', 'permissions.edit']}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                            title="Edit Permission"
                            onClick={() => navigate(`/permissions/${row.id}/edit`)}
                        >
                            <Edit3 className="size-4" />
                        </Button>
                    </Can>

                    {/* Delete Button (Rose) */}
                    <Can permission={['permission.delete', 'permissions.delete']}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                            title="Hapus Permission"
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
        <Can permission={['permission.create', 'permissions.create']}>
            <Button
                size="sm"
                className="bg-black text-white hover:bg-neutral-800 rounded-none h-9 px-3.5 text-xs sm:text-sm font-semibold gap-1.5 shadow-none"
                onClick={() => navigate('/permissions/create')}
            >
                <Plus className="size-4" />
                Tambah Permission
            </Button>
        </Can>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <DataTable
                    columns={columns}
                    data={paginatedPermissions}
                    pagination={pagination}
                    onPageChange={(p) => setPage(p)}
                    onPerPageChange={(pp) => {
                        setPerPage(pp);
                        setPage(1);
                    }}
                    perPageOptions={[10, 20, 50, 100, 500]}
                    searchValue={search}
                    onSearch={(s) => {
                        setSearch(s);
                        setPage(1);
                    }}
                    rowKey={(row) => row.id}
                    cardIcon={<KeyRound className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />}
                    cardTitle="Daftar Hak Akses (Permissions)"
                    searchPlaceholder="Cari nama, kode atau deskripsi permission..."
                    headerActions={headerActions}
                    onRefresh={fetchPermissions}
                    emptyText={loading ? 'Memuat data permission...' : 'Tidak ada permission yang sesuai.'}
                />

                <ConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Hapus Hak Akses (Permission)"
                    description={
                        <span>
                            Apakah Anda yakin ingin menghapus hak akses{' '}
                            <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
                                "{deleteTarget?.name}"
                            </strong>
                            ? Fitur yang bergantung pada izin ini mungkin tidak dapat diakses pengguna.
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
                            await api.delete(`/permissions/${deleteTarget.id}`);
                            toast.success(`Permission "${deleteTarget.name}" berhasil dihapus`);
                            setPermissions((prev) => prev.filter((p) => p.id !== deleteTarget.id));
                            setDeleteTarget(null);
                        } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Gagal menghapus permission');
                        } finally {
                            setDeleteLoading(false);
                        }
                    }}
                />
            </div>
        </AppLayout>
    );
}
