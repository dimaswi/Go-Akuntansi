import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetBudget } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/can';
import { Input } from '@/components/ui/input';
import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    DollarSign,
    Plus,
    Eye,
    RefreshCw,
    Search,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);
};

export const AssetBudgetsIndex: React.FC = () => {
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState<AssetBudget[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    const fetchData = async () => {
        try {
            setLoading(true);
            const bRes = await assetApi.getBudgets({ fiscal_year: yearFilter });
            if (bRes.data?.success) {
                setBudgets(bRes.data.data || []);
            }
        } catch (err) {
            toast.error('Gagal memuat anggaran aset (RAB)');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [yearFilter]);

    const filtered = useMemo(() => {
        return budgets.filter((b) => {
            const q = search.toLowerCase();
            const code = b.budget_code || (b as any).code || '';
            const name = b.budget_name || (b as any).title || '';
            const dept = b.department?.name || '';
            return code.toLowerCase().includes(q) || name.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
        });
    }, [budgets, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const hasActiveFilters = search !== '';

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'RAB (Anggaran)' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <DollarSign className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Rencana Anggaran Biaya (RAB) Aset
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {filtered.length} Anggaran</span>
                                    <span>•</span>
                                    <span>Perencanaan & Pagu Belanja Modal (CAPEX)</span>
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

                            <Can permission="aset.budgets.create">
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/aset/budgets/create')}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Buat Anggaran Baru</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Kode / Nama Anggaran / Dept
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari kode anggaran, unit..."
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
                                    Tahun Anggaran (Fiscal Year)
                                </label>
                                <NativeSearchableSelect
                                    value={yearFilter}
                                    onChange={(e) => {
                                        setYearFilter(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    {[2024, 2025, 2026, 2027].map((y) => (
                                        <option key={y} value={y}>
                                            Tahun Anggaran {y}
                                        </option>
                                    ))}
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
                                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">Kode Anggaran</th>
                                    <th className="py-2.5 px-3">Nama Anggaran & Departemen</th>
                                    <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Tahun</th>
                                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Total Pagu (Rp)</th>
                                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Realisasi (Rp)</th>
                                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Sisa Anggaran</th>
                                    <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 w-20 text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && budgets.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat anggaran aset...
                                        </td>
                                    </tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map((b, idx) => {
                                        const totalAmt = Number(b.total_amount ?? (b as any).total_budget ?? 0);
                                        const realizedAmt = Number(b.realized_amount ?? (b as any).total_realized ?? 0);
                                        const remaining = totalAmt - realizedAmt;
                                        const code = b.budget_code || (b as any).code || '-';
                                        const name = b.budget_name || (b as any).title || '-';

                                        return (
                                            <tr key={b.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                    {(page - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                        {code}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {name}
                                                    </div>
                                                    <div className="text-[11px] text-neutral-500">
                                                        {b.department?.name || 'Seluruh Departemen'}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-center font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                    {b.fiscal_year}
                                                </td>
                                                <td className="py-2 px-3 font-mono text-right whitespace-nowrap font-bold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrency(totalAmt)}
                                                </td>
                                                <td className="py-2 px-3 font-mono text-right whitespace-nowrap text-rose-600">
                                                    {formatCurrency(realizedAmt)}
                                                </td>
                                                <td className="py-2 px-3 font-mono text-right whitespace-nowrap font-semibold text-emerald-600">
                                                    {formatCurrency(remaining)}
                                                </td>
                                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                                    <span
                                                        className={cn(
                                                            'inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                                            b.status === 'APPROVED'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                                        )}
                                                    >
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end">
                                                        <Can permission="aset.budgets.view">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => navigate(`/aset/budgets/${b.id}`)}
                                                                className="size-7 rounded-none border border-sky-200 text-sky-600 bg-sky-50/20 hover:bg-sky-100/50 hover:text-sky-700 p-0 shadow-none"
                                                                title="Lihat Rincian Anggaran"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada data anggaran aset untuk tahun terpilih.
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
        </AppLayout>
    );
};

export default AssetBudgetsIndex;
