import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetCategory } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    Tag,
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

const formatMethod = (method?: string) => {
    switch (method) {
        case 'straight_line':
        case 'STRAIGHT_LINE':
            return 'Garis Lurus';
        case 'declining_balance':
        case 'DECLINING_BALANCE':
            return 'Saldo Menurun';
        case 'double_declining':
        case 'DOUBLE_DECLINING':
            return 'Saldo Menurun Ganda';
        case 'sum_of_years_digits':
            return 'Jumlah Angka Tahun';
        case 'service_hours':
            return 'Jam Jasa';
        case 'productive_output':
            return 'Hasil Produksi';
        default:
            return method || 'Garis Lurus';
    }
};

export const AssetCategoriesIndex: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [deleting, setDeleting] = useState<boolean>(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await assetApi.getCategories();
            if (res.data?.success) {
                setCategories(res.data.data || []);
            }
        } catch (err) {
            toast.error('Gagal memuat daftar kategori aset');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await assetApi.deleteCategory(deleteTarget.id);
            toast.success('Kategori aset berhasil dihapus');
            setDeleteTarget(null);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menghapus kategori aset');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = useMemo(() => {
        return categories.filter((c) => {
            const q = search.toLowerCase();
            const matchSearch =
                (c.code && c.code.toLowerCase().includes(q)) ||
                (c.name && c.name.toLowerCase().includes(q)) ||
                (c.description && c.description.toLowerCase().includes(q));

            const matchStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && c.is_active) ||
                (statusFilter === 'inactive' && !c.is_active);

            return matchSearch && matchStatus;
        });
    }, [categories, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const hasActiveFilters = search !== '' || statusFilter !== 'all';

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Kategori Aset' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Tag className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Kategori Aset Tetap
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {filtered.length} Kategori</span>
                                    <span>•</span>
                                    <span>Klasifikasi Aset & Integrasi Akun</span>
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

                            <Can permission="aset.categories.create">
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/aset/categories/create')}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Kategori</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Kode / Nama Kategori
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari kode atau nama kategori..."
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
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Non-Aktif</option>
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
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">Kode</th>
                                    <th className="py-2.5 px-3">Nama Kategori</th>
                                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">Umur Ekonomis</th>
                                    <th className="py-2.5 px-3 w-40 whitespace-nowrap">Metode & Tarif</th>
                                    <th className="py-2.5 px-3">Akun Aset (COA)</th>
                                    <th className="py-2.5 px-3">Akun Akumulasi</th>
                                    <th className="py-2.5 px-3">Akun Beban</th>
                                    <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 w-28 text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat kategori aset...
                                        </td>
                                    </tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map((c, idx) => {
                                        const years = c.default_useful_life_years ?? (c.useful_life_months ? Math.round(c.useful_life_months / 12) : 0);
                                        const months = c.useful_life_months ?? (years ? years * 12 : 0);
                                        const rate = c.depreciation_rate ?? (years > 0 ? Math.round(1000 / years) / 10 : 0);

                                        return (
                                            <tr key={c.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                    {(page - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                        {c.code}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {c.name}
                                                    </div>
                                                    {c.description && (
                                                        <div className="text-[11px] text-neutral-500 font-normal truncate max-w-xs">
                                                            {c.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3 font-mono whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                                                    {years > 0 ? `${years} Thn (${months} Bln)` : months > 0 ? `${months} Bln` : '-'}
                                                </td>
                                                <td className="py-2 px-3 font-mono whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                                                    <div>{formatMethod(c.default_depreciation_method || c.depreciation_method)}</div>
                                                    <div className="text-[11px] text-neutral-500">
                                                        {rate ? `${rate}% / Thn` : '-'}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    {c.account_asset ? `${c.account_asset.kode_akun} - ${c.account_asset.nama_akun}` : '-'}
                                                </td>
                                                <td className="py-2 px-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    {c.account_depreciation ? `${c.account_depreciation.kode_akun} - ${c.account_depreciation.nama_akun}` : '-'}
                                                </td>
                                                <td className="py-2 px-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                                                    {c.account_expense ? `${c.account_expense.kode_akun} - ${c.account_expense.nama_akun}` : '-'}
                                                </td>
                                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                                    <span
                                                        className={cn(
                                                            'inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                                            c.is_active
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                        )}
                                                    >
                                                        {c.is_active ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Can permission="aset.categories.view">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => navigate(`/aset/categories/${c.id}`)}
                                                                className="size-7 rounded-none border border-sky-200 text-sky-600 bg-sky-50/20 hover:bg-sky-100/50 hover:text-sky-700 p-0 shadow-none"
                                                                title="Lihat Detail Kategori"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                        <Can permission="aset.categories.edit">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => navigate(`/aset/categories/${c.id}/edit`)}
                                                                className="size-7 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                                title="Ubah Kategori"
                                                            >
                                                                <Edit3 className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                        <Can permission="aset.categories.delete">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                                                                className="size-7 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                                                                title="Hapus Kategori"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada data kategori aset yang sesuai filter.
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
                                Menampilkan {paginated.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
                                {Math.min(page * perPage, filtered.length)} dari {filtered.length} data
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
                title="Hapus Kategori Aset"
                description={`Apakah Anda yakin ingin menghapus kategori aset "${deleteTarget?.name || ''}"?`}
                confirmText="Hapus Kategori"
                variant="destructive"
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AppLayout>
    );
};

export default AssetCategoriesIndex;
