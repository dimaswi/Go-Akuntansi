import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, ItemStock } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Can } from '@/components/can';
import {
    Box,
    Search,
    RefreshCw,
    Eye,
    RotateCcw,
    AlertTriangle,
    ArrowRightLeft,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

export const CentralWarehouseIndex: React.FC = () => {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState<ItemStock[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.getStockSummary({ department_id: 0 });
            if (res.data?.success) {
                const raw = res.data.data;
                const all = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
                setStocks(all);
            }
        } catch {
            toast.error('Gagal memuat data stok Gudang Pusat');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    const formatCurrency = (val: string | number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const stockList = Array.isArray(stocks) ? stocks : [];
    const filtered = stockList.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch =
            s.item?.name?.toLowerCase().includes(q) ||
            s.item?.code?.toLowerCase().includes(q);
        const qty = Number(s.quantity_on_hand || 0);
        const reorder = Number(s.item?.reorder_level || 0);
        const isLow = qty <= reorder;
        const matchStatus = statusFilter === 'all' || (statusFilter === 'low' && isLow) || (statusFilter === 'safe' && !isLow);
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalQty = filtered.reduce((acc, curr) => acc + Number(curr.quantity_on_hand || 0), 0);
    const totalVal = filtered.reduce((acc, curr) => acc + Number(curr.total_value || 0), 0);
    const lowCount = filtered.filter((s) => Number(s.quantity_on_hand || 0) <= Number(s.item?.reorder_level || 0)).length;
    const hasActiveFilters = search !== '' || statusFilter !== 'all';

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Box className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Stok Gudang Pusat (Central Warehouse)
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {filtered.length} SKU</span>
                                    <span>•</span>
                                    <span>Fisik: {totalQty.toLocaleString('id-ID')} Unit</span>
                                    <span>•</span>
                                    <span>Nilai: {formatCurrency(totalVal)}</span>
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
                                onClick={fetchStocks}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission="inventory.stock-transfers.create">
                                <Link to="/inventory/stock-transfers/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <ArrowRightLeft className="size-3.5" />
                                        <span>Transfer ke Unit</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Kode SKU / Nama Barang
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari kode atau nama barang di gudang pusat..."
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
                                    Status Stok Gudang
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
                                    <option value="safe">Aman</option>
                                    <option value="low">Menipis / Kritis</option>
                                </NativeSearchableSelect>
                            </div>
                        </div>
                    </div>

                    {/* 3. Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">No</th>
                                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">Kode SKU</th>
                                    <th className="py-2.5 px-3">Nama Barang</th>
                                    <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Satuan</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Stok Fisik (On Hand)</th>
                                    <th className="py-2.5 px-3 text-right w-32 whitespace-nowrap">Tersedia</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Harga Satuan</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Total Nilai Buku</th>
                                    <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 text-right w-24 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && stocks.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat data stok gudang pusat...
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Tidak ada data stok di gudang pusat.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((s, idx) => {
                                        const qty = Number(s.quantity_on_hand || 0);
                                        const reorder = Number(s.item?.reorder_level || 0);
                                        const isLow = qty <= reorder;
                                        return (
                                            <tr
                                                key={s.id || idx}
                                                onClick={() => s.item_id && navigate(`/inventory/items/${s.item_id}`)}
                                                className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                            >
                                                <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                    {(page - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                        {s.item?.code || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {s.item?.name || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-center font-mono uppercase text-[11px] font-semibold">
                                                    {s.item?.unit_of_measure || 'PCS'}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                                                    {qty.toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-neutral-600 dark:text-neutral-400 tabular-nums whitespace-nowrap">
                                                    {Number(s.available_quantity || qty).toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-neutral-600 dark:text-neutral-400 tabular-nums whitespace-nowrap">
                                                    {formatCurrency(s.last_unit_cost || s.average_unit_cost || 0)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                                                    {formatCurrency(s.total_value)}
                                                </td>
                                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                                    {isLow ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-none">
                                                            <AlertTriangle className="size-3" />
                                                            Menipis
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-none">
                                                            Aman
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    className="py-2 px-3 text-right whitespace-nowrap"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-end gap-1">
                                                        {s.item_id && (
                                                            <Can permission="inventory.items.view">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => navigate(`/inventory/items/${s.item_id}`)}
                                                                    className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                                    title="Lihat Barang"
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Pagination Footer Bar */}
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                            <span>Baris per halaman:</span>
                            <NativeSearchableSelect
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="h-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 text-xs rounded-none shadow-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </NativeSearchableSelect>
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

export default CentralWarehouseIndex;
