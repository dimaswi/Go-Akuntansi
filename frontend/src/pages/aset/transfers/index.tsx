import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { assetApi, AssetTransfer } from '@/api/asset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Can } from '@/components/can';
import {
    ArrowRightLeft,
    Plus,
    Eye,
    Edit3,
    CheckCircle2,
    RefreshCw,
    Search,
    RotateCcw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from 'lucide-react';

export const AssetTransfersIndex: React.FC = () => {
    const navigate = useNavigate();
    const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    // Approval state
    const [approveId, setApproveId] = useState<number | null>(null);
    const [approving, setApproving] = useState<boolean>(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await assetApi.getTransfers({
                status: statusFilter !== 'all' ? statusFilter : undefined,
            });

            if (res.data?.success) {
                setTransfers(res.data.data || []);
            }
        } catch (err) {
            toast.error('Gagal memuat catatan mutasi aset');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const handleApprove = async () => {
        if (!approveId) return;
        try {
            setApproving(true);
            await assetApi.approveTransfer(approveId);
            toast.success('Mutasi aset disetujui & lokasi aset telah diperbarui');
            setApproveId(null);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyetujui mutasi aset');
        } finally {
            setApproving(false);
        }
    };

    const filtered = useMemo(() => {
        return transfers.filter((t) => {
            const q = search.toLowerCase();
            const matchSearch =
                (t.transfer_number && t.transfer_number.toLowerCase().includes(q)) ||
                (t.from_location && t.from_location.toLowerCase().includes(q)) ||
                (t.to_location && t.to_location.toLowerCase().includes(q)) ||
                (t.received_by && t.received_by.toLowerCase().includes(q)) ||
                (t.asset?.name && t.asset.name.toLowerCase().includes(q)) ||
                (t.asset?.code && t.asset.code.toLowerCase().includes(q));

            return matchSearch;
        });
    }, [transfers, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    const hasActiveFilters = search !== '' || statusFilter !== 'all';

    const breadcrumbs = [
        { title: 'Aset', href: '/aset' },
        { title: 'Transfer' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
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
                                    Mutasi & Perpindahan Lokasi Aset
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>Total: {filtered.length} Mutasi</span>
                                    <span>•</span>
                                    <span>Perpindahan Fisik, Lokasi & Tanggung Jawab Unit</span>
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

                            <Can permission="aset.transfers.create">
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/aset/transfers/create')}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Ajukan Mutasi Aset</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari No. Dokumen / Aset / Lokasi
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        placeholder="Cari no mutasi, kode aset, tujuan..."
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
                                    Status Mutasi
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
                                    <option value="PENDING">Menunggu Persetujuan</option>
                                    <option value="APPROVED">Disetujui / Selesai</option>
                                    <option value="REJECTED">Ditolak</option>
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
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">No. Mutasi</th>
                                    <th className="py-2.5 px-3 w-28 whitespace-nowrap">Tanggal</th>
                                    <th className="py-2.5 px-3">Kode & Nama Aset</th>
                                    <th className="py-2.5 px-3">Dari Unit / Lokasi</th>
                                    <th className="py-2.5 px-3">Ke Unit / Lokasi</th>
                                    <th className="py-2.5 px-3">Penerima (PIC)</th>
                                    <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 w-28 text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && transfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat usulan mutasi aset...
                                        </td>
                                    </tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map((t, idx) => (
                                        <tr key={t.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                            <td className="py-2 px-3 text-center font-mono text-neutral-500 text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-2 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {t.transfer_number}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                {t.transfer_date?.slice(0, 10)}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span
                                                    onClick={() => navigate(`/aset/assets/${t.asset_id}`)}
                                                    className="font-mono font-bold text-neutral-900 dark:text-neutral-100 hover:underline cursor-pointer block text-xs"
                                                >
                                                    {t.asset?.code || `AST-${t.asset_id}`}
                                                </span>
                                                <div className="font-medium text-neutral-700 dark:text-neutral-300">
                                                    {t.asset?.name || '-'}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">
                                                <div className="font-medium text-neutral-900 dark:text-white">
                                                    {t.from_department?.name || '-'}
                                                </div>
                                                <div className="text-[11px] text-neutral-400">{t.from_location || '-'}</div>
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">
                                                <div className="font-semibold text-neutral-900 dark:text-white">
                                                    {t.to_department?.name || '-'}
                                                </div>
                                                <div className="text-[11px] text-neutral-400">{t.to_location || '-'}</div>
                                            </td>
                                            <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">
                                                {t.received_by || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-center whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        'inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none border',
                                                        t.status === 'APPROVED'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                                            : t.status === 'REJECTED'
                                                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                                    )}
                                                >
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Can permission="aset.transfers.view">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/aset/transfers/${t.id}`)}
                                                            className="size-7 rounded-none border border-sky-200 text-sky-600 bg-sky-50/20 hover:bg-sky-100/50 hover:text-sky-700 p-0 shadow-none"
                                                            title="Lihat Detail Mutasi"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                    {t.status === 'PENDING' && (
                                                        <Can permission="aset.transfers.approve">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => setApproveId(t.id)}
                                                                className="size-7 rounded-none border border-emerald-200 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-100/50 hover:text-emerald-700 p-0 shadow-none"
                                                                title="Setujui Mutasi Aset"
                                                            >
                                                                <CheckCircle2 className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    )}
                                                    <Can permission="aset.transfers.edit">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => navigate(`/aset/transfers/${t.id}/edit`)}
                                                            className="size-7 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                            title="Ubah Data"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Belum ada data mutasi aset yang sesuai filter.
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
                open={!!approveId}
                onOpenChange={(open) => !open && setApproveId(null)}
                title="Setujui Mutasi Aset"
                description="Apakah Anda yakin ingin menyetujui mutasi ini? Lokasi fisik dan departemen pemilik aset akan otomatis dipindahkan ke tujuan baru."
                confirmText="Setujui & Mutasikan"
                onConfirm={handleApprove}
                loading={approving}
            />
        </AppLayout>
    );
};

export default AssetTransfersIndex;
