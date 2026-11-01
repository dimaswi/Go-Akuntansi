import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Can } from '@/components/can';
import {
    CreditCard,
    Plus,
    Search,
    RefreshCw,
    Eye,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

interface PurchasePaymentRecord {
    id: number;
    payment_number: string;
    purchase_id: number;
    payment_date: string;
    payment_method: string;
    kode_akun_bank?: string;
    amount: number | string;
    discount_amount: number | string;
    notes?: string;
    jurnal_posted: boolean;
    purchase?: {
        purchase_number: string;
        supplier?: { name: string };
    };
}

export const PurchasePaymentsIndex: React.FC = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<PurchasePaymentRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [methodFilter, setMethodFilter] = useState<string>('all');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.getPayments();
            if (res.data?.success) {
                const raw = res.data.data;
                const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
                setPayments(list);
            }
        } catch {
            toast.error('Gagal memuat data pembayaran');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
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

    const paymentList = Array.isArray(payments) ? payments : [];
    const filtered = paymentList.filter((p) => {
        const q = search.toLowerCase();
        const matchSearch =
            p.payment_number?.toLowerCase().includes(q) ||
            p.purchase?.purchase_number?.toLowerCase().includes(q) ||
            p.purchase?.supplier?.name?.toLowerCase().includes(q) ||
            p.notes?.toLowerCase().includes(q);
        const matchMethod = methodFilter === 'all' || p.payment_method === methodFilter;
        return matchSearch && matchMethod;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const totalPaid = filtered.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const postedCount = filtered.filter((p) => p.jurnal_posted).length;
    const hasActiveFilters = search !== '' || methodFilter !== 'all';

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <CreditCard className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Pembayaran Pembelian (Purchase Payments)
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {filtered.length} Pembayaran</span>
                                    <span>•</span>
                                    <span>Pencatatan Kas & Pelunasan Hutang PO</span>
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
                                        setMethodFilter('all');
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
                                onClick={fetchPayments}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission={['inventory.purchases.create-payment', 'inventory.purchase-payments.create', 'inventory.purchases.view-ap']}>
                                <Link to="/inventory/purchase-payments/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Catat Pembayaran PO</span>
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
                                    Cari Nomor Bayar / No. PO / Vendor
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari nomor bukti bayar / vendor..."
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
                                    Metode Pembayaran
                                </label>
                                <NativeSearchableSelect
                                    value={methodFilter}
                                    onChange={(e) => {
                                        setMethodFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Metode</option>
                                    <option value="cash">Kas Tunai (Cash)</option>
                                    <option value="bank_transfer">Transfer Bank</option>
                                    <option value="giro">Cek / Giro</option>
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
                                    <th className="py-2.5 px-3 w-40 whitespace-nowrap">Nomor Bayar</th>
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">Tanggal</th>
                                    <th className="py-2.5 px-3 w-40 whitespace-nowrap">No. PO</th>
                                    <th className="py-2.5 px-3">Pemasok / Vendor</th>
                                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">Metode</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Nominal Bayar</th>
                                    <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">Status Jurnal</th>
                                    <th className="py-2.5 px-3 text-right w-24 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat data pembayaran...
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada riwayat pembayaran pembelian.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => navigate(`/inventory/purchase-payments/${item.id}`)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                        >
                                            <td className="py-2 px-3 text-center text-neutral-500 font-mono text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {item.payment_number}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                {item.payment_date?.split('T')[0]}
                                            </td>
                                            <td
                                                className="py-2 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Link to={`/inventory/purchases/${item.purchase_id}`} className="hover:underline">
                                                    {item.purchase?.purchase_number || `PO #${item.purchase_id}`}
                                                </Link>
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {item.purchase?.supplier?.name || '-'}
                                            </td>
                                            <td className="py-2 px-3 uppercase font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                                                {item.payment_method?.replace('_', ' ')}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                                                {formatCurrency(item.amount)}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                <span className={cn(
                                                    'inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border rounded-none',
                                                    item.jurnal_posted
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                )}>
                                                    {item.jurnal_posted ? 'Diposting' : 'Draft'}
                                                </span>
                                            </td>
                                            <td
                                                className="py-2 px-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <Can permission={['inventory.purchases.view-ap', 'inventory.purchases.view', 'inventory.purchase-payments.view']}>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/inventory/purchase-payments/${item.id}`)}
                                                            className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                            title="Lihat Detail Pembayaran"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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

export default PurchasePaymentsIndex;
