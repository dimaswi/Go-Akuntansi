import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetDepreciation } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    TrendingDown,
    Play,
    RefreshCw,
    Search,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(val || 0));
};

export const AssetDepreciationsIndex: React.FC = () => {
    const [depreciations, setDepreciations] = useState<AssetDepreciation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [periodFilter, setPeriodFilter] = useState<string>(
        new Date().toISOString().slice(0, 7) // current YYYY-MM
    );
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    // Run Depreciation Dialog state
    const [isConfirmRunOpen, setIsConfirmRunOpen] = useState<boolean>(false);
    const [running, setRunning] = useState<boolean>(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await assetApi.getDepreciations({
                period_date: periodFilter ? `${periodFilter}-01` : undefined,
            });
            if (res.data?.success) {
                setDepreciations(res.data.data || []);
            }
        } catch (err) {
            toast.error('Gagal memuat data penyusutan aset');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [periodFilter]);

    const handleRunDepreciation = async () => {
        try {
            setRunning(true);
            const periodDate = periodFilter ? `${periodFilter}-01` : `${new Date().toISOString().slice(0, 7)}-01`;
            const res = await assetApi.runDepreciation({ period_date: periodDate });
            if (res.data?.success) {
                toast.success(res.data.message || 'Penyusutan berhasil diproses & jurnal dicatat!');
                setIsConfirmRunOpen(false);
                fetchData();
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menjalankan kalkulasi penyusutan');
        } finally {
            setRunning(false);
        }
    };

    const filtered = useMemo(() => {
        return depreciations.filter((d) => {
            const q = search.toLowerCase();
            const matchSearch =
                (d.asset?.name && d.asset.name.toLowerCase().includes(q)) ||
                (d.asset?.code && d.asset.code.toLowerCase().includes(q)) ||
                (d.asset?.category?.name && d.asset.category.name.toLowerCase().includes(q));

            return matchSearch;
        });
    }, [depreciations, search]);

    const totalDepreciation = useMemo(() => {
        return filtered.reduce((sum, d) => sum + Number(d.depreciation_amount || 0), 0);
    }, [filtered]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const hasActiveFilters = search !== '' || periodFilter !== '';

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Penyusutan' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <TrendingDown className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Penyusutan Aset Tetap (Depreciation)
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {filtered.length} Catatan</span>
                                    <span>•</span>
                                    <span>Total Beban: {formatCurrency(totalDepreciation)}</span>
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
                                        setPeriodFilter(new Date().toISOString().slice(0, 7));
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

                            <Can permission="aset.depreciations.create">
                                <Button
                                    size="sm"
                                    onClick={() => setIsConfirmRunOpen(true)}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Play className="size-3.5 fill-current" />
                                    <span>Proses Penyusutan Periode Ini</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Aset / Kategori
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari kode atau nama aset..."
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
                                    Periode Bulan
                                </label>
                                <Input
                                    type="month"
                                    value={periodFilter}
                                    onChange={(e) => {
                                        setPeriodFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 text-xs rounded-none font-mono bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">No</th>
                                    <th className="py-2.5 px-3 w-28 whitespace-nowrap">Periode</th>
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">Kode Aset</th>
                                    <th className="py-2.5 px-3">Nama Aset</th>
                                    <th className="py-2.5 px-3">Kategori</th>
                                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Beban Depresiasi</th>
                                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Akumulasi Depresiasi</th>
                                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Sisa Nilai Buku</th>
                                    <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && depreciations.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat catatan penyusutan aset...
                                        </td>
                                    </tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map((d, idx) => (
                                        <tr key={d.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                            <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 font-mono font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                                                {d.period_date?.slice(0, 7)}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <Link
                                                    to={`/aset/assets/${d.asset_id}`}
                                                    className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block hover:underline"
                                                >
                                                    {d.asset?.code || `AST-${d.asset_id}`}
                                                </Link>
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {d.asset?.name || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">
                                                {d.asset?.category?.name || '-'}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-right whitespace-nowrap font-medium text-rose-600">
                                                {formatCurrency(d.depreciation_amount)}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-right whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                                                {formatCurrency(d.accumulated_depreciation)}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-right whitespace-nowrap font-bold text-neutral-900 dark:text-white">
                                                {formatCurrency(d.book_value)}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-none">
                                                    POSTED
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada catatan penyusutan aset pada periode ini.
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
                open={isConfirmRunOpen}
                onOpenChange={setIsConfirmRunOpen}
                title="Proses Penyusutan Aset Tetap"
                description={`Apakah Anda yakin ingin memproses amortisasi penyusutan aset untuk periode "${periodFilter}"? Tindakan ini akan mengkalkulasi beban depresiasi semua aset aktif dan mencatat jurnal otomatis.`}
                confirmText="Proses Sekarang"
                onConfirm={handleRunDepreciation}
                loading={running}
            />
        </AppLayout>
    );
};

export default AssetDepreciationsIndex;
