import NativeSearchableSelect from '@/components/ui/native-searchable-select';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import api from '@/api/client';
import { BankAccount, BankTransaction } from '@/types/kas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Landmark,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Edit3,
    Trash2,
    CheckCircle2,
    RotateCcw,
    CheckCheck,
    Clock,
    FileCheck2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Can } from '@/components/can';

const breadcrumbs = [
    { title: 'Akuntansi', href: '/akuntansi' },
    { title: 'Transaksi Bank', href: '/kas/bank-transactions' },
];

export default function BankTransactionIndex() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [bankAccountId, setBankAccountId] = useState(searchParams.get('bank_account_id') || 'all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [jenisFilter, setJenisFilter] = useState('all');
    const [tanggalDari, setTanggalDari] = useState(defaultStart);
    const [tanggalSampai, setTanggalSampai] = useState(defaultEnd);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog state
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteTx, setDeleteTx] = useState<BankTransaction | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [reconcileTarget, setReconcileTarget] = useState<BankTransaction | null>(null);

    const loadBankAccounts = async () => {
        try {
            const res = await api.get('/kas/bank-accounts');
            setBankAccounts(res.data?.data || []);
        } catch {
            // silent
        }
    };

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                page,
                limit: perPage,
                per_page: perPage,
            };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (bankAccountId !== 'all') params.bank_account_id = bankAccountId;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (jenisFilter !== 'all') params.jenis_transaksi = jenisFilter;
            if (tanggalDari) params.tanggal_dari = tanggalDari;
            if (tanggalSampai) params.tanggal_sampai = tanggalSampai;

            const res = await api.get('/kas/bank-transactions', { params });
            const list: BankTransaction[] = res.data?.data || [];
            setTransactions(list);

            const meta = res.data?.meta;
            if (meta) {
                setTotalRecords(Number(meta.total || 0));
                setTotalPages(Number(meta.total_pages || Math.max(1, Math.ceil((meta.total || 0) / perPage))));
            } else {
                setTotalRecords(list.length);
                setTotalPages(Math.max(1, Math.ceil(list.length / perPage)));
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memuat transaksi bank');
        } finally {
            setLoading(false);
        }
    }, [page, perPage, searchTerm, bankAccountId, statusFilter, jenisFilter, tanggalDari, tanggalSampai]);

    useEffect(() => {
        loadBankAccounts();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 200);
        return () => clearTimeout(timer);
    }, [fetchTransactions]);

    const handleReset = () => {
        setSearchTerm('');
        setBankAccountId('all');
        setStatusFilter('all');
        setJenisFilter('all');
        setTanggalDari(defaultStart);
        setTanggalSampai(defaultEnd);
        setPage(1);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setActionLoading(true);
        try {
            await api.delete(`/kas/bank-transactions/${deleteId}`);
            toast.success(`Transaksi ${deleteTx?.nomor_transaksi || ''} berhasil dihapus`);
            setDeleteId(null);
            setDeleteTx(null);
            fetchTransactions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus transaksi bank');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReconcileConfirm = async () => {
        if (!reconcileTarget) return;
        setActionLoading(true);
        try {
            await api.post(`/kas/bank-transactions/${reconcileTarget.id}/reconcile`);
            toast.success(`Status rekonsiliasi ${reconcileTarget.nomor_transaksi} berhasil diperbarui`);
            setReconcileTarget(null);
            fetchTransactions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui rekonsiliasi');
        } finally {
            setActionLoading(false);
        }
    };

    const hasActiveFilters =
        searchTerm !== '' ||
        bankAccountId !== 'all' ||
        statusFilter !== 'all' ||
        jenisFilter !== 'all' ||
        tanggalDari !== defaultStart ||
        tanggalSampai !== defaultEnd;

    const totals = React.useMemo(() => {
        let penerimaan = 0;
        let pengeluaran = 0;
        transactions.forEach((tx) => {
            const nominal = Number(tx.jumlah) || 0;
            if (tx.jenis_transaksi === 'penerimaan' || tx.jenis_transaksi === 'transfer_masuk') {
                penerimaan += nominal;
            } else if (tx.jenis_transaksi === 'pengeluaran' || tx.jenis_transaksi === 'transfer_keluar') {
                pengeluaran += nominal;
            }
        });
        return {
            penerimaan,
            pengeluaran,
            net: penerimaan - pengeluaran,
        };
    }, [transactions]);

    const bankOptions = [
        { value: 'all', label: 'Semua Rekening Bank' },
        ...bankAccounts.map((b) => ({
            value: String(b.id),
            label: `${b.nama_bank} - ${b.nomor_rekening}`,
            description: `A/N: ${b.nama_rekening}`,
        })),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full">
                {/* Satu Kontainer Card Utuh (Single Unified Card Container) */}
                <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-none bg-white dark:bg-neutral-950 overflow-hidden shadow-none">
                    {/* 1. Header Bar: Title on Left, Action Buttons on Right */}
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shrink-0">
                                <Landmark className="size-4" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    Transaksi Bank (Bank Movement)
                                </h1>
                                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
                                    <span>Periode: {tanggalDari} s/d {tanggalSampai}</span>
                                    <span>•</span>
                                    <span>{totalRecords} Total Mutasi</span>
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
                                onClick={() => fetchTransactions()}
                                disabled={loading}
                                className="h-8 rounded-none border border-neutral-200 dark:border-neutral-800 text-xs px-2.5 shadow-none"
                                title="Segarkan Data"
                            >
                                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                            </Button>

                            <Can permission={['kas.bank-transaction.create', 'kas.cash-management.daily-entry']}>
                                <Button
                                    size="sm"
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-none h-8 px-3 text-xs font-semibold gap-1.5 shadow-none"
                                    onClick={() => navigate('/kas/bank-transactions/create')}
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tambah Transaksi Bank</span>
                                </Button>
                            </Can>
                        </div>
                    </div>

                    {/* 2. Shaded Filter Strip */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 px-4 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {/* Search */}
                            <div>
                                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                                    Cari No. Transaksi / Pihak
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari voucher, keterangan..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 pl-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Rekening Bank */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                                    Rekening Bank
                                </label>
                                <SearchableSelect
                                    options={bankOptions}
                                    value={bankAccountId}
                                    onChange={(val) => {
                                        setBankAccountId(val);
                                        setPage(1);
                                    }}
                                    placeholder="Semua Rekening Bank"
                                    className="h-8 text-xs rounded-none border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
                                />
                            </div>

                            {/* Jenis Mutasi (Synced with Laravel) */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                                    Jenis Mutasi
                                </label>
                                <NativeSearchableSelect
                                    value={jenisFilter}
                                    onChange={(e) => {
                                        setJenisFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs text-neutral-900 dark:text-neutral-100 rounded-none shadow-none outline-none cursor-pointer font-medium"
                                >
                                    <option value="all">Semua Jenis Mutasi</option>
                                    <option value="penerimaan">Penerimaan Bank (Masuk)</option>
                                    <option value="pengeluaran">Pengeluaran Bank (Keluar)</option>
                                    <option value="transfer_masuk">Transfer Masuk</option>
                                    <option value="transfer_keluar">Transfer Keluar</option>
                                </NativeSearchableSelect>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-1">
                                    Status Jurnal
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

                            {/* Dari Tanggal */}
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

                            {/* Sampai Tanggal */}
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

                    {/* 3. Strip Ringkasan Saldo Mutasi Bank (Flat Divided Strip like Buku Besar - No Floating Nested Cards) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 divide-x divide-neutral-200 dark:divide-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 text-xs font-mono">
                        <div className="px-4 py-2.5">
                            <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Total Penerimaan (Masuk)</span>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                                {formatRupiah(totals.penerimaan)}
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Total Pengeluaran (Keluar)</span>
                            <span className="text-sm font-bold text-rose-700 dark:text-rose-400 block mt-0.5">
                                {formatRupiah(totals.pengeluaran)}
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Net Mutasi Kas Bank</span>
                            <span className={cn("text-sm font-bold block mt-0.5", totals.net >= 0 ? "text-neutral-900 dark:text-neutral-100" : "text-rose-600")}>
                                {formatRupiah(totals.net)}
                            </span>
                        </div>
                        <div className="px-4 py-2.5">
                            <span className="text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">Total Transaksi</span>
                            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block mt-0.5">
                                {totalRecords} Data
                            </span>
                        </div>
                    </div>

                    {/* 3. Table Section */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/80 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-left w-10 whitespace-nowrap">No</th>
                                    <th className="py-2.5 px-3 text-left w-36 whitespace-nowrap">No. Transaksi</th>
                                    <th className="py-2.5 px-3 text-left w-28 whitespace-nowrap">Tanggal</th>
                                    <th className="py-2.5 px-3 text-left w-44">Rekening Bank</th>
                                    <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">Jenis</th>
                                    <th className="py-2.5 px-3 text-left">Pihak Terkait & Keterangan</th>
                                    <th className="py-2.5 px-3 text-right w-36 whitespace-nowrap">Nominal (Rp)</th>
                                    <th className="py-2.5 px-3 text-center w-24 whitespace-nowrap">Rekonsiliasi</th>
                                    <th className="py-2.5 px-3 text-center w-20 whitespace-nowrap">Status</th>
                                    <th className="py-2.5 px-3 text-right w-32 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className={cn("divide-y divide-neutral-100 dark:divide-neutral-900 transition-opacity duration-150", loading && "opacity-50 pointer-events-none")}>
                                {loading && transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-neutral-500 text-xs">
                                            <RefreshCw className="size-4 animate-spin inline-block mr-2 text-neutral-400" />
                                            Memuat mutasi transaksi bank...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-neutral-500 text-xs italic font-mono">
                                            Tidak ada data transaksi bank yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx, idx) => (
                                        <tr
                                            key={tx.id}
                                            onClick={() => navigate(`/kas/bank-transactions/${tx.id}`)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 cursor-pointer transition select-none"
                                        >
                                            <td className="py-1.5 px-3 font-mono text-neutral-500 text-xs whitespace-nowrap">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="py-1.5 px-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none inline-block">
                                                    {tx.nomor_transaksi}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs whitespace-nowrap">
                                                {tx.tanggal_transaksi
                                                    ? new Date(tx.tanggal_transaksi).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : '-'}
                                            </td>
                                            <td className="py-1.5 px-3 max-w-[180px]">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100 text-xs truncate" title={tx.bank_account?.nama_bank}>
                                                    {tx.bank_account?.nama_bank || '-'}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 font-mono leading-none truncate">
                                                    {tx.bank_account?.nomor_rekening || '-'}
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        'inline-block px-1.5 py-0.5 rounded-none text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap',
                                                        tx.jenis_transaksi === 'penerimaan' || tx.jenis_transaksi === 'transfer_masuk'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                                    )}
                                                >
                                                    {tx.jenis_transaksi?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-3 max-w-xs xl:max-w-md">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs leading-tight truncate" title={tx.pihak_terkait || '-'}>
                                                    {tx.pihak_terkait || '-'}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 truncate leading-tight" title={tx.keterangan || '-'}>
                                                    {tx.keterangan || '-'}
                                                </div>
                                            </td>
                                            <td
                                                className={cn(
                                                    'py-1.5 px-3 text-right font-mono font-bold text-xs tabular-nums whitespace-nowrap',
                                                    tx.jenis_transaksi === 'pengeluaran' || tx.jenis_transaksi === 'transfer_keluar'
                                                        ? 'text-rose-600 dark:text-rose-400'
                                                        : 'text-emerald-700 dark:text-emerald-400'
                                                )}
                                            >
                                                {tx.jenis_transaksi === 'pengeluaran' || tx.jenis_transaksi === 'transfer_keluar' ? '- ' : '+ '}
                                                {formatRupiah(Number(tx.jumlah) || 0)}
                                            </td>
                                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReconcileTarget(tx);
                                                    }}
                                                    className={cn(
                                                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[11px] font-semibold uppercase tracking-wider border transition-colors whitespace-nowrap',
                                                        tx.is_reconciled
                                                            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                                            : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                                                    )}
                                                    title="Klik untuk mengubah status rekonsiliasi koran"
                                                >
                                                    {tx.is_reconciled ? (
                                                        <>
                                                            <CheckCheck className="size-3" />
                                                            <span>Cocok</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="size-3" />
                                                            <span>Belum</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        'inline-block px-1.5 py-0 rounded-none text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap',
                                                        tx.status === 'posted'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                                    )}
                                                >
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td
                                                className="py-1.5 px-3 text-right whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <Can permission={['kas.bank-transaction.view', 'kas.cash-management.view']}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 rounded-none text-neutral-600 hover:text-neutral-900"
                                                            onClick={() => navigate(`/kas/bank-transactions/${tx.id}`)}
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Button>
                                                    </Can>

                                                    {tx.status === 'draft' ? (
                                                        <>
                                                            <Can permission={['kas.bank-transaction.edit', 'kas.cash-management.daily-entry']}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 rounded-none text-neutral-600 hover:text-neutral-900"
                                                                    onClick={() => navigate(`/kas/bank-transactions/${tx.id}/edit`)}
                                                                    title="Edit"
                                                                >
                                                                    <Edit3 className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                            <Can permission={['kas.bank-transaction.post', 'kas.cash-management.daily-entry']}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 rounded-none text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                    onClick={() => navigate(`/kas/bank-transactions/${tx.id}/post-to-journal`)}
                                                                    title="Posting ke Jurnal"
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                            <Can permission={['kas.bank-transaction.delete', 'kas.cash-management.daily-entry']}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 rounded-none text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                                    onClick={() => {
                                                                        setDeleteId(tx.id);
                                                                        setDeleteTx(tx);
                                                                    }}
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </Can>
                                                        </>
                                                    ) : (
                                                        <Can permission="akuntansi.jurnal.view">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0 rounded-none text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                                                onClick={() => navigate(`/kas/bank-transactions/${tx.id}/post-to-journal`)}
                                                                title="Lihat Jurnal"
                                                            >
                                                                <FileCheck2 className="size-3.5" />
                                                            </Button>
                                                        </Can>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Pagination Section */}
                    <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                        <div className="flex items-center gap-2">
                            <span>Baris per halaman:</span>
                            <NativeSearchableSelect
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="h-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 rounded-none text-xs text-neutral-800 dark:text-neutral-200 outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </NativeSearchableSelect>
                            <span className="text-neutral-400">|</span>
                            <span>
                                Total <strong>{totalRecords}</strong> data mutasi bank
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span>
                                Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
                            </span>
                            <div className="flex items-center gap-0.5 ml-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(1)}
                                    disabled={page <= 1 || loading}
                                    className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    title="Halaman Pertama"
                                >
                                    <ChevronsLeft className="size-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1 || loading}
                                    className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    title="Halaman Sebelumnya"
                                >
                                    <ChevronLeft className="size-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages || loading}
                                    className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    title="Halaman Berikutnya"
                                >
                                    <ChevronRight className="size-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(totalPages)}
                                    disabled={page >= totalPages || loading}
                                    className="h-7 w-7 p-0 rounded-none border-neutral-200 dark:border-neutral-800 shadow-none"
                                    title="Halaman Terakhir"
                                >
                                    <ChevronsRight className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog Hapus */}
            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => {
                    if (!open && !actionLoading) {
                        setDeleteId(null);
                        setDeleteTx(null);
                    }
                }}
                title="Hapus Transaksi Bank"
                description={`Apakah Anda yakin ingin menghapus voucher transaksi bank ${deleteTx?.nomor_transaksi || ''} senilai ${formatRupiah(Number(deleteTx?.jumlah) || 0)}? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="destructive"
                loading={actionLoading}
                onConfirm={handleDeleteConfirm}
            />

            {/* Confirm Dialog Rekonsiliasi Bank */}
            <ConfirmDialog
                open={reconcileTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !actionLoading) {
                        setReconcileTarget(null);
                    }
                }}
                title="Rekonsiliasi Rekening Koran"
                description={
                    reconcileTarget?.is_reconciled
                        ? `Ubah status transaksi ${reconcileTarget?.nomor_transaksi} kembali menjadi "Belum Cocok" dengan rekening koran?`
                        : `Tandai transaksi ${reconcileTarget?.nomor_transaksi} sebesar ${formatRupiah(Number(reconcileTarget?.jumlah) || 0)} telah sesuai dengan rekening koran (Cocok)?`
                }
                confirmText="Konfirmasi"
                cancelText="Batal"
                loading={actionLoading}
                onConfirm={handleReconcileConfirm}
            />
        </AppLayout>
    );
}
