import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Can } from '@/components/can';
import {
    ArrowLeft,
    ArrowRightLeft,
    Building2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    RefreshCw,
    RotateCcw,
    Search,
} from 'lucide-react';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(val || 0);

export const DepartmentStockShow: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [department, setDepartment] = useState<any | null>(null);
    const [stocks, setStocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [deptRes, stockRes] = await Promise.all([
                inventoryApi.getDepartment(id),
                inventoryApi.getStockSummary({ department_id: Number(id) }),
            ]);

            if (deptRes.data?.success) {
                setDepartment(deptRes.data.data);
            }
            if (stockRes.data?.success) {
                setStocks(stockRes.data.data || []);
            }
        } catch {
            toast.error('Gagal memuat rincian stok departemen');
            navigate('/inventory/department-stocks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const filtered = stocks.filter((s) => {
        const name = (s.item?.name || s.item_name || '').toLowerCase();
        const code = (s.item?.code || s.item_code || '').toLowerCase();
        const q = search.toLowerCase();
        return !q || name.includes(q) || code.includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    const totalQty = stocks.reduce((sum, s) => sum + Number(s.quantity_on_hand || 0), 0);
    const totalValuation = stocks.reduce((sum, s) => {
        const qty = Number(s.quantity_on_hand || 0);
        const cost = Number(s.average_cost || s.item?.standard_cost || 0);
        return sum + qty * cost;
    }, 0);

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/inventory/department-stocks')}
                                className="h-8 w-8 p-0 rounded-none border border-neutral-200 dark:border-neutral-800 shadow-none text-neutral-700 dark:text-neutral-300"
                                title="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>

                            <div className="flex items-center gap-2.5">
                                <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    <Building2 className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                            Stok Fisik Unit: {department?.name || `Departemen #${id}`}
                                        </h1>
                                        {department?.code && (
                                            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-none">
                                                {department.code}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span>Total: {filtered.length} SKU</span>
                                        <span>•</span>
                                        <span>Total Fisik: {totalQty.toLocaleString('id-ID')} Unit</span>
                                        <span>•</span>
                                        <span>Nilai: {formatCurrency(totalValuation)}</span>
                                        {loading && (
                                            <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {search !== '' && (
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
                                onClick={fetchDetail}
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
                                        <span>Mutasi Stok ke Unit Ini</span>
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
                                        placeholder="Cari kode atau nama barang di unit..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
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
                                    <th className="py-2.5 px-3 w-28 whitespace-nowrap">Satuan</th>
                                    <th className="py-2.5 px-3 w-40 text-right whitespace-nowrap">Stok Fisik Tersedia</th>
                                    <th className="py-2.5 px-3 w-40 text-right whitespace-nowrap">Biaya Rata-rata (Rp)</th>
                                    <th className="py-2.5 px-3 w-44 text-right whitespace-nowrap">Total Nilai (Rp)</th>
                                    <th className="py-2.5 px-3 w-24 text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && stocks.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat data persediaan unit...
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Tidak ada barang yang tercatat di unit ini.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((s, idx) => {
                                        const qty = Number(s.quantity_on_hand || 0);
                                        const cost = Number(s.average_cost || s.item?.standard_cost || 0);
                                        const val = qty * cost;
                                        const itemId = s.inventory_item_id || s.item?.id;
                                        return (
                                            <tr
                                                key={s.id || idx}
                                                onClick={() => itemId && navigate(`/inventory/items/${itemId}`)}
                                                className={cn(
                                                    "hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition select-none",
                                                    itemId && "cursor-pointer"
                                                )}
                                            >
                                                <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                    {(page - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                        {s.item?.code || s.item_code || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-white">
                                                    {s.item?.name || s.item_name || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-neutral-500 font-mono uppercase">
                                                    {s.item?.unit_of_measure || s.unit_of_measure || 'PCS'}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                                                    {qty.toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                                                    {formatCurrency(cost)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-semibold text-neutral-900 dark:text-white">
                                                    {formatCurrency(val)}
                                                </td>
                                                <td
                                                    className="py-2 px-3 text-right whitespace-nowrap"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-end gap-1">
                                                        {itemId ? (
                                                            <Can permission="inventory.items.view">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => navigate(`/inventory/items/${itemId}`)}
                                                                    className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                                    title="Lihat Kartu Stok Barang"
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                        ) : (
                                                            <span className="text-neutral-400">-</span>
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

                    {/* 4. Pagination Footer Bar */}
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
export default DepartmentStockShow;
