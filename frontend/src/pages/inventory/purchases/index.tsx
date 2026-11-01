import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, Purchase } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    ShoppingCart,
    CreditCard,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit3,
    CheckCircle,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

export const InventoryPurchasesIndex: React.FC = () => {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [approveId, setApproveId] = useState<number | null>(null);
    const [approving, setApproving] = useState<boolean>(false);

    const hasActiveFilters = search !== '' || status !== '' || fromDate !== '' || toDate !== '';

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.getPurchases({
                page,
                per_page: perPage,
                search,
                status,
                from_date: fromDate,
                to_date: toDate,
            });
            if (res.data?.success) {
                const raw = res.data.data;
                const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
                setPurchases(list);
                if (res.data.meta) {
                    setTotalPages(res.data.meta.last_page || 1);
                    setTotalItems(res.data.meta.total || 0);
                }
            }
        } catch (err) {
            console.error('Failed to load purchases', err);
            toast.error('Gagal memuat data pengadaan/PO');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, [page, perPage, status, fromDate, toDate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPurchases();
        }, 150);
        return () => clearTimeout(timer);
    }, [search]);

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setFromDate('');
        setToDate('');
        setPage(1);
    };

    const handleApprove = async () => {
        if (!approveId) return;
        try {
            setApproving(true);
            const res = await inventoryApi.approvePurchase(approveId);
            if (res.data?.success) {
                toast.success('PO disetujui');
                setApproveId(null);
                fetchPurchases();
            }
        } catch (err: any) {
            toast.error('Gagal menyetujui PO');
        } finally {
            setApproving(false);
        }
    };

    const formatCurrency = (val: string | number | undefined) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const totalPOAmount = purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);
    const totalAPOutstanding = purchases.reduce((acc, p) => acc + Number(p.ap_outstanding || 0), 0);
    const draftCount = purchases.filter((p) => p.status === 'draft').length;

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <ShoppingCart className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Pengadaan Barang & Hutang Dagang (PO)
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {totalItems} PO</span>
                                    <span>•</span>
                                    <span>Halaman {page} dari {totalPages}</span>
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
                                    onClick={handleReset}
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
                                onClick={fetchPurchases}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission={['inventory.purchases.create-payment', 'inventory.purchases.view-ap']}>
                                <Link to="/inventory/purchase-payments">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none font-medium"
                                    >
                                        <CreditCard className="size-3.5 mr-1.5" />
                                        Pembayaran
                                    </Button>
                                </Link>
                            </Can>

                            <Can permission="inventory.purchases.create">
                                <Link to="/inventory/purchases/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Buat Pengadaan (PO)</span>
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari Nomor PO / Catatan
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari nomor PO atau catatan..."
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
                                    Status Pengadaan
                                </label>
                                <NativeSearchableSelect
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="ordered">Ordered (Dipesan)</option>
                                    <option value="received">Received (Diterima)</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </NativeSearchableSelect>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Dari Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Sampai Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
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
                                    <th className="py-2.5 px-3 w-40 whitespace-nowrap">Nomor PO</th>
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">Tanggal</th>
                                    <th className="py-2.5 px-3">Pemasok / Vendor</th>
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">Syarat Bayar</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Total Nilai (Rp)</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Sisa Hutang (AP)</th>
                                    <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">Posting Jurnal</th>
                                    <th className="py-2.5 px-3 text-right w-32 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat daftar pengadaan barang...
                                        </td>
                                    </tr>
                                ) : purchases.length > 0 ? (
                                    purchases.map((p, idx) => (
                                        <tr
                                            key={p.id}
                                            onClick={() => navigate(`/inventory/purchases/${p.id}`)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                        >
                                            <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {p.purchase_number}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 font-mono whitespace-nowrap">
                                                {p.purchase_date ? p.purchase_date.split('T')[0] : '-'}
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {p.supplier?.name || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-500 font-mono text-[11px] uppercase">
                                                {p.payment_terms || 'Tempo'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                                                {formatCurrency(p.total_amount)}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums whitespace-nowrap">
                                                {formatCurrency(p.ap_outstanding)}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                <span className={cn(
                                                    'inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border rounded-none',
                                                    p.status === 'received' || p.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                        : p.status === 'ordered'
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                                                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                                                )}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                {p.jurnal_posted ? (
                                                    <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-none">
                                                        POSTED
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-neutral-400 font-mono">Belum</span>
                                                )}
                                            </td>
                                            <td
                                                className="py-2 px-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <Can permission="inventory.purchases.view">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/inventory/purchases/${p.id}`)}
                                                            className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                            title="Lihat Detail PO"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Can>

                                                    {p.status === 'draft' && (
                                                        <>
                                                            <Can permission="inventory.purchases.edit">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => navigate(`/inventory/purchases/${p.id}/edit`)}
                                                                    className="size-7 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                                    title="Edit PO"
                                                                >
                                                                    <Edit3 className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                            <Can permission="inventory.purchases.approve">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setApproveId(p.id);
                                                                    }}
                                                                    className="size-7 rounded-none border border-emerald-200 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-100/50 hover:text-emerald-700 p-0 shadow-none"
                                                                    title="Setujui PO"
                                                                >
                                                                    <CheckCircle className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada berkas pengadaan barang yang terdaftar.
                                        </td>
                                    </tr>
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
                                Menampilkan {purchases.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
                                {Math.min(page * perPage, totalItems)} dari {totalItems} data
                            </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page <= 1 || loading}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={page <= 1 || loading}
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
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={page >= totalPages || loading}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages || loading}
                                className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none disabled:opacity-40"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>

                </div>
            </div>

            <ConfirmDialog
                open={!!approveId}
                onOpenChange={(open) => !open && setApproveId(null)}
                title="Setujui Purchase Order (PO)"
                description='Apakah Anda yakin ingin menyetujui Purchase Order ini menjadi "ORDERED"?'
                confirmText="Setujui PO"
                variant="default"
                onConfirm={handleApprove}
                loading={approving}
            />
        </AppLayout>
    );
};

export default InventoryPurchasesIndex;
