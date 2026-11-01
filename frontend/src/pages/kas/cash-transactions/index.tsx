import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { CashTransaction, CashSummary } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
    Receipt,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit3,
    Trash2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    Send,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Can } from '@/components/can';

const breadcrumbs = [

    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Transaksi Kas', href: '/kas/cash-transactions' },
];

export default function CashTransactionIndex() {
    const navigate = useNavigate();

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const [transactions, setTransactions] = useState<CashTransaction[]>([]);
    const [summary, setSummary] = useState<CashSummary | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [jenisFilter, setJenisFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tanggalDari, setTanggalDari] = useState(defaultStart);
    const [tanggalSampai, setTanggalSampai] = useState(defaultEnd);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    // Confirm Delete Dialog
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                page,
                per_page: perPage,
            };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (jenisFilter && jenisFilter !== 'all') params.jenis_transaksi = jenisFilter;
            if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
            if (tanggalDari) params.tanggal_dari = tanggalDari;
            if (tanggalSampai) params.tanggal_sampai = tanggalSampai;

            const res = await api.get('/kas/cash-transactions', { params });
            const data = res.data?.data || [];
            const meta = res.data?.meta;
            setTransactions(data);
            setSummary(res.data?.summary || null);
            setTotalRecords(meta?.total || 0);
            setTotalPages(meta?.last_page || 1);
        } catch {
            toast.error('Gagal mengambil daftar transaksi kas');
        } finally {
            setLoading(false);
        }
    }, [page, perPage, searchTerm, jenisFilter, statusFilter, tanggalDari, tanggalSampai]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setActionLoading(true);
        try {
            await api.delete(`/kas/cash-transactions/${deleteId}`);
            toast.success('Transaksi kas berhasil dihapus');
            setDeleteId(null);
            fetchTransactions();
        } catch {
            toast.error('Gagal menghapus transaksi kas');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full space-y-4">
                {/* Unified Single Container */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">

                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Receipt className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Transaksi Kas (Petty Cash & BKM / BKK)
                                </h1>
                                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
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
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fetchTransactions}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission={['kas.cash-transaction.create', 'kas.cash-management.daily-entry']}>
                                <Button
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    onClick={() => navigate('/kas/cash-transactions/create')}
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Transaksi Kas</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {/* Search */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                                    Cari No. / Pihak / Ket
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari transaksi kas..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Jenis Filter */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                                    Jenis Kas
                                </label>
                                <NativeSearchableSelect
                                    value={jenisFilter}
                                    onChange={(e) => {
                                        setJenisFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Jenis</option>
                                    <option value="penerimaan">Kas Masuk (BKM)</option>
                                    <option value="pengeluaran">Kas Keluar (BKK)</option>
                                </NativeSearchableSelect>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
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
                                </NativeSearchableSelect>
                            </div>

                            {/* Tanggal Dari */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
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
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
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

                    {/* 3. Strip Ringkasan Saldo Kas (Flat Divided Strip like Buku Besar - No Floating Nested Cards) */}
                    {summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 text-xs font-mono">
                            <div className="px-4 py-2.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Total Kas Masuk (Posted)</span>
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                                    {formatRupiah(summary.total_penerimaan)}
                                </span>
                            </div>
                            <div className="px-4 py-2.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Total Kas Keluar (Posted)</span>
                                <span className="text-sm font-bold text-rose-700 dark:text-rose-400 block mt-0.5">
                                    {formatRupiah(summary.total_pengeluaran)}
                                </span>
                            </div>
                            <div className="px-4 py-2.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Saldo Bersih Kas</span>
                                <span className={cn(
                                    'text-sm font-bold block mt-0.5',
                                    Number(summary.saldo_kas) < 0 ? 'text-rose-600 font-semibold' : 'text-neutral-900 dark:text-white'
                                )}>
                                    {formatRupiah(summary.saldo_kas)}
                                </span>
                            </div>
                            <div className="px-4 py-2.5">
                                <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Menunggu Posting</span>
                                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block mt-0.5">
                                    {summary.total_draft} Draft
                                </span>
                            </div>
                        </div>
                    )}
                    {/* 4. Tabel Transaksi Kas */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/75 dark:bg-neutral-900/75 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">No. Transaksi</th>
                                    <th className="py-2.5 px-3 w-28 whitespace-nowrap">Tanggal</th>
                                    <th className="py-2.5 px-3 w-32 whitespace-nowrap">Jenis Kas</th>
                                    <th className="py-2.5 px-3 w-44">Akun Kas</th>
                                    <th className="py-2.5 px-3 w-44">Akun Lawan</th>
                                    <th className="py-2.5 px-3">Pihak Terkait & Keterangan</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Jumlah (Rp)</th>
                                    <th className="py-2.5 px-3 text-center w-24 whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-500 text-xs font-mono">
                                            <RefreshCw className="size-4 animate-spin inline mr-2 text-neutral-400" />
                                            Memuat transaksi kas...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-neutral-400 text-xs italic font-mono">
                                            Tidak ada data transaksi kas yang sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => {
                                        const isMasuk = tx.jenis_transaksi === 'penerimaan';
                                        const jumlahNum = Number(tx.jumlah || 0);

                                        return (
                                            <tr key={tx.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition">
                                                <td className="py-1.5 px-3 font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                                                    {tx.nomor_transaksi}
                                                </td>
                                                <td className="py-1.5 px-3 font-mono text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                    {tx.tanggal_transaksi ? tx.tanggal_transaksi.split('T')[0] : '-'}
                                                </td>
                                                <td className="py-1.5 px-3 whitespace-nowrap">
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 border rounded-none whitespace-nowrap',
                                                        isMasuk
                                                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                                                            : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                                                    )}>
                                                        {isMasuk ? <ArrowDownLeft className="size-3 shrink-0" /> : <ArrowUpRight className="size-3 shrink-0" />}
                                                        <span>{isMasuk ? 'BKM (Masuk)' : 'BKK (Keluar)'}</span>
                                                    </span>
                                                </td>
                                                <td className="py-1.5 px-3 max-w-[170px]">
                                                    <div className="font-medium text-neutral-800 dark:text-neutral-200 text-xs truncate" title={tx.daftar_akun_kas?.nama_akun}>
                                                        {tx.daftar_akun_kas?.nama_akun || '-'}
                                                    </div>
                                                    {tx.daftar_akun_kas?.kode_akun && (
                                                        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                                            {tx.daftar_akun_kas.kode_akun}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-1.5 px-3 max-w-[170px]">
                                                    <div className="font-medium text-neutral-800 dark:text-neutral-200 text-xs truncate" title={tx.daftar_akun_lawan?.nama_akun}>
                                                        {tx.daftar_akun_lawan?.nama_akun || (
                                                            <span className="text-neutral-400 italic font-mono text-xs">Saat Posting Jurnal</span>
                                                        )}
                                                    </div>
                                                    {tx.daftar_akun_lawan?.kode_akun && (
                                                        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                                            {tx.daftar_akun_lawan.kode_akun}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-1.5 px-3 max-w-xs xl:max-w-md">
                                                    {tx.pihak_terkait && (
                                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate leading-tight" title={tx.pihak_terkait}>
                                                            {tx.pihak_terkait}
                                                        </div>
                                                    )}
                                                    <div className="text-neutral-600 dark:text-neutral-300 text-xs truncate leading-tight mt-0.5" title={tx.keterangan || '-'}>
                                                        {tx.keterangan || '-'}
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    'py-1.5 px-3 text-right font-mono font-bold text-xs tabular-nums whitespace-nowrap',
                                                    isMasuk ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                                )}>
                                                    {formatRupiah(jumlahNum)}
                                                </td>
                                                <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-xs font-mono uppercase font-semibold rounded-none px-2 py-0.5',
                                                            tx.status === 'posted'
                                                                ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                                                                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                                                        )}
                                                    >
                                                        {tx.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <Can permission={['kas.cash-transaction.view', 'kas.cash-management.view']}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => navigate(`/kas/cash-transactions/${tx.id}`)}
                                                                className="h-6 w-6 p-0 rounded-none text-neutral-600 hover:text-neutral-900 dark:hover:text-white"
                                                                title="Detail Transaksi Kas"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>
                                                        </Can>

                                                        {tx.status === 'draft' && (
                                                            <>
                                                                <Can permission={['kas.cash-transaction.post', 'kas.cash-management.daily-entry']}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => navigate(`/kas/cash-transactions/${tx.id}/post-to-journal`)}
                                                                        className="h-6 w-6 p-0 rounded-none text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
                                                                        title="Posting ke Jurnal Akuntansi"
                                                                    >
                                                                        <Send className="size-3.5" />
                                                                    </Button>
                                                                </Can>
                                                                <Can permission={['kas.cash-transaction.edit', 'kas.cash-management.daily-entry']}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => navigate(`/kas/cash-transactions/${tx.id}/edit`)}
                                                                        className="h-6 w-6 p-0 rounded-none text-amber-600 hover:text-amber-800"
                                                                        title="Edit Transaksi"
                                                                    >
                                                                        <Edit3 className="size-3.5" />
                                                                    </Button>
                                                                </Can>
                                                                <Can permission={['kas.cash-transaction.delete', 'kas.cash-management.daily-entry']}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setDeleteId(tx.id)}
                                                                        className="h-6 w-6 p-0 rounded-none text-rose-600 hover:text-rose-800"
                                                                        title="Hapus Transaksi Draft"
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                    </Button>
                                                                </Can>
                                                            </>
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

                    {/* 5. Pagination Footer */}
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-neutral-500">
                        <div>
                            Menampilkan {transactions.length} dari {totalRecords} transaksi kas
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page <= 1 || loading}
                                className="h-7 w-7 p-0 rounded-none"
                            >
                                <ChevronsLeft className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                                className="h-7 w-7 p-0 rounded-none"
                            >
                                <ChevronLeft className="size-3.5" />
                            </Button>

                            <span className="px-2">
                                Hal {page} dari {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                                className="h-7 w-7 p-0 rounded-none"
                            >
                                <ChevronRight className="size-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages || loading}
                                className="h-7 w-7 p-0 rounded-none"
                            >
                                <ChevronsRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog Hapus */}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Transaksi Kas"
                description="Apakah Anda yakin ingin menghapus transaksi kas draft ini? Tindakan ini tidak dapat dibatalkan."
                onConfirm={handleDelete}
                loading={actionLoading}
            />
        </AppLayout>
    );
}

