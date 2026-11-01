import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { inventoryApi, StockTransfer } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    ArrowRightLeft,
    Plus,
    Search,
    RefreshCw,
    Eye,
    CheckCircle,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

export const StockTransfersIndex: React.FC = () => {
    const navigate = useNavigate();
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [receiveId, setReceiveId] = useState<number | null>(null);
    const [receiving, setReceiving] = useState<boolean>(false);

    const hasActiveFilters = search !== '' || statusFilter !== 'all';

    const fetchData = async () => {
        try {
            setLoading(true);
            const trfRes = await inventoryApi.getStockTransfers({ page, per_page: perPage, search });
            if (trfRes.data?.success) {
                const raw = trfRes.data.data;
                const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
                setTransfers(list);
                if (trfRes.data.meta) {
                    setTotalPages(trfRes.data.meta.last_page || 1);
                    setTotalItems(trfRes.data.meta.total || 0);
                }
            }
        } catch (err) {
            toast.error('Gagal memuat data transfer stok');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, perPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 150);
        return () => clearTimeout(timer);
    }, [search]);

    const handleReceive = async () => {
        if (!receiveId) return;
        try {
            setReceiving(true);
            const res = await inventoryApi.receiveStockTransfer(receiveId);
            if (res.data?.success) {
                toast.success('Transfer stok diterima dan saldo unit telah diperbarui');
                setReceiveId(null);
                fetchData();
            }
        } catch (err: any) {
            toast.error('Gagal menerima transfer');
        } finally {
            setReceiving(false);
        }
    };

    const trfList = Array.isArray(transfers) ? transfers : [];
    const filtered = trfList.filter((trf) => {
        if (statusFilter === 'all') return true;
        return trf.status === statusFilter;
    });

    const receivedCount = filtered.filter((t) => t.status === 'received').length;
    const pendingCount = filtered.filter((t) => t.status !== 'received').length;

    return (
        <AppLayout>
            <div className="w-full max-w-full space-y-4">
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    
                    {/* 1. Header Bar */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <ArrowRightLeft className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Transfer Stok Antar Departemen & Gudang
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {totalItems} Transfer</span>
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

                            <Can permission="inventory.stock-transfers.create">
                                <Link to="/inventory/stock-transfers/create">
                                    <Button
                                        size="sm"
                                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Buat Transfer Stok</span>
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
                                    Cari Nomor Transfer / Barang
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari nomor transfer..."
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
                                    Status Penerimaan
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
                                    <option value="pending">Pending (Dalam Perjalanan)</option>
                                    <option value="received">Received (Diterima Unit)</option>
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
                                    <th className="py-2.5 px-3 w-40 whitespace-nowrap">No. Transfer</th>
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">Tanggal</th>
                                    <th className="py-2.5 px-3">Nama Barang</th>
                                    <th className="py-2.5 px-3 w-44">Gudang / Asal</th>
                                    <th className="py-2.5 px-3 w-44">Unit Tujuan</th>
                                    <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">Kuantiti</th>
                                    <th className="py-2.5 px-3">Keterangan</th>
                                    <th className="py-2.5 px-3 text-center w-24 whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && transfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat transfer stok...
                                        </td>
                                    </tr>
                                ) : filtered.length > 0 ? (
                                    filtered.map((trf, idx) => (
                                        <tr
                                            key={trf.id}
                                            onClick={() => navigate(`/inventory/stock-transfers/${trf.id}`)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                        >
                                            <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {trf.nomor_transfer}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                {trf.tanggal_transfer ? trf.tanggal_transfer.split('T')[0] : '-'}
                                            </td>
                                            <td className="py-2 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {trf.item?.name}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400 font-medium">
                                                {trf.from_department?.name || 'Gudang Pusat'}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-900 dark:text-neutral-100 font-semibold">
                                                {trf.to_department?.name || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums whitespace-nowrap">
                                                {Number(trf.quantity).toLocaleString('id-ID')} {trf.item?.unit_of_measure}
                                            </td>
                                            <td className="py-2 px-3 text-neutral-500 max-w-xs truncate">
                                                {trf.keterangan || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                <span className={cn(
                                                    'inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border rounded-none',
                                                    trf.status === 'received'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                                                )}>
                                                    {trf.status}
                                                </span>
                                            </td>
                                            <td
                                                className="py-2 px-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <Can permission="inventory.stock-transfers.view">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/inventory/stock-transfers/${trf.id}`)}
                                                            className="size-7 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                    {trf.status === 'pending' && (
                                                        <Can permission="inventory.stock-transfers.receive">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => setReceiveId(trf.id)}
                                                                className="size-7 rounded-none border border-emerald-200 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-100/50 hover:text-emerald-700 p-0 shadow-none"
                                                                title="Terima di Unit"
                                                            >
                                                                <CheckCircle className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada data transfer stok.
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
                                Menampilkan {filtered.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
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
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
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
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
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
                open={!!receiveId}
                onOpenChange={(open) => !open && setReceiveId(null)}
                title="Konfirmasi Penerimaan Transfer Stok"
                description="Apakah Anda yakin barang transfer stok ini telah diterima secara fisik oleh unit tujuan?"
                confirmText="Terima Barang"
                variant="default"
                onConfirm={handleReceive}
                loading={receiving}
            />
        </AppLayout>
    );
};

export default StockTransfersIndex;
