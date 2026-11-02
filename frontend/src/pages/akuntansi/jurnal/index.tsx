import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { Journal } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Can } from '@/components/can';
import {
    BookOpen,
    CheckCircle,
    Edit3,
    Eye,
    Plus,
    RotateCcw,
    Trash2,
    Undo2,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Jurnal Transaksi', href: '/akuntansi/jurnal' },
];

export default function JurnalIndex() {
    const navigate = useNavigate();

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const [journals, setJournals] = useState<Journal[]>([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tanggalDari, setTanggalDari] = useState(defaultStart);
    const [tanggalSampai, setTanggalSampai] = useState(defaultEnd);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    // Confirm Dialog state
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [reverseTarget, setReverseTarget] = useState<Journal | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchJournals = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                page,
                limit: perPage,
                jenis_jurnal: '!penyesuaian',
            };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
            if (tanggalDari) params.start_date = tanggalDari;
            if (tanggalSampai) params.end_date = tanggalSampai;

            const res = await api.get('/jurnal', { params });
            const list: Journal[] = res.data?.data || [];
            setJournals(list);

            const meta = res.data?.meta;
            if (meta) {
                setTotalRecords(Number(meta.total || 0));
                setTotalPages(Number(meta.total_pages || Math.max(1, Math.ceil((meta.total || 0) / perPage))));
            } else {
                setTotalRecords(list.length);
                setTotalPages(1);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat jurnal');
        } finally {
            setLoading(false);
        }
    }, [page, perPage, searchTerm, statusFilter, tanggalDari, tanggalSampai]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchJournals();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchJournals]);

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setTanggalDari(defaultStart);
        setTanggalSampai(defaultEnd);
        setPage(1);
    };

    const handlePost = async (id: number) => {
        try {
            await api.post(`/jurnal/${id}/post`);
            toast.success('Jurnal berhasil diposting');
            fetchJournals();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memposting jurnal');
        }
    };

    const handleUnpost = async (id: number) => {
        try {
            await api.post(`/jurnal/${id}/unpost`);
            toast.success('Jurnal berhasil di-unpost ke draft');
            fetchJournals();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal unpost jurnal');
        }
    };

    const hasActiveFilters =
        searchTerm !== '' ||
        statusFilter !== 'all' ||
        tanggalDari !== defaultStart ||
        tanggalSampai !== defaultEnd;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* ─── Satu Kontainer Card Utuh (Single Unified Card Container) ──── */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <BookOpen className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Jurnal Transaksi (General Journal)
                                </h1>
                                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                                    <span>Periode: {tanggalDari} s/d {tanggalSampai}</span>
                                    <span>•</span>
                                    <span>{totalRecords} Total Transaksi</span>
                                    {loading && (
                                        <RefreshCw className="size-3 animate-spin text-neutral-400 ml-1" />
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 gap-1 px-2.5 rounded-none"
                                    title="Reset semua filter ke default"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fetchJournals()}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission="akuntansi.jurnal.create">
                                <Button
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    onClick={() => navigate('/akuntansi/jurnal/create')}
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Jurnal</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Search */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari No. Jurnal / Keterangan
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari nomor jurnal atau keterangan..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                    />
                                </div>
                            </div>

                            {/* Status */}
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
                                    <option value="draft">Draft</option>
                                    <option value="posted">Posted</option>
                                    <option value="reversed">Reversed</option>
                                </NativeSearchableSelect>
                            </div>

                            {/* Tanggal Dari */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Dari Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={tanggalDari}
                                    onChange={(e) => {
                                        setTanggalDari(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>

                            {/* Tanggal Sampai */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Sampai Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={tanggalSampai}
                                    onChange={(e) => {
                                        setTanggalSampai(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Table Section - Readable text-sm font size! */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-3 px-4 text-left w-12">No</th>
                                    <th className="py-3 px-4 text-left w-44">No. Jurnal</th>
                                    <th className="py-3 px-4 text-left w-32">Tanggal</th>
                                    <th className="py-3 px-4 text-left">Keterangan</th>
                                    <th className="py-3 px-4 text-right w-44">Total Nominal</th>
                                    <th className="py-3 px-4 text-center w-28">Status</th>
                                    <th className="py-3 px-4 text-right w-36">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                                {loading && journals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-14 text-center text-neutral-500 text-sm">
                                            <RefreshCw className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                                            Memuat data jurnal transaksi...
                                        </td>
                                    </tr>
                                ) : journals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-14 text-center text-neutral-500 text-sm">
                                            Tidak ada transaksi jurnal yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    journals.map((j, idx) => (
                                        <tr
                                            key={j.id}
                                            onClick={() => navigate(`/akuntansi/jurnal/${j.id}`)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                        >
                                            <td className="py-3 px-4 font-mono text-neutral-500 text-xs">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {j.nomor_jurnal}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 font-mono text-sm">
                                                {j.tanggal_transaksi
                                                    ? new Date(j.tanggal_transaksi).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-snug">
                                                    {j.keterangan || '—'}
                                                </div>
                                                {j.nomor_referensi && (
                                                    <div className="text-xs text-neutral-400 font-mono mt-0.5">
                                                        Ref: {j.nomor_referensi}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-sm tabular-nums text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(j.total_debit)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={cn(
                                                        'inline-block px-2.5 py-0.5 rounded-none text-xs font-semibold uppercase tracking-wider border',
                                                        j.status === 'posted'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : j.status === 'reversed'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                                : 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
                                                    )}
                                                >
                                                    {j.status}
                                                </span>
                                            </td>
                                            <td
                                                className="py-3 px-4 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View */}
                                                    <Can permission="akuntansi.jurnal.view">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-8 rounded-none border border-blue-200 text-blue-500 bg-blue-50/20 hover:bg-blue-100/50 hover:text-blue-600 p-0 shadow-none"
                                                            title="Lihat Detail"
                                                            onClick={() => navigate(`/akuntansi/jurnal/${j.id}`)}
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                    </Can>

                                                    {j.status === 'draft' && (
                                                        <>
                                                            <Can permission="akuntansi.jurnal.edit">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-8 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                                    title="Edit"
                                                                    onClick={() => navigate(`/akuntansi/jurnal/${j.id}/edit`)}
                                                                >
                                                                    <Edit3 className="size-4" />
                                                                </Button>
                                                            </Can>

                                                            <Can permission="akuntansi.jurnal.post">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-8 rounded-none border border-emerald-200 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-100/50 hover:text-emerald-700 p-0 shadow-none"
                                                                    title="Posting ke Buku Besar"
                                                                    onClick={() => handlePost(j.id)}
                                                                >
                                                                    <CheckCircle className="size-4" />
                                                                </Button>
                                                            </Can>

                                                            <Can permission="akuntansi.jurnal.delete">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-8 rounded-none border border-rose-200 text-rose-500 bg-rose-50/20 hover:bg-rose-100/50 hover:text-rose-600 p-0 shadow-none"
                                                                    title="Hapus"
                                                                    onClick={() => setDeleteId(j.id)}
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </Can>
                                                        </>
                                                    )}

                                                    {j.status === 'posted' && (
                                                        <>
                                                            <Can permission="akuntansi.jurnal.post">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-8 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                                    title="Batalkan Posting (Unpost ke Draft)"
                                                                    onClick={() => handleUnpost(j.id)}
                                                                >
                                                                    <Undo2 className="size-4" />
                                                                </Button>
                                                            </Can>

                                                            <Can permission="akuntansi.jurnal.reverse">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-8 rounded-none border border-purple-200 text-purple-600 bg-purple-50/20 hover:bg-purple-100/50 hover:text-purple-700 p-0 shadow-none"
                                                                    title="Balik Jurnal (Reversal)"
                                                                    onClick={() => setReverseTarget(j)}
                                                                >
                                                                    <RotateCcw className="size-4" />
                                                                </Button>
                                                            </Can>
                                                        </>
                                                    )}

                                                    {j.status === 'reversed' && (
                                                        <>
                                                            <Can permission="akuntansi.jurnal.post">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-8 rounded-none border border-emerald-200 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-100/50 hover:text-emerald-700 p-0 shadow-none"
                                                                    title="Posting Kembali ke Buku Besar"
                                                                    onClick={() => handlePost(j.id)}
                                                                >
                                                                    <CheckCircle className="size-4" />
                                                                </Button>
                                                            </Can>

                                                            <Can permission="akuntansi.jurnal.post">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-8 rounded-none border border-amber-200 text-amber-600 bg-amber-50/20 hover:bg-amber-100/50 hover:text-amber-700 p-0 shadow-none"
                                                                    title="Kembalikan ke Draft"
                                                                    onClick={() => handleUnpost(j.id)}
                                                                >
                                                                    <Undo2 className="size-4" />
                                                                </Button>
                                                            </Can>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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
                                Menampilkan {journals.length > 0 ? (page - 1) * perPage + 1 : 0} -{' '}
                                {Math.min(page * perPage, totalRecords)} dari {totalRecords} data
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
                                title="Halaman Pertama"
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
                                title="Halaman Sebelumnya"
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
                                title="Halaman Selanjutnya"
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
                                title="Halaman Terakhir"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Confirm Delete */}
                <ConfirmDialog
                    open={deleteId !== null}
                    onOpenChange={(open) => !open && setDeleteId(null)}
                    title="Hapus Draft Jurnal"
                    description="Apakah Anda yakin ingin menghapus draft jurnal transaksi ini? Tindakan ini tidak dapat dibatalkan."
                    confirmText="Ya, Hapus"
                    cancelText="Batal"
                    variant="destructive"
                    loading={actionLoading}
                    onConfirm={async () => {
                        if (!deleteId) return;
                        setActionLoading(true);
                        try {
                            await api.delete(`/jurnal/${deleteId}`);
                            toast.success('Jurnal berhasil dihapus');
                            setDeleteId(null);
                            fetchJournals();
                        } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Gagal menghapus jurnal');
                        } finally {
                            setActionLoading(false);
                        }
                    }}
                />

                {/* Confirm Reverse */}
                <ConfirmDialog
                    open={reverseTarget !== null}
                    onOpenChange={(open) => !open && setReverseTarget(null)}
                    title="Reverse Jurnal"
                    description={
                        reverseTarget ? (
                            <span>
                                Apakah Anda yakin ingin membalik (reverse) jurnal transaksi{' '}
                                <strong className="text-neutral-900 dark:text-neutral-100 font-semibold font-mono">
                                    "{reverseTarget.nomor_jurnal}"
                                </strong>
                                ? Status jurnal akan diubah menjadi REVERSED dan saldonya tidak akan dihitung lagi pada laporan keuangan.
                            </span>
                        ) : (
                            'Apakah Anda yakin ingin membalik jurnal ini?'
                        )
                    }
                    confirmText="Ya, Reverse"
                    cancelText="Batal"
                    variant="destructive"
                    loading={actionLoading}
                    onConfirm={async () => {
                        if (!reverseTarget) return;
                        setActionLoading(true);
                        try {
                            await api.post(`/jurnal/${reverseTarget.id}/reverse`);
                            toast.success(`Jurnal ${reverseTarget.nomor_jurnal} berhasil direverse`);
                            setReverseTarget(null);
                            fetchJournals();
                        } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Gagal membalik jurnal');
                        } finally {
                            setActionLoading(false);
                        }
                    }}
                />
            </div>
        </AppLayout>
    );
}
