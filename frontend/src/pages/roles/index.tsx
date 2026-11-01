import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Eye, Edit3, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, Column, PaginationData } from '@/components/data-table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';

interface RoleItem {
    id: number;
    name: string;
    display_name: string;
    description: string;
    permissions?: Array<{ id: number; name: string }>;
}

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' }, { title: 'Daftar Role' },
];

export default function RoleIndexPage() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await api.get('/roles');
            if (res.data?.data) {
                setRoles(res.data.data);
            }
        } catch {
            toast.error('Gagal memuat data role');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = (id: number, name: string) => {
        if (name === 'administrator') {
            toast.error('Role Administrator adalah role utama sistem dan tidak boleh dihapus');
            return;
        }

        setDeleteTarget({ id, name });
    };

    const filteredRoles = useMemo(() => {
        return roles.filter((r) => {
            return (
                r.name.toLowerCase().includes(search.toLowerCase()) ||
                (r.display_name && r.display_name.toLowerCase().includes(search.toLowerCase())) ||
                (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
            );
        });
    }, [roles, search]);

    const paginatedRoles = useMemo(() => {
        const start = (page - 1) * perPage;
        return filteredRoles.slice(start, start + perPage);
    }, [filteredRoles, page, perPage]);

    const pagination: PaginationData = useMemo(() => {
        const total = filteredRoles.length;
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
    }, [filteredRoles.length, page, perPage]);

    const columns: Column<RoleItem>[] = [
        {
            key: 'name',
            label: 'Nama Role / Peran',
            className: 'min-w-[240px]',
            render: (row) => (
                <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm flex items-center gap-2">
                        {row.display_name || row.name}
                        {row.name === 'administrator' && (
                            <span className="text-[11px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-neutral-900 text-white rounded-none">
                                Superadmin
                            </span>
                        )}
                    </div>
                    <div className="font-mono text-xs text-neutral-500">
                        Code: {row.name}
                    </div>
                </div>
            ),
        },
        {
            key: 'description',
            label: 'Deskripsi',
            className: 'min-w-[280px] text-sm text-neutral-600 dark:text-neutral-400',
            render: (row) => row.description || <span className="text-neutral-400 italic">Tidak ada deskripsi</span>,
        },
        {
            key: 'permissions',
            label: 'Hak Akses',
            className: 'w-40 text-center',
            render: (row) => {
                if (row.name === 'administrator') {
                    return (
                        <span className="inline-block px-2.5 py-0.5 rounded-none text-xs font-semibold border border-emerald-400 text-emerald-600 bg-emerald-50/30">
                            Akses Penuh (Bypass)
                        </span>
                    );
                }
                const count = row.permissions ? row.permissions.length : 0;
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
                        <KeyRound className="size-3 text-neutral-500" />
                        {count} Hak Akses
                    </span>
                );
            },
        },
        {
            key: 'aksi',
            label: 'Aksi',
            sortable: false,
            className: 'w-32 text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    {/* View Button (Blue) */}
                    <Can permission={['role.view', 'roles.view']}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                            title="Lihat Detail Role"
                            onClick={() => navigate(`/roles/${row.id}`)}
                        >
                            <Eye className="size-4" />
                        </Button>
                    </Can>

                    {/* Edit Button (Amber) */}
                    <Can permission={['role.edit', 'roles.edit']}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                            title="Edit Role & Permissions"
                            onClick={() => navigate(`/roles/${row.id}/edit`)}
                        >
                            <Edit3 className="size-4" />
                        </Button>
                    </Can>

                    {/* Delete Button (Rose) */}
                    {row.name !== 'administrator' && (
                        <Can permission={['role.delete', 'roles.delete']}>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                                title="Hapus Role"
                                onClick={() => handleDelete(row.id, row.name)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </Can>
                    )}
                </div>
            ),
        },
    ];

    const headerActions = (
        <Can permission={['role.create', 'roles.create']}>
            <Button
                size="sm"
                className="bg-black text-white hover:bg-neutral-800 rounded-none h-9 px-3.5 text-xs sm:text-sm font-semibold gap-1.5 shadow-none"
                onClick={() => navigate('/roles/create')}
            >
                <Plus className="size-4" />
                Tambah Role
            </Button>
        </Can>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <DataTable
                    columns={columns}
                    data={paginatedRoles}
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
                    cardIcon={<Shield className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />}
                    cardTitle="Daftar Role / Peran Pengguna"
                    searchPlaceholder="Cari nama role atau deskripsi..."
                    headerActions={headerActions}
                    onRefresh={fetchRoles}
                    emptyText={loading ? 'Memuat data role...' : 'Tidak ada data role yang sesuai.'}
                />

                <ConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Hapus Role / Peran"
                    description={
                        <span>
                            Apakah Anda yakin ingin menghapus role{' '}
                            <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
                                "{deleteTarget?.name}"
                            </strong>
                            ? Pengguna yang menggunakan role ini mungkin akan kehilangan hak akses terkait.
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
                            await api.delete(`/roles/${deleteTarget.id}`);
                            toast.success(`Role "${deleteTarget.name}" berhasil dihapus`);
                            setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
                            setDeleteTarget(null);
                        } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Gagal menghapus role');
                        } finally {
                            setDeleteLoading(false);
                        }
                    }}
                />
            </div>
        </AppLayout>
    );
}
