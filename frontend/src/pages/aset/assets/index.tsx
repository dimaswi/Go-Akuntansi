import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, Asset, AssetCategory } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    Boxes,
    Plus,
    Eye,
    Edit3,
    Trash2,
    RefreshCw,
    Search,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

const formatRupiah = (val?: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export const AssetsIndex: React.FC = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    const fetchCategories = async () => {
        try {
            const res = await assetApi.getCategories();
            if (res.data?.success) {
                setCategories(res.data.data || []);
            }
        } catch (e) {
            console.error('Error fetching categories', e);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const safePerPage = Math.max(1, perPage || 10);
            const params: any = {
                page: Math.max(1, page),
                per_page: safePerPage,
                search,
            };
            if (categoryFilter !== 'all') {
                params.category_id = Number(categoryFilter);
            }
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const res = await assetApi.getAssets(params);
            if (res.data?.success) {
                setAssets(res.data.data || []);
                const total = (res.data as any).meta?.total ?? (res.data as any).total ?? (res.data.data?.length || 0);
                setTotalItems(total);
                setTotalPages(Math.max(1, Math.ceil(total / safePerPage)));
            }
        } catch (err) {
            toast.error('Gagal memuat daftar aset tetap');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchData();
    }, [page, perPage, categoryFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 200);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await assetApi.deleteAsset(deleteTarget.id);
            toast.success('Aset tetap berhasil dihapus');
            setDeleteTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menghapus aset tetap');
        } finally {
            setDeleting(false);
        }
    };

    const hasActiveFilters = search !== '' || categoryFilter !== 'all' || statusFilter !== 'all';

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Daftar Aset' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Boxes className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Daftar Aset Tetap
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {totalItems} Aset</span>
                                    <span>•</span>
                                    <span>Register Master Aset & Inventarisasi</span>
                                    {loading && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        setCategoryFilter('all');
                                        setStatusFilter('all');
                                        setPage(1);
                                    }}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2.5 rounded-none"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchData}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission="aset.assets.create">
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/aset/assets/create')}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Aset</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Kode / Nama / No. Seri
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari kode, nama aset, nomor seri..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Kategori Aset
                                </label>
                                <NativeSearchableSelect
                                    value={categoryFilter}
                                    onChange={(e) => {
                                        setCategoryFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Kategori</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {c.code} - {c.name}
                                        </option>
                                    ))}
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Status
                                </label>
                                <NativeSearchableSelect
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="ACTIVE">Aktif (Operasional)</option>
                                    <option value="MAINTENANCE">Dalam Pemeliharaan</option>
                                    <option value="DISPOSED">Telah Dihapuskan</option>
                                    <option value="TRANSFERRED">Dimutasi</option>
                                </NativeSearchableSelect>
                            </div>
                        </div>
                    </div>

                    {/* 3. Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">No</th>
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">Kode Aset</th>
                                    <th className="py-2.5 px-3">Nama & Spesifikasi</th>
                                    <th className="py-2.5 px-3">Kategori</th>
                                    <th className="py-2.5 px-3">Lokasi / Dept</th>
                                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Harga Perolehan</th>
                                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Nilai Buku</th>
                                    <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 w-28 text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && assets.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat daftar aset...
                                        </td>
                                    </tr>
                                ) : assets.length > 0 ? (
                                    assets.map((a, idx) => (
                                        <tr key={a.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                            <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {a.code}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {a.name}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 font-mono">
                                                    {a.brand || a.model ? `${a.brand || ''} ${a.model || ''}`.trim() : ''}
                                                    {a.serial_number && ` • SN: ${a.serial_number}`}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 font-medium">
                                                {a.category?.name || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 text-[11px]">
                                                <div>{a.location || '-'}</div>
                                                {a.department && (
                                                    <div className="text-neutral-400">{a.department.name}</div>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-right whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(a.purchase_cost)}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-right whitespace-nowrap font-semibold text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(a.book_value)}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        'inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                                        a.status === 'ACTIVE'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                            : a.status === 'MAINTENANCE'
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                    )}
                                                >
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Can permission="aset.assets.view">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/aset/assets/${a.id}`)}
                                                            className="size-7 rounded-none border border-sky-200 text-sky-600 bg-sky-50/20 hover:bg-sky-100/50 hover:text-sky-700 p-0 shadow-none"
                                                            title="Lihat Detail Aset"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                    <Can permission="aset.assets.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/aset/assets/${a.id}/edit`)}
                                                            className="size-7 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                            title="Ubah Aset"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                    <Can permission="aset.assets.delete">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setDeleteTarget({ id: a.id, name: a.name })}
                                                            className="size-7 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                                                            title="Hapus Aset"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada data aset tetap yang sesuai filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Pagination Footer Bar */}
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <span className="shrink-0">Baris per halaman:</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 10;
                                    setPerPage(val);
                                    setPage(1);
                                }}
                                className="h-7 w-16 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 text-xs rounded-none shadow-none cursor-pointer font-mono text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="font-mono text-neutral-400 ml-2">
                                Menampilkan {assets.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
                                {Math.min(page * perPage, totalItems)} dari {totalItems} data
                            </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page <= 1}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>
                            <span className="px-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                Hal {page} dari {totalPages}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Hapus Aset Tetap"
                description={`Apakah Anda yakin ingin menghapus aset "${deleteTarget?.name || ''}"? Tindakan ini akan menghapus data registrasi aset.`}
                confirmText="Hapus Aset"
                variant="destructive"
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AppLayout>
    );
};

export default AssetsIndex;
